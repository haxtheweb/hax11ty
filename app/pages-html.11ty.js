/**
 * pages/<slug>/index.html: the page body alone, without the site shell. This is
 * the file site.json points at and the HAXcms page loader fetches, the same
 * layout and file name HAXcms writes for every page.
 */
module.exports = class {
  data() {
    return {
      eleventyExcludeFromCollections: true,
      pagination: { data: "collections.hax11tyOutline", size: 1, alias: "entry" },
      permalink: (data) => data.entry.outline.location,
    };
  }
  render(data) {
    return data.entry.page.templateContent;
  }
};
