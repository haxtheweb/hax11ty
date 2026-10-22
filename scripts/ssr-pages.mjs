#!/usr/bin/env node
/**
 * Server render the web components in each built page (Lit SSR), so the HTML
 * has their content in it before any script runs: readable by search engines,
 * AI crawlers and anyone with JavaScript off. On by default.
 *
 *   node scripts/ssr-pages.mjs [siteDir]      siteDir defaults to app/_site
 *
 * Turn it off with HAX11TY_SSR=0 (or `ssr: false` in src/settings.js).
 *
 * This step can never fail a build. If an element cannot be rendered (it
 * throws, hangs, produces nothing, or is too large) that element keeps the
 * markup the author wrote and the rest of the page is still rendered. If the
 * whole step breaks, the pages are left exactly as 11ty wrote them. It is a
 * report, not a gate: the summary says how many elements rendered cleanly and
 * how many fell back, and the exit code is always 0.
 *
 * Each page is processed in a child process (scripts/ssr/worker.mjs) with a
 * watchdog, because an element stuck in synchronous code cannot be timed out
 * from inside its own process.
 */
import { spawn } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

const ELEMENT_TIMEOUT = 5000;
// no output at all for this long means the worker is stuck in synchronous code
const WATCHDOG = ELEMENT_TIMEOUT * 2;
const MAX_RESTARTS_PER_PAGE = 5;
// a rendered page this much bigger than the original is not written
const MAX_PAGE_BYTES = 32 * 1024 * 1024;

const CLEAN = ["rendered", "shell", "light"];

// linked from every page that was rendered, and removed again by the page's
// own script once the web components take over (see base.liquid)
const GLOBAL_CSS = "assets/hax11ty-ssr.css";
const GLOBAL_LINK = `  <link rel="stylesheet" href="${GLOBAL_CSS}" data-ssr-only />\n`;


export function ssrEnabled(env = process.env, settings = {}) {
  const flag = env.HAX11TY_SSR;
  if (typeof flag === "string" && flag !== "") {
    return !["0", "false", "off", "no"].includes(flag.toLowerCase());
  }
  return settings.ssr !== false;
}

function pagesToRender(siteDir) {
  const files = [];
  const home = path.join(siteDir, "index.html");
  if (existsSync(home)) {
    files.push(home);
  }
  try {
    const manifest = JSON.parse(readFileSync(path.join(siteDir, "site.json"), "utf8"));
    for (const item of manifest.items || []) {
      const file = path.join(siteDir, item.slug, "index.html");
      if (existsSync(file)) {
        files.push(file);
      }
    }
  } catch {
    // no outline: only the home page is rendered
  }
  // a page that links the SSR stylesheet was already rendered
  return files.filter((file) => !readFileSync(file, "utf8").includes(GLOBAL_CSS));
}

/**
 * Run the worker over the files. Resolves with one result per page that came
 * back, plus the pages that did not.
 */
function runWorker({ files, buildDir, registry, skipTags }, onResult, onGlobals) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, "scripts", "ssr", "worker.mjs")], {
      cwd: root,
      stdio: ["pipe", "pipe", "inherit"],
    });
    let buffer = "";
    let last = { file: null, tag: null };
    let finished = false;
    let timer;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        finished = "hung";
        child.kill("SIGKILL");
      }, WATCHDOG);
    };
    const handle = (line) => {
      let doc;
      try {
        doc = JSON.parse(line);
      } catch {
        return;
      }
      arm();
      if (doc.fatal) {
        finished = "fatal";
        console.log(`  worker could not start: ${doc.message}`);
      } else if (doc.globals) {
        onGlobals(doc.globals);
      } else if (doc.start) {
        last = { file: doc.start, tag: doc.tag };
      } else if (doc.file) {
        onResult(doc);
        last = { file: null, tag: null };
      } else if (doc.done) {
        finished = finished || "done";
      }
    };
    child.stdout.on("data", (chunk) => {
      buffer += chunk;
      let i;
      while ((i = buffer.indexOf("\n")) !== -1) {
        handle(buffer.slice(0, i));
        buffer = buffer.slice(i + 1);
      }
    });
    child.on("error", () => {
      finished = finished || "fatal";
    });
    child.on("close", () => {
      clearTimeout(timer);
      resolve({ status: finished || "crashed", last });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(
      JSON.stringify({ buildDir, registry, files, skipTags, elementTimeout: ELEMENT_TIMEOUT }),
    );
    arm();
  });
}

function withGlobalStyles(html) {
  return html.includes(GLOBAL_CSS) ? html : html.replace(/<\/head>/i, GLOBAL_LINK + "</head>");
}

function writePage(file, html) {
  const tmp = file + ".ssr.tmp";
  writeFileSync(tmp, html);
  renameSync(tmp, file);
}

