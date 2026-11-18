import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Rendered markup never holds a path on the build machine. Elements resolve
// assets with import.meta.url, which is a file: URL under node, so URLs into
// the web component build become the published build path (publicBuild, e.g.
// "./build/es6/node_modules/" or a CDN) and any other file: URL makes the
// element keep its authored markup.
export function publishUrls(html, buildDir, publicBuild) {
  const roots = [buildDir];
  try {
    roots.push(realpathSync(buildDir));
  } catch {
    // the plain path is enough
  }
  const prefixes = [...new Set(roots.map((dir) => pathToFileURL(dir).href.replace(/\/?$/, "/")))];
  return html.replace(/file:\/\/[^\s"'<>()]+/g, (match) => {
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

