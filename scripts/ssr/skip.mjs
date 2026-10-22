// Vendored, unmodified apart from this header, from
// https://github.com/haxtheweb/haxcms-nodejs/blob/dbe8480c4612cb02e309a28a40e57bcd5d40a823/src/lib/ssr/skip.mjs
// (Apache-2.0, same as this repository). The kit is not in a published
// @haxtheweb/haxcms-nodejs yet. When it ships, delete scripts/ssr/ kit files
// and import it from the package instead.
/**
 * @description Elements known not to server-render. Server pipelines (and
 * `hax audit ssr`) skip these instead of importing and rendering them: they
 * need a real browser (WebGL, audio, layout) so they only ever fail or come
 * back empty on the server. Most are third-party elements, so the marker lives
 * here; an element of our own can opt out with a static `ssr = false`.
 */
export const SSR_SKIP = {
  "model-viewer":
    "3D model viewer (third-party): needs WebGL and a browser DOM to render",
  "midi-player":
    "MIDI player (third-party): needs browser audio APIs and the Node global",
};

/**
 * @param {string} tag custom element tag name
 * @param {Function} [ctor] the registered element class, when it is loaded
 * @returns {string|null} why the element is skipped, or null to render it
 */
export function ssrSkipReason(tag, ctor) {
  if (ctor && ctor.ssr === false) {
    return typeof ctor.ssrSkipReason === "string"
      ? ctor.ssrSkipReason
      : "marked ssr = false";
  }
  return Object.prototype.hasOwnProperty.call(SSR_SKIP, tag)
    ? SSR_SKIP[tag]
    : null;
}
