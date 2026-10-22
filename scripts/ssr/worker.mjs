/**
 * Worker for scripts/ssr-pages.mjs. Runs in its own node process so a page that
 * hangs or crashes an element cannot stop the build.
 *
 * Plain ESM. It loads the web components from the site's own build/ folder
 * (the same files the browser loads) under node, with Lit SSR's DOM shim plus
 * the inert browser surface from the vendored kit.
 *
 * Protocol: one JSON document on stdin
 *   { buildDir, registry, files: [path], skipTags: [tag], elementTimeout }
 * and one JSON document per line on stdout:
 *   { fatal, message }                       cannot run at all
 *   { start: path, tag }                     about to render an element (watchdog)
 *   { file: path, html, elements: [...] }    a page is done; html is the whole page
 *   { done: true }
 * Each element entry is { tag, status, ms, bytes?, error? } where status is one of
 *   rendered         shadow root with real content
 *   shell            shadow root with structure but no text or media
 *   light            rendered without a shadow root
 *   empty            nothing visible came out; the authored markup was kept
 *   threw            import or render failed; the authored markup was kept
 *   timeout          did not finish in time; the authored markup was kept
 *   truncated        output passed the size cap; the authored markup was kept
 *   over-budget      the page already grew by the page cap; the authored markup was kept
 *   skipped          on the skip list or marked data-ssr="false"
 */
/* eslint-disable n/no-process-exit */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire, register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { installInertDom } from "./inertDom.mjs";
import { SSR_PRIMITIVE_CSS } from "./primitives.mjs";
import { ssrSkipReason } from "./skip.mjs";
import { MAX_HTML_BYTES, collectCapped, hasContent } from "./renderTag.mjs";

// Elements found to hang node while rendering (an endless loop in synchronous
// code, which no timeout can interrupt). Kept apart from the vendored kit's
// list; the watchdog in ssr-pages.mjs would find them too, but only after a
// delay on every build.
// Most one page may grow by. Every rendered element repeats its shadow root
// styles, so a page full of elements gets big quickly; past this the remaining
// elements keep their authored markup. Same figure the kit uses per element.
const MAX_PAGE_GROWTH = MAX_HTML_BYTES;

const HANGS_UNDER_NODE = [/^rich-text-editor-/, /^rpg-character(-toast)?$/];
const hangReason = (tag) =>
  HANGS_UNDER_NODE.some((pattern) => pattern.test(tag)) ? "hangs rendering under node" : null;

const require = createRequire(import.meta.url);
const out = (doc, done) => process.stdout.write(JSON.stringify(doc) + "\n", done);

const readStdin = async () => {
  let data = "";
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return JSON.parse(data);
};

const firstLine = (error) => {
  const lines = String((error && (error.stack || error.message)) || error)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !/^at /.test(line));
  if (lines.length > 1 && /^[\w$.]*(Error|Exception):?$/.test(lines[0])) {
    return `${lines[0]} ${lines[1]}`.slice(0, 300);
  }
  return (lines[0] || "").slice(0, 300);
};

/**
 * The built components are plain ES modules without package.json files, written
 * for the browser, so node needs help:
 *  - lit and its companions must resolve to ONE copy, the one @lit-labs/ssr
 *    renders with, not the browser build next to the elements
 *  - extensionless and directory imports get ".js" / "/index.js"
 *  - files under build/ are modules even without a package.json "type"
 */
const LIT_PACKAGES = /^(lit|lit-html|lit-element|@lit\/reactive-element|@lit-labs\/ssr-client)(\/|$)/;
const RESOLVER_HOOKS = `
export async function initialize(data) {
  globalThis.__hax11tyLit = data.litRoot;
}
export async function resolve(specifier, context, nextResolve) {
  if (${LIT_PACKAGES}.test(specifier) && context.parentURL && context.parentURL.includes('/build/')) {
    return nextResolve(specifier, { ...context, parentURL: globalThis.__hax11tyLit });
  }
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const missing = error && (error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'ERR_UNSUPPORTED_DIR_IMPORT');
    if (missing) {
      for (const suffix of ['.js', '.mjs', '/index.js']) {
        try {
          return await nextResolve(specifier + suffix, context);
        } catch (e) {
          // try the next suffix
        }
      }
    }
    throw error;
  }
}
export async function load(url, context, nextLoad) {
  if (url.includes('/build/es6/') && url.endsWith('.js')) {
    return nextLoad(url, { ...context, format: 'module' });
  }
  return nextLoad(url, context);
}
`;

