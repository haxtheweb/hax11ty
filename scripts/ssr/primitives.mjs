// Vendored, unmodified apart from this header, from
// https://github.com/haxtheweb/haxcms-nodejs/blob/dbe8480c4612cb02e309a28a40e57bcd5d40a823/src/lib/ssr/primitives.mjs
// (Apache-2.0, same as this repository). The kit is not in a published
// @haxtheweb/haxcms-nodejs yet. When it ships, delete scripts/ssr/ kit files
// and import it from the package instead.
/**
 * @description A small stylesheet for the HTML primitives that show up in
 * server-rendered fallback content (an element's progressive-enhancement
 * markup). It stands in for the per-element shadow styles: emitted once per
 * page, it keeps paragraphs, lists, tables and the like readable without
 * pulling a design system into every shadow root.
 *
 * It only reads the DDD custom properties (with plain fallbacks), which a page
 * defines once in a global stylesheet.
 */
export const SSR_PRIMITIVE_CSS = `
p{margin:var(--ddd-spacing-4,1rem) 0;line-height:1.5}
div,span{box-sizing:border-box}
ul,ol{margin:var(--ddd-spacing-4,1rem) 0;padding-left:var(--ddd-spacing-8,2rem)}
li{margin:var(--ddd-spacing-1,.25rem) 0}
li>ul,li>ol{margin:0}
a{color:var(--ddd-theme-default-link,#005fa9)}
mark{background:var(--ddd-theme-default-warning,#ffe58f);color:inherit;padding:0 .15em}
strong,b{font-weight:700}
em,i{font-style:italic}
code,kbd,samp{font-family:var(--ddd-font-secondary,monospace);font-size:.9em}
pre{overflow:auto;padding:var(--ddd-spacing-4,1rem);border:1px solid var(--ddd-theme-default-limestoneGray,#ccc)}
blockquote{margin:var(--ddd-spacing-4,1rem) 0;padding-left:var(--ddd-spacing-4,1rem);border-left:4px solid var(--ddd-theme-default-limestoneGray,#ccc)}
img,video,svg{max-width:100%;height:auto}
figure{margin:var(--ddd-spacing-4,1rem) 0}
figcaption{font-size:.875em}
hr{border:0;border-top:1px solid var(--ddd-theme-default-limestoneGray,#ccc)}
h1,h2,h3,h4,h5,h6{margin:var(--ddd-spacing-6,1.5rem) 0 var(--ddd-spacing-2,.5rem);line-height:1.2}
details{margin:var(--ddd-spacing-4,1rem) 0;border:1px solid var(--ddd-theme-default-limestoneGray,#ccc)}
summary{cursor:pointer;padding:var(--ddd-spacing-2,.5rem) var(--ddd-spacing-4,1rem);font-weight:700}
details>*:not(summary){padding:0 var(--ddd-spacing-4,1rem)}
table{border-collapse:collapse;width:100%;margin:var(--ddd-spacing-4,1rem) 0}
caption{text-align:left;font-weight:700;padding:var(--ddd-spacing-2,.5rem) 0}
th,td{border:1px solid var(--ddd-theme-default-limestoneGray,#ccc);padding:var(--ddd-spacing-2,.5rem);text-align:left;vertical-align:top}
th{background:var(--ddd-theme-default-limestoneLight,#f4f4f4)}
`
  .trim()
  .replace(/\n/g, "");

/**
 * @description Put the primitive stylesheet in front of server-rendered markup.
 * Emit it once per page, not once per element.
 * @param {string} markup rendered HTML
 * @returns {string} the markup preceded by <style data-ssr-primitives>
 */
export function withPrimitives(markup) {
  return `<style data-ssr-primitives>${SSR_PRIMITIVE_CSS}</style>${markup}`;
}
