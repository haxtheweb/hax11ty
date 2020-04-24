// @todo should be able to auto gen much of this / peg it to a JSON file
const cdnBase = "https://cdn.webcomponents.psu.edu";
const globals = {
  basePath: "/",
  url: "https://localhost:8000",
  siteUuid: "3474a06d-9d3b-4ec7-ba9b-0a448a6e685e",
  siteMachineName: "ist402",
  siteAuthorName: "EdTechJoker",
  siteAuthorEmail: "bto108@psu.edu",
  siteAuthorImage: "https://btopro.com/files/headshot511743.1799999904.jpg",
  siteName: "IST 402",
  siteLicense: "by-sa",
  siteDescription: "Emerging Technology",
  siteLogo: "/assets/images/photo-1497493292307-31c376b6e479.jpeg",
  preconnect: cdnBase,
  cdnBuild: cdnBase + "/cdn/build/es6/node_modules/",
  cdn: cdnBase + "/cdn/",
  hexCode: "#FFFF00",
  lang: "en",
  twitterName: "elmsln"
};
let Nunjucks = require("nunjucks");  
const crypto = require('crypto');
const xmlFiltersPlugin = require('eleventy-xml-plugin');
const pluginRss = require("@11ty/eleventy-plugin-rss");
module.exports = function (eleventyConfig) {
  let nunjucksEnvironment = new Nunjucks.Environment(
    new Nunjucks.FileSystemLoader("_includes")
  );
  eleventyConfig.setLibrary("njk", nunjucksEnvironment);
  eleventyConfig.addPlugin(xmlFiltersPlugin);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("service-worker.js");
  eleventyConfig.setTemplateFormats(["html", "md", "njk"]);
  eleventyConfig.addCollection("manifest", function (collection) {
    return {
      name: globals.siteName,
      short_name: globals.siteName,
      description: globals.siteDescription,
      icons: [
        {
          "src": "/assets/android-icon-36x36.png",
          "sizes": "36x36",
          "type": "image/png",
          "density": "0.75"
        },
        {
          "src": "/assets/android-icon-48x48.png",
          "sizes": "48x48",
          "type": "image/png",
          "density": "1.0"
        },
        {
          "src": "/assets/android-icon-72x72.png",
          "sizes": "72x72",
          "type": "image/png",
          "density": "1.5"
        },
        {
          "src": "/assets/android-icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png",
          "density": "2.0"
        },
        {
          "src": "/assets/android-icon-144x144.png",
          "sizes": "144x144",
          "type": "image/png",
          "density": "3.0"
        },
        {
          "src": "/assets/android-icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "density": "4.0"
        },
        {
          "src": "/assets/ms-icon-310x310.png",
          "sizes": "512x512",
          "type": "image/png",
          "density": "4.0"
        }
      ],
      scope: globals.basePath,
      start_url: globals.url,
      display: "standalone",
      theme_color: globals.hexCode,
      background_color: globals.hexCode,
      url: globals.url,
      lang: globals.lang,
      screenshots: [],
      orientation: "portrait"
    };
  });
  eleventyConfig.addCollection("swHashData", function (collection) {
    // const items = collection.items.map((i) => Object.keys(i))
    const items = collection.items.map(({ outputPath, url, data }, i) => {
      return [
        url,
        hashFromValue(data.page.date.toString()).substr(0, 16).replace(/\//g,'z').replace(/\+/g,'y').replace(/\=/g,'x').replace(/\-/g,'w')
      ];
    });
    return JSON.stringify(items, null, 2);
  });
  eleventyConfig.addCollection("globals", function (collection) {
    return globals;
  });
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
      author: globals.siteAuthorName,
      description: globals.siteDescription,
      license: globals.siteLicense,
      metadata: {
        author: {
          image: globals.siteAuthorImage,
          name: globals.siteAuthorName,
          email: globals.siteAuthorEmail,
          socialLink: "https://twitter.com/" + globals.twitterName
        },
        site: {
          name: globals.siteMachineName,
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

  eleventyConfig.addShortcode("getLicenseInfo", function(varName) {
    return getLicenseInfo(globals.siteLicense)[varName];
  });
};
/**
 * License data for common open license
 */
function getLicenseInfo(license = 'by-sa')
{
    let list = {
        "by":{
            'name':"Creative Commons: Attribution",
            'link':"https://creativecommons.org/licenses/by/4.0/",
            'image':"https://i.creativecommons.org/l/by/4.0/88x31.png"
        },
        "by-sa":{
            'name':"Creative Commons: Attribution Share a like",
            'link':"https://creativecommons.org/licenses/by-sa/4.0/",
            'image':"https://i.creativecommons.org/l/by-sa/4.0/88x31.png"
        },
        "by-nd":{
            'name':"Creative Commons: Attribution No derivatives",
            'link':"https://creativecommons.org/licenses/by-nd/4.0/",
            'image':"https://i.creativecommons.org/l/by-nd/4.0/88x31.png"
        },
        "by-nc":{
            'name':"Creative Commons: Attribution non-commercial",
            'link':"https://creativecommons.org/licenses/by-nc/4.0/",
            'image':"https://i.creativecommons.org/l/by-nc/4.0/88x31.png"
        },
        "by-nc-sa":{
            'name' :
                "Creative Commons: Attribution non-commercial share a like",
            'link':"https://creativecommons.org/licenses/by-nc-sa/4.0/",
            'image' :
                "https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png"
        },
        "by-nc-nd":{
            'name' :
                "Creative Commons: Attribution Non-commercial No derivatives",
            'link':"https://creativecommons.org/licenses/by-nc-nd/4.0/",
            'image' :
                "https://i.creativecommons.org/l/by-nc-nd/4.0/88x31.png"
        }
    };
    if (list[license]) {
      return list[license];
    }
    return {};
}
function hashFromValue(value = '')
{
  return hmacBase64(value, globals.siteUuid);
}
function hmacBase64(data, key)
{
  var buf1 = crypto.createHmac("sha256", "0").update(data).digest();
  var buf2 = Buffer.from(key);
  // generate the hash
  return Buffer.concat([buf1, buf2]).toString('base64');
}