/**
 * Custom elements that are not inside another custom element (those render
 * their own children) or a <template>. Offsets are into the fragment string.
 */
function findTopLevelElements(parse5, fragmentHtml) {
  const fragment = parse5.parseFragment(fragmentHtml, {
    sourceCodeLocationInfo: true,
  });
  const found = [];
  const walk = (node) => {
    for (const child of node.childNodes || []) {
      if (!child.tagName) {
        continue;
      }
      const tag = child.tagName;
      if (tag.includes("-")) {
        const loc = child.sourceCodeLocation;
        if (loc && loc.endTag) {
          found.push({ tag, start: loc.startOffset, end: loc.endOffset, attrs: child.attrs });
        }
        // else: an unclosed or implied end tag; leave it for the browser
      } else if (tag !== "template" && tag !== "script" && tag !== "style") {
        walk(child);
      }
    }
  };
  walk(fragment);
  return found;
}

/**
 * What is inside the host's own declarative shadow root: from its opening
 * <template shadowrootmode> to the matching close, counting nested templates.
 */
function shadowRootBody(html) {
  const start = html.search(/<template[^>]*shadowroot/i);
  if (start === -1) {
    return null;
  }
  const tags = /<(\/?)template\b/gi;
  tags.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tags.exec(html)) !== null) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) {
      return html.slice(start, match.index);
    }
  }
  return html.slice(start);
}

function classify(html, tag) {
  // lit writes "<?>" where a template rendered nothing; it is not content, but
  // the kit's hasContent() counts it as text
  if (!hasContent(html.replace(/<\?>/g, ""), tag)) {
    return "empty";
  }
  const shadow = shadowRootBody(html);
  if (shadow === null) {
    return "light";
  }
  const text = shadow
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\?>/g, "")
    .replace(/<(?!img|svg|video|audio|iframe|canvas|picture)[^>]*>/gi, "")
    .replace(/\s+/g, "");
  return text ? "rendered" : "shell";
}

