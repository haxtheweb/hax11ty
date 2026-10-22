const SITEDIR = "_site";
const CONTENTDIR = "content";
//let Nunjucks = require("nunjucks");  
const crypto = require('crypto');
const fs = require('fs-extra');
const matter = require('gray-matter');
const { buildOutline, pageMetadata } = require('./lib/outline.js');
const xmlFiltersPlugin = require('eleventy-xml-plugin');
const pluginRss = require("@11ty/eleventy-plugin-rss");
const settings = require('./_data/settings.js')();
const wcRegistry = require('./wc-registry.json');
module.exports = function (eleventyConfig) {
  if (!eleventyConfig.dir) {
    eleventyConfig.dir = {};
  }
  eleventyConfig.dir.output = SITEDIR;
  // establish environment nunjuck things for templating
  /*let nunjucksEnvironment = new Nunjucks.Environment(
    new Nunjucks.FileSystemLoader("_includes")
  );
  eleventyConfig.setLibrary("njk", nunjucksEnvironment);*/
  eleventyConfig.setTemplateFormats(["html", "md", "njk", "11ty.js"]);

  // add plugins to handle xml and rss files
  eleventyConfig.addPlugin(xmlFiltersPlugin);
  eleventyConfig.addPlugin(pluginRss);

  // copy these but don't process them
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({
    "theme": "theme",
    "../src/custom/build": "custom/build",
    "../src/files": "files",
    "build.js": "build.js",
    "build-haxcms.js": "build-haxcms.js",
    "wc-registry.json": "wc-registry.json",
    "wc-registry-graph.json": "wc-registry-graph.json",
    ".well-known/agent-skills": ".well-known/agent-skills",
  });
  // don't copy the build directory if we are using a CDN
  if (!process.env.HAXCMS_CDN) {
    eleventyConfig.addPassthroughCopy({
      "build": "build",
    });
  }
  // collections make it easier to work with the data in templates
  eleventyConfig.addCollection("manifest", function (collection) {
    return JSON.stringify({
      name: settings.siteName,
      short_name: settings.siteName,
      description: settings.siteDescription,
      icons: [
        {
          "src": "assets/android-icon-36x36.png",
          "sizes": "36x36",
          "type": "image/png",
          "density": "0.75"
        },
        {
          "src": "assets/android-icon-48x48.png",
          "sizes": "48x48",
          "type": "image/png",
          "density": "1.0"
        },
        {
          "src": "assets/android-icon-72x72.png",
          "sizes": "72x72",
          "type": "image/png",
          "density": "1.5"
        },
        {
          "src":"assets/android-icon-96x96.png",
          "sizes": "96x96",
          "type": "image/png",
          "density": "2.0"
        },
        {
          "src": "assets/android-icon-144x144.png",
          "sizes": "144x144",
          "type": "image/png",
          "density": "3.0"
        },
        {
          "src": "assets/android-icon-192x192.png",
          "sizes": "192x192",
          "type": "image/png",
          "density": "4.0",
          "purpose": "any maskable" 
        },
        {
          "src": "assets/ms-icon-310x310.png",
          "sizes": "512x512",
          "type": "image/png",
          "density": "4.0"
        }
      ],
      scope: settings.basePath,
      start_url: settings.basePath,
      display: "standalone",
      theme_color: settings.themeHexCode,
      background_color: settings.themeHexCode,
      url: settings.url,
      lang: settings.lang,
      screenshots: [],
      orientation: "portrait"
    }, null, 2);
  });
  // Read off the content and generate preload statements to match
  eleventyConfig.addShortcode('getContentPreloads', function(content){
    if (!content) {
      return '';
    }
    // custom element tag names used anywhere in the page (with or without attributes)
    const tags = new Set();
    const regex = /<([a-z][a-z0-9._]*-[a-z0-9._-]*)(?=[\s/>])/gi;
    let found;
    while ((found = regex.exec(content)) !== null) {
      tags.add(found[1].toLowerCase());
    }
    tags.delete('haxcms-site-builder');
    let contentPreload = '';
    for (const tag of tags) {
      if (wcRegistry[tag]) {
        contentPreload += '  <link rel="modulepreload" href="' + settings.assetBase + 'build/es6/node_modules/' + wcRegistry[tag] + '" />' + "\n";
      }
    }
    return contentPreload;
  });
  // get the context from
  eleventyConfig.addShortcode('getHAXCMSContext', function(){
    if (process.env.HAXCMS_CONTEXT) {
      return process.env.HAXCMS_CONTEXT;
    }
    return '11ty';
  });
  // plain text summary of rendered HTML, for meta descriptions and search
  eleventyConfig.addFilter('hax11tyExcerpt', function(html, length = 200) {
    if (typeof html !== 'string') {
      return '';
    }
    return html
      .replace(/<(script|style|template)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/?[^>]+(>|$)/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substr(0, length)
      .trim();
  });
  // excerpt
  eleventyConfig.addShortcode('excerpt', function(article) {
    if (!article.hasOwnProperty('templateContent')) {
      console.warn('Failed to extract excerpt: Document has no property "templateContent".');
      return null;
    }
     
    let excerpt = null;
    const content = article.templateContent;
    excerpt = content.replace(/<\/?[^>]+(>|$)/g, "").replace(/\\/g, " ").replace(/\n/g, "").substr(0, 1000).trim();
    return excerpt;
  });
  eleventyConfig.addCollection("swHashData", function (collection) {
    let items = collection.items.map(({ outputPath, url, data }, i) => {
      if (!url.includes("/build/")) {
        return [
          (settings.basePath + url).replace('//', '/'),
          hashFromValue(data.page.date.toString()).substr(0, 16).replace(/\//g,'z').replace(/\+/g,'y').replace(/\=/g,'x').replace(/\-/g,'w', settings.siteUuid)
        ];
      }
    });
    items.push([settings.basePath,items[0][1]]);
    const itemsFiltered = items.filter((item) => {
      if (item && item.length > 0) {
        return true;
      }
      return false;
    });
    return JSON.stringify(itemsFiltered, null, 2);
  });
  // simplify access to the flobal settings
  eleventyConfig.addCollection("globals", function (collection) {
    return settings;
  });
  eleventyConfig.addShortcode("getGlobal", function(varName) {
    return settings[varName];
  });
  // Every page under content/, with its place in the HAXcms outline.
  // Returns [{ page: <11ty collection item>, outline: <site.json item> }] in
  // outline order. Page bodies (page.templateContent) are only available once
  // 11ty renders, so templates read them from here at render time.
  eleventyConfig.addCollection("hax11tyOutline", computeOutline);
  // site.json: the HAXcms outline, same shape HAXcms writes
  eleventyConfig.addCollection("haxcms", function (collection) {
    return JSON.stringify({
      id: settings.siteUuid,
      title: settings.siteName,
      author: settings.siteAuthorName,
      description: settings.siteDescription,
      license: settings.siteLicense,
      metadata: {
        author: {
          image: settings.siteAuthorImage,
          name: settings.siteAuthorName,
          email: settings.siteAuthorEmail,
          socialLink: "https://twitter.com/" + settings.twitterName
        },
        site: {
          name: settings.siteMachineName,
          created: Date.now(),
          updated: Date.now(),
          git: settings.git,
          version: settings.version,
          domain: settings.domain,
          logo: settings.siteLogo,
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
          element: settings.themeElement,
          variables: {
            image: settings.themeImage,
            hexCode: settings.themeHexCode,
            cssVariable: "--simple-colors-default-theme-" + settings.themeColor + "-7",
            logo: settings.themeLogo
          }
        }
      },
      items: computeOutline(collection).map((entry) => entry.outline)
    }, null, 2);
  });
  // basePath always has / and 11ty always puts / in front of the URLs
  // that it finds. This helps resolve the path based on what the exported
  // location is. Publishing to a production environment vs local
  // development one is what this is helping resolve the differences of
  eleventyConfig.addShortcode("absoluteBasePath", function(url) {
    return (settings.basePath + url).replace('//', '/');
  });

  eleventyConfig.addShortcode("getLicenseInfo", function(license, varName) {
    return getLicenseInfo(license)[varName];
  });
};
function computeOutline(collection) {
  const pages = collection.getFilteredByTag("content");
  const entries = pages.map((page) => {
    // only the file's own front matter, not the merged data cascade
    const source = fs.readFileSync(page.inputPath, "utf8");
    const frontMatter = matter(source).data || {};
    const stats = fs.statSync(page.inputPath);
    const created = toEpoch(frontMatter.date, stats.birthtimeMs);
    const updated = toEpoch(frontMatter.updated, stats.mtimeMs);
    return {
      slug: page.data.haxSlug,
      title: page.data.title ? String(page.data.title) : page.data.haxSlug,
      description: frontMatter.description,
      order: frontMatter.order !== undefined && frontMatter.order !== null && frontMatter.order !== '' && Number.isFinite(Number(frontMatter.order)) ? Number(frontMatter.order) : undefined,
      created: created,
      updated: updated,
      readtime: Math.max(1, Math.round(countWords(matter(source).content) / 200)),
      metadata: pageMetadata(frontMatter),
      __page: page,
    };
  });
  const items = buildOutline(entries);
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry.__page]));
  return items.map((outline) => ({ page: bySlug.get(outline.slug), outline }));
}
/**
 * Seconds since the epoch from a front matter date, else from a file time in ms
 */
function toEpoch(value, fallbackMs) {
  const parsed = value ? new Date(value).getTime() : NaN;
  return Math.round((isNaN(parsed) ? fallbackMs : parsed) / 1000);
}
/**
 * Count words
 */
function countWords(str) {
  return str.trim().split(/\s+/).length;
}
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
function hashFromValue(value = '', uuid = '')
{
  return hmacBase64(value, uuid);
}
function hmacBase64(data, key)
{
  var buf1 = crypto.createHmac("sha256", "0").update(data).digest();
  var buf2 = Buffer.from(key);
  // generate the hash
  return Buffer.concat([buf1, buf2]).toString('base64');
}