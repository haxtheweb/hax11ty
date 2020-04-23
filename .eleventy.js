module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.setTemplateFormats(["html", "md"]);
  eleventyConfig.addCollection("haxcms", function (collection) {
    // const items = collection.items.map((i) => Object.keys(i))
    const items = collection.items.map(({ outputPath, inputPath, url, data }) => {
      return {
        id: url.split(' ').join('-'),
        location: inputPath,
        title: data.title,
        parent: data.parent || null
      };
    });
    return JSON.stringify({ 
      id: "3474a06d-9d3b-4ec7-ba9b-0a448a6e685e",
      title: "Site Title",
      author: "author",
      description: "haxtheme-app",
      license: "MIT",
      metadata: {
        siteName: "Site Title",
        theme: {
          element: ""
        }
      },
      items
    });
  });
};