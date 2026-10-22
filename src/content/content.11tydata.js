// Applies to every file under src/content/.
// You normally do not need to change this file.
const { deriveSlug } = require("../../app/lib/slug.js");

module.exports = {
  // the "content" tag is what puts a file in the HAXcms outline
  tags: ["content"],
  layout: "content.liquid",
  eleventyComputed: {
    // path in the outline, see app/lib/slug.js
    haxSlug: (data) => deriveSlug(data.page.filePathStem, data.slug),
    // the page's shell: every page is its own URL, /<slug>/
    permalink: (data) => `${deriveSlug(data.page.filePathStem, data.slug)}/index.html`,
  },
};
