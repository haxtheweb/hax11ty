const SITEDIR = "_site";
const CONTENTDIR = "content";
//let Nunjucks = require("nunjucks");  
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const xmlFiltersPlugin = require('eleventy-xml-plugin');
const pluginRss = require("@11ty/eleventy-plugin-rss");
const settings = require('./_data/settings.js')();
const wcRegistry = require('./unbundled-webcomponents/app/dist/wc-registry.json');
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
  eleventyConfig.setTemplateFormats(["html","md", "njk"]);
  // copy this directory but DO NOT inject grey matter
  // this allows HAXcms to render content bare but with DX writing title data in head matter
  if (!fs.existsSync(process.cwd() + '/' + SITEDIR + '/')) {
    fs.mkdirSync(process.cwd() + '/' + SITEDIR + '/');
  }
  copyFolderSyncWithoutGreyMatter(CONTENTDIR, 'pages')

  // add plugins to handle xml and rss files
  eleventyConfig.addPlugin(xmlFiltersPlugin);
  eleventyConfig.addPlugin(pluginRss);

  // copy these but don't process them
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy({
    "theme": "theme",
    "custom": "custom",
    "unbundled-webcomponents/app/dist/assets": "assets",
    "unbundled-webcomponents/app/dist/build.js": "build.js",
    "unbundled-webcomponents/app/dist/wc-registry.json": "wc-registry.json",
  });
  // don't copy the build directory if we are using a CDN
  if (!process.env.HAXCMS_CDN) {
    eleventyConfig.addPassthroughCopy({
      "unbundled-webcomponents/app/dist/build": "build",
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
    const regex = /<(?:\"-[^\"]*\"['\"]*|'[^']*'['\"]*|[^'\">])+>/g;
    const found = content.match(regex);
    let preloadTags = [];
    found.map((val, i) => {
      let test = val.replace('>', '').replace('</', '');
      if (test.includes('-') && test != 'haxcms-site-builder') {
        preloadTags.push(test);
      }
    });
    let contentPreload = '';
    // load wc-registry.json
    for (var tag in preloadTags) {
      if (wcRegistry[preloadTags[tag]]) {
        contentPreload += '  <link rel="preload" href="' + settings.cdn + 'build/es6/node_modules/' + wcRegistry[preloadTags[tag]] + '" as="script" crossorigin="anonymous" />' + "\n";
        contentPreload += '  <link rel="modulepreload" href="' + settings.cdn + 'build/es6/node_modules/' + wcRegistry[preloadTags[tag]] + '" />' + "\n";
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
  eleventyConfig.addCollection("searchDataOrder", function(collection) {
    return collection.getFilteredByGlob(CONTENTDIR + "/**/*.md").sort((a,b) => {
      if(a.data.title < b.data.title) return -1;
      if(a.data.title > b.data.title) return 1;
      return 0;
    });
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
  eleventyConfig.addCollection("haxcms", function (collection) {
    const items = collection.items.map(({ outputPath, inputPath, url, data }, i) => {
      if (url.includes("/" + CONTENTDIR + "/")) {
        let parentID = null;
        // parent test path
        let test = inputPath.split('/');
        test.pop();
        // you have to use index.whatever for accurate parent nesting
        test = (test.join('/') + '/index.').replace(/\./g,'-').replace(/\//g,'-');
        // ensure that we don't set ourselves as the parent
        if (test != inputPath.replace('md', '').replace('html', '').replace('njk', '').replace(/\./g,'-').replace(/\//g,'-')) {
          data.collections.all.forEach((item) => {
            if (item.inputPath.replace('md', '').replace('html', '').replace('njk', '').replace(/\./g,'-').replace(/\//g,'-') == test) {
              parentID = item.inputPath.replace(/\./g,'-').replace(/\//g,'-');
            }
          });
        }
        // @todo try and wire this up after verifying this file exists
        // if the file exists then we know it's a parent of the current folder in the tree
        // which means we can set the parent id and it'll work
        let slug;
        if (data.slug) {
          slug = data.slug;
        }
        else {
          slug = url.split('/');
          slug.shift();
          slug = slug.join('/');
        }
        let order = (data.order ? data.order : i);
        // get page contents to analyze
        const pageContent = fs.readFileSync(process.cwd() + inputPath.replace('./','/'), "utf8");
        // get read time
        let readtime = Math.round(countWords(pageContent) / 200);
        // get file stats
        const stats = fs.statSync(inputPath);
        let created = Math.round(stats.birthtimeMs / 1000);
        let updated = Math.round(stats.mtimeMs / 1000);
        // account for uber small body
        if (readtime == 0) {
          readtime = 1;
        }
        const pageData = data;
        // strip off these globals we don't need
        // @note DO NOT DELETE LAYOUT. 11ty needs this to process the templates
        delete pageData.collections;
        delete pageData.haxcms;
        delete pageData.pkg;
        delete pageData.haxcmsAppstore;
        delete pageData.settings;
        delete pageData.HAXenabled;
        // this is actually page processing data so drop it too
        delete pageData.page;
        // load up headmatter
        return {
          id: inputPath.replace(/\./g,'-').replace(/\//g,'-'),
          indent: 0,
          location: inputPath.replace('/' + CONTENTDIR + '/','/pages/'),
          slug: slug,
          order: order,
          title: data.title ? data.title : 'Title',
          description: data.title ? data.title : 'Description',
          parent: parentID,
          metadata: {
            created: created,
            updated: updated,
            readtime: readtime,
            contentDetails: {},
            files: [],
            ...pageData
          }
        };
      }
    });
    const pageItems = items.filter((item) => {
      if (item && item.slug) {
        return true;
      }
      return false;
    }).sort(function(a, b) {
      return parseFloat(a.order) - parseFloat(b.order);
    });
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
      items: pageItems
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
/**
 * This strips off the grey matter from input files and writes to output folder
 */
function copyFolderSyncWithoutGreyMatter(from, to, appendBase = true) {
  if (appendBase) {
    from = process.cwd() + '/' + from;
    to = process.cwd() + '/' + SITEDIR + '/' + to;
  }
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to);
  }
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      // read in data
      var fileData = matter.read(path.join(from, element));
      if (fs.lstatSync(path.join(from, element)).isFile()) {
        fs.writeFileSync(path.join(to, element).replace('.md','.json').replace('.html','.json'), JSON.stringify(fileData.data, null, 2));
      }
      fileData.data = {};
      fs.writeFileSync(path.join(to, element), matter.stringify(fileData));
    } else {
      copyFolderSyncWithoutGreyMatter(path.join(from, element), path.join(to, element), false);
    }
  });
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