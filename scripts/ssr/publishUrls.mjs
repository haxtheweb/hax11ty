// Vendored, unmodified apart from this header, from
// https://github.com/haxtheweb/haxcms-nodejs/blob/c804af3e7889784e609cbbc58d7eb9ae50c41bd5/src/lib/ssr/publishUrls.mjs
// (Apache-2.0, same as this repository). The kit is not in a published
// @haxtheweb/haxcms-nodejs yet. When it ships, delete scripts/ssr/ kit files
// and import it from the package instead.
/**
 * @description Server-rendered markup never holds a path on the machine that
 * rendered it. Elements resolve assets with import.meta.url, which is a file:
 * URL under node (simple-icon builds its SVG href that way), so URLs into the
 * web component build are rewritten to the build path the published page
 * loads from. Anything else that is still a file: URL means the render is not
 * fit to publish, and the caller keeps the element's authored markup.
 */
import { realpathSync } from "node:fs";
import { URL, pathToFileURL } from "node:url";

const FILE_URL = /file:\/\/[^\s"'<>()]+/g;

/**
 * @param {string} html rendered markup
 * @param {string} buildDir folder the elements were loaded from on this machine
 *   (the build/es6/node_modules folder)
 * @param {string} publicBuild where the published page loads that folder from,
 *   e.g. "./build/es6/node_modules/" or a CDN URL ending in "/"
 * @returns {string} html with file: URLs into buildDir rewritten
 */
export function publishUrls(html, buildDir, publicBuild) {
  const roots = [buildDir];
  try {
    roots.push(realpathSync(buildDir));
  } catch {
    // the path as given is enough
  }
  const prefixes = [
    ...new Set(
      roots.map((dir) => pathToFileURL(dir).href.replace(/\/?$/, "/")),
    ),
  ];
  return String(html).replace(FILE_URL, (match) => {
    let url;
    try {
      url = new URL(match).href;
    } catch {
      return match;
    }
    for (const prefix of prefixes) {
      if (url.startsWith(prefix)) {
        return publicBuild + url.slice(prefix.length);
      }
    }
    return match;
  });
}

/**
 * @param {string} html rendered markup
 * @returns {boolean} true when it still points at a file on this machine
 */
export function hasLocalPath(html) {
  return /file:\/\//i.test(String(html));
}
