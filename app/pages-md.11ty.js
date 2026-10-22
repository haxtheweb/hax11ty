/**
 * pages/<slug>/index.md: a markdown copy of each page, next to its index.html
 * like HAXcms writes it. llms.txt links to these for agents and AI crawlers.
 * Made from the rendered HTML so it matches what a HAXcms site would produce
 * whether the source file was markdown or HTML.
 */
const { htmlToMarkdown } = require("./lib/markdown.js");

module.exports = class {
  data() {
    return {
      eleventyExcludeFromCollections: true,
      pagination: { data: "collections.hax11tyOutline", size: 1, alias: "entry" },
      permalink: (data) => data.entry.outline.location.replace(/\.html$/, ".md"),
    };
  }
  render(data) {
    return htmlToMarkdown(data.entry.page.templateContent);
  }
};
