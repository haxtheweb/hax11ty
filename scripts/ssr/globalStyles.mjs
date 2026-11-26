// Vendored, unmodified apart from this header, from
// https://github.com/haxtheweb/haxcms-nodejs/blob/d2a85cb75777edbbd4fc62905f86cbfb169b9c6c/src/lib/ssr/globalStyles.mjs
// (Apache-2.0, same as this repository). The kit is not in a published
// @haxtheweb/haxcms-nodejs yet. When it ships, delete scripts/ssr/ kit files
// and import it from the package instead.
/**
 * @description The page-level stylesheet for server-rendered output, emitted
 * once per page: the primitive-tag rules (primitives.mjs) followed by the
 * design system's global sheet.
 *
 * In the browser the design system manager puts that sheet on the document
 * from JavaScript. Under Lit SSR there is no document.body, so it never
 * arrives and every `--ddd-*` custom property a shadow root reads is undefined
 * until the page hydrates. Emitting it here gives rendered and shell elements
 * their tokens (colour, spacing, type) without JavaScript, and custom
 * properties inherit into every shadow root, so one copy serves the page.
 *
 * The caller supplies the design system's styles (lit CSSResults, strings or
 * nested arrays of them), so this module depends on no element package. For
 * DDD that is `DDDAllStyles` from @haxtheweb/d-d-d/lib/DDDStyles.js for the
 * whole sheet the browser gets, or `DDDVariables` alone for only the tokens.
 */
import { SSR_PRIMITIVE_CSS } from "./primitives.mjs";

/**
 * @param {*} styles a string, an object with cssText (lit CSSResult), or
 *   arrays of those nested to any depth; anything else is ignored
 * @returns {string} the CSS text, in order
 */
export function cssTextOf(styles) {
  if (typeof styles === "string") {
    return styles;
  }
  if (Array.isArray(styles)) {
    return styles.map(cssTextOf).join("");
  }
  if (styles && typeof styles.cssText === "string") {
    return styles.cssText;
  }
  return "";
}

/**
 * @description Drop comments and collapse runs of whitespace in one pass.
 * Quoted strings are copied as they are, so `content: "  "` keeps its spaces
 * and a comment marker inside a string is not treated as a comment.
 * @param {string} css
 * @returns {string}
 */
export function compactCss(css) {
  const text = String(css || "");
  let out = "";
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"' || c === "'") {
      let end = i + 1;
      while (end < text.length && text[end] !== c) {
        end += text[end] === "\\" ? 2 : 1;
      }
      out += text.slice(i, end + 1);
      i = end + 1;
    } else if (c === "/" && text[i + 1] === "*") {
      const close = text.indexOf("*/", i + 2);
      i = close === -1 ? text.length : close + 2;
    } else if (/\s/.test(c)) {
      while (i < text.length && /\s/.test(text[i])) {
        i += 1;
      }
      // a comment between two runs of whitespace leaves one space, not two
      if (!out.endsWith(" ")) {
        out += " ";
      }
    } else {
      out += c;
      i += 1;
    }
  }
  return out.trim();
}

/**
 * @param {*} [styles] the design system's global styles (see cssTextOf)
 * @param {{primitives?: boolean, compact?: boolean}} [options] primitives:
 *   start with the primitive-tag rules (default true); compact: drop comments
 *   and extra whitespace from the design system's CSS (default true)
 * @returns {string} CSS for one <style> or one .css file per page
 */
export function globalCss(styles, options = {}) {
  const system = cssTextOf(styles);
  // primitives first: where both style a tag, the design system wins
  return (
    (options.primitives === false ? "" : SSR_PRIMITIVE_CSS) +
    (options.compact === false ? system : compactCss(system))
  );
}

/**
 * @description Put the page-level stylesheet in front of server-rendered
 * markup. Emit it once per page, not once per element.
 * @param {string} markup rendered HTML
 * @param {string} css from globalCss()
 * @returns {string} the markup preceded by <style data-ssr-global>
 */
export function withGlobalStyles(markup, css) {
  // "</" cannot end the style element early; "<\/" reads the same in CSS
  const safe = String(css || "").replace(/<\//g, "<\\/");
  return `<style data-ssr-global>${safe}</style>${markup}`;
}
