/**
 * HAXcms managed files (robots.txt, manifest.json, service-worker.js, ...),
 * rendered from the haxcms-nodejs boilerplate copies in _haxcms/site. Run
 * `npm run sync-assets` to refresh them; see lib/managed.js.
 */
const fs = require("fs");
const path = require("path");
const { MANAGED_FILES, renderManagedFile } = require("./lib/managed.js");
const settings = require("./_data/settings.js")();

module.exports = class {
  data() {
    return {
      eleventyExcludeFromCollections: true,
      eleventyAllowMissingExtension: true,
      pagination: { data: "haxcmsManagedFiles", size: 1, alias: "managedFile" },
      haxcmsManagedFiles: MANAGED_FILES,
      permalink: (data) => data.managedFile,
    };
  }
  render(data) {
    const source = fs.readFileSync(
      path.join(__dirname, "_haxcms", "site", data.managedFile),
      "utf8",
    );
    return renderManagedFile(data.managedFile, source, settings);
  }
};
