module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.setTemplateFormats(["html", "md"]);
  eleventyConfig.addCollection("haxcms", function (collection) {
    // const items = collection.items.map((i) => Object.keys(i))
    const items = collection.items.map(({ outputPath, inputPath, url, data }, i) => {
      return {
        id: inputPath,
        indent: 0,
        location: url,
        order: i,
        title: data.title ? data.title : 'Title',
        description: data.title ? data.title : 'Description',
        parent: null,
        metadata: {
          created: 1565898366,
          updated: 1584404503,
          readtime: 0,
          contentDetails: {},
          files: []
        }
      };
    });
    return JSON.stringify({ 
      id: globals.siteUuid,
      title: globals.siteName,
      author: globals.siteAuthor,
      description: globals.siteDescription,
      license: globals.siteLicense,
      metadata: {
        author: {
          image: "",
          name: "EdTechJoker",
          email: "bto108@psu.edu",
          socialLink: "https://twitter.com/haxcamp"
        },
        site: {
          name: "ist402",
          created: 1565898366,
          updated: 1586461733,
          git: {
            autoPush: false,
            branch: "master",
            staticBranch: "gh-pages",
            vendor: "github",
            publicRepoUrl: "https://github.com/btopro/ist402/blob/master/",
            url: "git@github.com:btopro/ist402.git"
          },
          version: "1.1.2",
          domain: "",
          logo: globals.siteLogo,
          static: {
            cdn: "build",
            offline: false
          },
          settings: {
            pathauto: false,
            publishPagesOn: false,
            forceUpgrade: true,
            sw: false
          }
        },
        theme: {
          element: ""
        }
      },
      items
    });
  });
  eleventyConfig.addShortcode("getGlobal", function(name) {
    return (globals[name] ? globals[name] : null);
  });
};

const globals = {
  siteUuid: "3474a06d-9d3b-4ec7-ba9b-0a448a6e685e",
  siteAuthor: "The author",
  siteName: "IST 402",
  siteLicense: "by-sa",
  siteDescription: "Emerging Technology",
  siteLogo: "/assets/images/photo-1497493292307-31c376b6e479.jpeg",
  preconnect: "https://cdn.webcomponents.psu.edu/",
  cdn: "https://cdn.webcomponents.psu.edu/cdn/"
};