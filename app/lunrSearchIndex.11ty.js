/**
 * lunrSearchIndex.json: the corpus HAXcms uses for site search, one record
 * per page.
 */
module.exports = class {
  data() {
    return {
      permalink: "lunrSearchIndex.json",
      eleventyExcludeFromCollections: true,
    };
  }
  render(data) {
    const text = (html) =>
      String(html || "")
        .replace(/<(script|style|template)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<\/?[^>]+(>|$)/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const base = data.settings.basePath;
    return JSON.stringify(
      data.collections.hax11tyOutline.map(({ page, outline }) => ({
        id: outline.id,
        title: outline.title,
        created: outline.metadata.created,
        location: (base + outline.slug + "/").replace("//", "/"),
        description: outline.description || text(page.templateContent).slice(0, 200),
        text: text(page.templateContent).slice(0, 1000),
      })),
      null,
      2,
    );
  }
};
