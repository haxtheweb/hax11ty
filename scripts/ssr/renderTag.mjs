// Vendored, unmodified apart from this header, from
// https://github.com/haxtheweb/haxcms-nodejs/blob/dbe8480c4612cb02e309a28a40e57bcd5d40a823/src/lib/ssr/renderTag.mjs
// (Apache-2.0, same as this repository). The kit is not in a published
// @haxtheweb/haxcms-nodejs yet. When it ships, delete scripts/ssr/ kit files
// and import it from the package instead.
/**
 * @description Render one custom element to a string with Lit SSR. The caller
 * supplies lit's `html` and @lit-labs/ssr's `render`, so this module has no
 * dependency on either and uses whichever copy of lit the elements loaded.
 */
import { ssrSkipReason } from "./skip.mjs";
import { withPrimitives } from "./primitives.mjs";

// Some elements render pages of documentation (d-d-docs is ~70 MB: every
// nested element repeats its shadow-root styles). Collect at most this much
// and stop rendering, so one element cannot exhaust memory.
export const MAX_HTML_BYTES = 8 * 1024 * 1024;

/**
 * A lit template with property bindings, built the way the HAX editor builds a
 * demoSchema entry: <tag .prop=${value}>content</tag>. Property bindings keep
 * objects, arrays and booleans intact (attributes would stringify them).
 */
export function buildTemplate(html, tag, demo) {
  const strings = [];
  const values = [];
  let current = `<${tag}`;
  const properties = (demo && demo.properties) || {};
  for (const [key, value] of Object.entries(properties)) {
    if (!/^[A-Za-z_$][\w$]*$/.test(key)) {
      continue;
    }
    current += ` .${key}=`;
    strings.push(current);
    values.push(value);
    current = "";
  }
  const content = demo && typeof demo.content === "string" ? demo.content : "";
  current += `>${content}</${tag}>`;
  strings.push(current);
  // lit checks for an own "raw" property on the strings array
  strings.raw = strings;
  return html(strings, ...values);
}

/**
 * Collect a render result into a string, stopping at MAX_HTML_BYTES.
 * @returns {Promise<{html: string, truncated: boolean}>}
 */
export async function collectCapped(result, max = MAX_HTML_BYTES) {
  let html = "";
  // for await also resolves the promises a RenderResult can contain
  for await (const chunk of result) {
    html += chunk;
    if (html.length > max) {
      return { html, truncated: true };
    }
  }
  return { html, truncated: false };
}

/**
 * The element's own light-DOM fallback: the markup its haxHooks()
 * progressiveEnhancement hook produces for the given demo properties, or null
 * when it has none (only a few elements do, e.g. meme-maker).
 */
export async function progressiveFallback(tag, demo) {
  try {
    const Element = globalThis.customElements.get(tag);
    if (!Element) {
      return null;
    }
    const el = new Element();
    const hooks = typeof el.haxHooks === "function" ? el.haxHooks() : null;
    const name = hooks && hooks.progressiveEnhancement;
    if (!name || typeof el[name] !== "function") {
      return null;
    }
    Object.assign(el, (demo && demo.properties) || {});
    const markup = await el[name](el);
    return typeof markup === "string" && markup.trim() ? markup : null;
  } catch {
    return null;
  }
}

/**
 * Single left-to-right pass that drops what a reader never sees: comments,
 * <style>/<script> elements (with their bodies) and <template> open/close tags.
 * Skipped spans are never re-scanned, so removing one cannot splice neighbouring
 * text into a new tag (unlike chained regex .replace calls).
 */
function stripInvisible(markup) {
  const lower = markup.toLowerCase();
  const isTagEnd = (c) => c === undefined || /[\s>/]/.test(c);
  let out = "";
  let i = 0;
  while (i < markup.length) {
    const lt = markup.indexOf("<", i);
    if (lt === -1) {
      out += markup.slice(i);
      break;
    }
    out += markup.slice(i, lt);
    let end = -1;
    if (lower.startsWith("<!--", lt)) {
      const close = /--!?>/g;
      close.lastIndex = lt + 4;
      const m = close.exec(markup);
      end = m ? m.index + m[0].length : markup.length;
    } else {
      for (const name of ["style", "script"]) {
        if (
          lower.startsWith(`<${name}`, lt) &&
          isTagEnd(markup[lt + name.length + 1])
        ) {
          const closeAt = lower.indexOf(`</${name}`, lt);
          if (closeAt === -1) break;
          const gt = markup.indexOf(">", closeAt);
          end = gt === -1 ? markup.length : gt + 1;
        }
      }
      if (end === -1) {
        const tpl = /^<\/?template(?=[\s>/])[^>]*>/i.exec(markup.slice(lt));
        if (tpl) end = lt + tpl[0].length;
      }
    }
    if (end === -1) {
      out += "<";
      i = lt + 1;
    } else {
      i = end;
    }
  }
  return out;
}

/**
 * True when server-rendered output has anything a reader could see: text,
 * media, or child elements. A shadow root holding only <style> does not.
 */
export function hasContent(markup, tag) {
  const inner = stripInvisible(String(markup || ""));
  const outer = new RegExp(`</?${tag}(?=[\\s>/])[^>]*>`, "gi");
  return inner.replace(outer, "").replace(/\s+/g, "") !== "";
}

/**
 * Swap an empty render for the element's own progressive-enhancement markup:
 * the host tag with the fallback as plain light DOM and no shadow root, so a
 * reader or crawler without JavaScript sees it. null when the host tag can't
 * be found.
 */
export function fallbackMarkup(markup, tag, progressive) {
  const open = new RegExp(`<${tag}(?=[\\s>/])[^>]*>`, "i").exec(markup);
  return open ? `${open[0]}${progressive}</${tag}>` : null;
}

/**
 * @param {{render: Function, html: Function}} lit lit's html and @lit-labs/ssr's render
 * @param {string} tag custom element tag name
 * @param {object} [demo] { properties, content } like a haxProperties demoSchema entry
 * @param {{primitives?: boolean, max?: number}} [options] primitives: prepend the primitive stylesheet
 * @returns {Promise<{skipped?: string, html?: string, truncated?: boolean, progressive?: string|null, usedFallback?: boolean}>}
 */
export async function renderTag(lit, tag, demo, options = {}) {
  const skipped = ssrSkipReason(tag, globalThis.customElements.get(tag));
  if (skipped) {
    return { skipped };
  }
  const { html, truncated } = await collectCapped(
    lit.render(buildTemplate(lit.html, tag, demo)),
    options.max,
  );
  const progressive = await progressiveFallback(tag, demo);
  let out = html;
  let usedFallback = false;
  if (progressive && !truncated && !hasContent(html, tag)) {
    const swapped = fallbackMarkup(html, tag, progressive);
    if (swapped) {
      out = swapped;
      usedFallback = true;
    }
  }
  return {
    html: options.primitives ? withPrimitives(out) : out,
    truncated,
    progressive,
    usedFallback,
  };
}