async function main() {
  const { buildDir, registry, files, skipTags = [], elementTimeout = 5000 } = await readStdin();
  const ssrPackage = require.resolve("@lit-labs/ssr/package.json");
  const ssrDir = path.dirname(ssrPackage);
  const ssrRequire = createRequire(ssrPackage);
  const parse5 = await import(pathToFileURL(ssrRequire.resolve("parse5")).href);
  const litEntry = fileURLToPath(import.meta.resolve("lit"));
  const litRoot = pathToFileURL(path.join(realpathSync(path.dirname(litEntry)), "x.js")).href;
  register("data:text/javascript," + encodeURIComponent(RESOLVER_HOOKS), {
    parentURL: import.meta.url,
    data: { litRoot },
  });
  const load = (file) => import(pathToFileURL(file).href);
  // the shim has to exist before any element module is evaluated
  await load(path.join(ssrDir, "lib", "install-global-dom-shim.js"));
  installInertDom();
  const { render } = await load(path.join(ssrDir, "lib", "render.js"));
  const { html: litHtml } = await load(litEntry);

  // anything an element logs or throws asynchronously is attributed to the
  // element being rendered at that moment
  let current = null;
  const asyncFailure = (error) => {
    if (current && !current.asyncError) {
      current.asyncError = firstLine(error);
    }
  };
  process.on("uncaughtException", asyncFailure);
  process.on("unhandledRejection", asyncFailure);
  const quiet = () => {};
  console.log = console.info = console.debug = console.warn = console.error = quiet;

  // the design system's CSS custom properties (--ddd-spacing-4 and friends),
  // read from the same build the page loads
  let variablesCss = "";
  try {
    const ddd = await load(path.join(buildDir, "@haxtheweb", "d-d-d", "lib", "DDDStyles.js"));
    variablesCss = String(ddd.DDDVariables.cssText || "");
  } catch (error) {
    out({ note: "no DDD variables: " + firstLine(error) });
  }
  // One stylesheet for the whole site, linked once from each page: the design
  // system variables, then the primitive tag styles the kit provides for markup
  // that has no shadow styles (an element that fell back to its authored
  // content). The primitives are scoped to the page content so they cannot
  // touch the rest of the page.
  out({
    globals:
      "/* design system variables, from the web component build */\n" +
      variablesCss +
      "\n/* primitive tag styles for server rendered fallback content */\n" +
      `@scope (haxcms-site-builder) {\n${SSR_PRIMITIVE_CSS.replace(/\}/g, "}\n")}}\n`,
  });

  const imported = new Map(); // tag -> null (ok) or error string
  const ensureLoaded = async (tag) => {
    if (imported.has(tag)) {
      return imported.get(tag);
    }
    let result = null;
    const specifier = registry[tag.toLowerCase()];
    const file = specifier ? path.join(buildDir, specifier) : null;
    if (!file || !existsSync(file)) {
      result = specifier ? `missing ${specifier}` : "not in wc-registry.json";
    } else {
      try {
        await load(file);
      } catch (error) {
        result = firstLine(error);
      }
    }
    imported.set(tag, result);
    return result;
  };

  const renderElement = async (markup, max) => {
    const strings = [markup];
    strings.raw = strings;
    let timer;
    const rendering = collectCapped(render(litHtml(strings)), Math.max(1, Math.min(MAX_HTML_BYTES, max)));
    const result = await Promise.race([
      rendering,
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(Symbol.for("timeout")), elementTimeout);
      }),
    ]);
    clearTimeout(timer);
    return result;
  };

  for (const file of files) {
    let page;
    try {
      page = readFileSync(file, "utf8");
    } catch (error) {
      out({ file, error: firstLine(error), elements: [] });
      continue;
    }
    const open = page.search(/<haxcms-site-builder[\s>]/i);
    const openEnd = open === -1 ? -1 : page.indexOf(">", open) + 1;
    const close = page.lastIndexOf("</haxcms-site-builder>");
    const elements = [];
    if (open === -1 || close === -1 || close < openEnd) {
      out({ file, elements, note: "no page content region" });
      continue;
    }
    const fragment = page.slice(openEnd, close);
    let replacements = [];
    try {
      replacements = findTopLevelElements(parse5, fragment);
    } catch (error) {
      out({ file, elements, error: firstLine(error) });
      continue;
    }
    // document order, so the size budget is spent on the top of the page first
    const accepted = [];
    let grown = 0;
    for (const el of replacements.sort((a, b) => a.start - b.start)) {
      const tag = el.tag;
      const raw = fragment.slice(el.start, el.end);
      const started = Date.now();
      const entry = { tag, status: "threw", ms: 0 };
      elements.push(entry);
      current = { asyncError: null };
      try {
        const dataSsr = (el.attrs.find((a) => a.name === "data-ssr") || {}).value;
        // checked before importing: skipped elements are not even loaded
        const skipped =
          dataSsr === "false"
            ? "data-ssr=false"
            : skipTags.includes(tag)
              ? "hung earlier"
              : hangReason(tag) || ssrSkipReason(tag) || null;
        if (skipped) {
          entry.status = "skipped";
          entry.error = skipped;
          continue;
        }
        if (grown >= MAX_PAGE_GROWTH) {
          entry.status = "over-budget";
          continue;
        }
        const loadError = await ensureLoaded(tag);
        if (loadError) {
          entry.error = loadError;
          continue;
        }
        // an element's own static ssr = false is only visible once it is loaded
        const skipReason = ssrSkipReason(tag, globalThis.customElements.get(tag));
        if (skipReason) {
          entry.status = "skipped";
          entry.error = skipReason;
          continue;
        }
        out({ start: file, tag });
        const result = await renderElement(raw, MAX_PAGE_GROWTH - grown);
        if (result === Symbol.for("timeout")) {
          entry.status = "timeout";
          continue;
        }
        if (result.truncated) {
          entry.status = "truncated";
          continue;
        }
        const status = classify(result.html, tag);
        entry.status = status;
        entry.bytes = result.html.length;
        if (status === "empty") {
          continue;
        }
        grown += result.html.length - raw.length;
        accepted.push({ start: el.start, end: el.end, html: result.html });
      } catch (error) {
        entry.status = "threw";
        entry.error = firstLine(error);
      } finally {
        entry.ms = Date.now() - started;
        // let a stray rejection land on this element before moving on
        await new Promise((resolve) => setImmediate(resolve));
        if (current && current.asyncError && entry.status === "threw") {
          entry.error = entry.error || current.asyncError;
        }
        current = null;
      }
    }
    let body = "";
    let cursor = 0;
    for (const { start, end, html } of accepted) {
      body += fragment.slice(cursor, start) + html;
      cursor = end;
    }
    body += fragment.slice(cursor);
    out({ file, html: page.slice(0, openEnd) + body + page.slice(close), elements });
  }
  await new Promise((resolve) => out({ done: true }, resolve));
}

// exit from the write callback: process.exit() would cut off output still
// buffered on the pipe, and elements can leave timers running
main().then(
  () => process.exit(0),
  (error) =>
    out({ fatal: "worker-crashed", message: firstLine(error) }, () => process.exit(0)),
);
