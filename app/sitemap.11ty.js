/**
 * sitemap.xml: the home page and every page in the outline.
 */
module.exports = class {
  data() {
    return {
      permalink: "sitemap.xml",
      eleventyExcludeFromCollections: true,
    };
  }
  render(data) {
    const escape = (text) =>
      String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const base = data.settings.url.replace(/\/$/, "");
    const entry = (location, epochSeconds, priority) =>
      `  <url>\n    <loc>${escape(location)}</loc>\n` +
      `    <lastmod>${new Date(epochSeconds * 1000).toISOString()}</lastmod>\n` +
      `    <priority>${priority}</priority>\n  </url>\n`;
    const pages = data.collections.hax11tyOutline;
    const newest = pages.reduce((max, { outline }) => Math.max(max, outline.metadata.updated), 0);
    return (
      '<?xml version="1.0" encoding="utf-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      (pages.length ? entry(base + "/", newest, "1.0") : "") +
      pages.map(({ outline }) => entry(`${base}/${outline.slug}/`, outline.metadata.updated, "0.8")).join("") +
      "</urlset>\n"
    );
  }
};