export async function renderSite(siteDir, buildDir, log = console.log) {
  const report = { pages: [], elements: {}, errors: {}, skippedPages: [] };
  let registry = {};
  try {
    registry = JSON.parse(readFileSync(path.join(buildDir, "..", "..", "..", "wc-registry.json"), "utf8"));
  } catch {
    // the registry sits beside build/; without it nothing can be loaded
  }
  let globalsWritten = false;
  const queue = pagesToRender(siteDir);
  const attempts = new Map();
  const skipTags = [];
  const done = new Set();
  while (queue.length) {
    const files = queue.filter((file) => !done.has(file));
    if (!files.length) {
      break;
    }
    const outcome = await runWorker({ files, buildDir, registry, skipTags }, (doc) => {
      done.add(doc.file);
      const entry = { file: path.relative(siteDir, doc.file), elements: doc.elements || [] };
      report.pages.push(entry);
      for (const el of entry.elements) {
        report.elements[el.status] = (report.elements[el.status] || 0) + 1;
        if (el.error && !CLEAN.includes(el.status)) {
          const key = `${el.tag}: ${el.error}`;
          report.errors[key] = (report.errors[key] || 0) + 1;
        }
      }
      const changed = entry.elements.some((el) => CLEAN.includes(el.status));
      if (
        doc.html &&
        changed &&
        globalsWritten &&
        doc.html.length < MAX_PAGE_BYTES &&
        /<\/html>\s*$/i.test(doc.html)
      ) {
        try {
          writePage(doc.file, withGlobalStyles(doc.html));
        } catch (error) {
          log(`  could not write ${entry.file}: ${error.message}`);
        }
      }
    }, (css) => {
      // the stylesheet has to exist before any page links to it
      try {
        mkdirSync(path.join(siteDir, "assets"), { recursive: true });
        writeFileSync(path.join(siteDir, GLOBAL_CSS), css);
        globalsWritten = true;
      } catch (error) {
        log(`  could not write ${GLOBAL_CSS}, pages left unrendered: ${error.message}`);
      }
    });
    if (outcome.status === "done" || outcome.status === "fatal") {
      break;
    }
    // hung or crashed: whatever page was in flight is retried without the
    // element that was running; pages never reached are left as they are
    const { file, tag } = outcome.last;
    const remaining = files.filter((f) => !done.has(f));
    if (file && remaining.includes(file)) {
      const tries = (attempts.get(file) || 0) + 1;
      attempts.set(file, tries);
      if (tag) {
        skipTags.push(tag);
        report.elements.hung = (report.elements.hung || 0) + 1;
        report.errors[`${tag}: worker ${outcome.status} while rendering`] =
          (report.errors[`${tag}: worker ${outcome.status} while rendering`] || 0) + 1;
      }
      if (tries >= MAX_RESTARTS_PER_PAGE) {
        done.add(file);
        report.skippedPages.push(path.relative(siteDir, file));
      }
    } else {
      // nothing in flight: the worker itself died; stop rather than loop
      for (const f of remaining) {
        report.skippedPages.push(path.relative(siteDir, f));
      }
      break;
    }
  }
  return report;
}

function summarize(report) {
  const total = Object.values(report.elements).reduce((a, b) => a + b, 0);
  const clean = CLEAN.reduce((sum, status) => sum + (report.elements[status] || 0), 0);
  const lines = [
    `SSR: ${report.pages.length} pages, ${total} elements: ${clean} rendered cleanly, ${total - clean} kept their authored markup`,
  ];
  const detail = Object.entries(report.elements)
    .map(([status, n]) => `${status} ${n}`)
    .join(", ");
  if (detail) {
    lines.push(`  ${detail}`);
  }
  for (const [message, n] of Object.entries(report.errors).slice(0, 10)) {
    lines.push(`  fell back (${n}x) ${message}`);
  }
  if (report.skippedPages.length) {
    lines.push(`  left unrendered: ${report.skippedPages.join(", ")}`);
  }
  return lines.join("\n");
}

async function main() {
  const siteDir = path.resolve(process.argv[2] || path.join(root, "app", "_site"));
  let settings = {};
  try {
    settings = require(path.join(root, "src", "settings.js"))();
  } catch {
    // defaults apply
  }
  if (!ssrEnabled(process.env, settings)) {
    console.log("SSR: off (HAX11TY_SSR=0 or ssr: false in src/settings.js)");
    return;
  }
  const buildDir = path.join(root, "app", "build", "es6", "node_modules");
  if (!existsSync(buildDir)) {
    console.log(`SSR: skipped, no web component build at ${path.relative(root, buildDir)} (run npm run sync-assets)`);
    return;
  }
  const started = Date.now();
  const report = await renderSite(siteDir, buildDir);
  console.log(summarize(report) + `\n  ${((Date.now() - started) / 1000).toFixed(1)}s`);
  try {
    writeFileSync(path.join(root, "app", "ssr-report.json"), JSON.stringify(report, null, 2) + "\n");
    if (process.env.GITHUB_STEP_SUMMARY) {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, "```\n" + summarize(report) + "\n```\n");
    }
  } catch {
    // the report is a convenience
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(
    () => process.exit(0),
    (error) => {
      // never fail the build
      console.log(`SSR: skipped, ${error && error.message}`);
      process.exit(0);
    },
  );
}
