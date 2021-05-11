module.exports = () => {
    // this file is how you can take full control of your HAX11ty site
    // as far as the mapping metadata and paths linked to the HAXcms data model
    // This file is documented for you to modify with areas that you
    // will most likley want to change designated
    // github organization / username
    // github.com/WHATEVER
    var gitOrg = "elmsln";
    // github.com/elmsln/WHATEVER - hax11ty here implies building against the repo itself to produce it's own docs :)
    var gitProject = "hax11ty";
    // if doing github builds, automatically set these to whatever the repo issuing the call is
    // the above is just for SOME default so things below publish correctly locally
    if (process.env.GITHUB_REPOSITORY) {
        let parts = process.env.GITHUB_REPOSITORY.split("/");
        gitOrg = parts[0];
        gitProject = parts[1];
    }
    // author name will be set by the github publishing agent based on who kicks it off
    var authorName = "btopro";
    var siteAuthorImage = "files/headshot511743.1799999904.jpg";
    // person kicking off the job gets author name by default
    if (process.env.GITHUB_ACTOR) {
        authorName = process.env.GITHUB_ACTOR;
        siteAuthorImage = `https://github.com/${authorName}.png`;
    }
    // URL, default for local testing
    var url = "https://localhost:8000";
    // CDN for requesting the location of the build directory
    // from the unbundled process
    var domain = url;
    var cdnBase = "/";
    var cdnPart = "";
    // HAXCMS_CDN is set if we're publishing to a public source
    // of available web components. If you've done some local
    // development to build custom assets or modified files
    // within the app directory you won't be able to use
    // a public CDN
    if (process.env.HAXCMS_CDN) {
      cdnBase = "https://cdn.webcomponents.psu.edu"; // https://cdn.waxam.io/
      cdnPart = "/cdn/"; // /
    }
    // current year if desired
    var year = new Date().getFullYear();
    var basePath = "/";
    // useful with github exclusively
    var segmentCount = 1;
    // if the repo has a CNAME, use this for the url
    if (process.env.CNAME && process.env.CNAME != "") {
        url = process.env.CNAME;
        // set this to 0 if you have a vanity URL
        segmentCount = 0;
    }
    // when building for production, we form a github based path
    else if (process.env.HAXCMS_GITHUB) {
        // change these if you have a custom domain
        basePath = `/${gitProject}/`;
        url = `https://${gitOrg}.github.io/${gitProject}`;
    }
    else if (process.env.HAXCMS_CONTEXT == 'haxcms') {
        // change these if you have a custom domain
        basePath = `/sites/${gitProject}/`;
        url = `https://${gitOrg}.github.io/${gitProject}`;
    }
    return {
        // this is where most things you'll want to change reside
        // these defaults will at least publish but if you want to
        // modify theme specific settings or meta data for SEO, then
        // change these settings

        // email address, optional
        siteAuthorEmail: "",
        // optional twitter handle
        twitterName: "",
        // short description of the site for SEO
        siteDescription: "project documentation",
        // logo to represent the site
        siteLogo: "assets/images/photo-1497493292307-31c376b6e479.jpeg",
        // theme to use HAXcms valid theme as it appears in the wc-factory listing
        themeElement: "clean-two", // clean-two, clean-one, bootstrap-theme, learn-two-theme, or any other valid HAXcms theme
        // path to the entryway for the theme file. Not required but improves load times to have this for preloading
        themePath: "@lrnwebcomponents/clean-two/clean-two.js", // @lrnwebcomponents/clean-two/clean-two.js, @lrnwebcomponents/learn-two-theme/learn-two-theme.js, or any other valid HAXcms theme path
        // banner image used in your theme
        themeImage: "assets/banner.jpg",
        // a HEX color code to represent / accent your theme
        themeHexCode: "#55FF55",
        // icon name if the theme uses one
        themeLogo: "lrn:network",
        // general theme color
        themeColor: "green",
        // CC license, see https://creativecommons.org/licenses/ for a list
        siteLicense: "by-sa",
        // folder / machine name to represent your site
        siteMachineName: gitProject,
        // Your name as referenced as the author in files
        siteAuthorName: authorName,
        // an image of you, could be in the local files directory
        // this is used in some themes
        siteAuthorImage: siteAuthorImage,
        // visual name of your site, defaults to project repo name
        siteName: gitProject,
        // language to set on content
        lang: "en",
        // git configuration settings. This stuff is relatively specific to HAXcms
        // so set these things to your gitOrg / project from above as needed
        git: {
            autoPush: false,
            branch: "master",
            staticBranch: "gh-pages",
            vendor: "github",
            publicRepoUrl: `https://github.com/${gitOrg}/${gitProject}/blob/master/src/`,
            url: `git@github.com:${gitOrg}/${gitProject}.git`
        },
        // advanced settings don't modify unless you have a reason to do so
        version: "1.2.9-11ty", // version number of HAXcms this was created from
        cdnBuild: cdnBase + cdnPart + "build/es6/node_modules/", // deeper path directly into the build location
        cdn: cdnBase + cdnPart, // CDN full address
        preconnect: cdnBase, // preconnection domain address, performance thing
        basePath: basePath, // <base> tag's path value
        domain: domain, // domain, most likely same as url
        url: url, // url for direct access
        siteUuid: generateResourceID(), // uuid per build just for consistency
        currentYear: year, // current year
        segmentCount: segmentCount, // gh-pages 404 fallback helper
    };
};

/**
 * Generate a uinque ID
 */
function generateResourceID(base = "#") {
  function idPart() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    base +
    idPart() +
    idPart() +
    "-" +
    idPart() +
    "-" +
    idPart() +
    "-" +
    idPart() +
    "-" +
    idPart() +
    idPart() +
    idPart()
  );
}
