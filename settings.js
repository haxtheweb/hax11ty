module.exports = () => {
    var year = new Date().getFullYear();
    var basePath = "/";
    // useful with github exclusively
    var segmentCount = 1;
    // github organization / username
    var gitOrg = "btopro";
    // project name
    var gitProject = "ist402";
    // URL, default for local testing
    var url = "https://localhost:8000";
    // when building for production, we form a github based path
    if (process.env.HAXCMS_GITHUB) {
        // change these if you have a custom domain
        basePath = `/${gitProject}/`;
        url = `https://${gitOrg}.github.io/${gitProject}`;
        // set this to 0 if you have a vanity URL
        //segmentCount = 0;
    }
    else if (process.env.HAXCMS_LOCAL) {
        // change these if you have a custom domain
        basePath = `/sites/${gitProject}/`;
        url = `https://${gitOrg}.github.io/${gitProject}`;
        // set this to 0 if you have a vanity URL
        //segmentCount = 0;
    }
    // CDN for requesting the location of the build directory
    // from the unbundled process
    var cdnBase = "/";
    var cdnPart = "";
    if (process.env.HAXCMS_CDN) {
      cdnBase = "https://cdn.webcomponents.psu.edu";
      cdnPart = "/cdn/";
    }
    return {
        siteMachineName: "ist402",
        siteAuthorName: "EdTechJoker",
        siteAuthorEmail: "bto108@psu.edu",
        siteAuthorImage: "files/headshot511743.1799999904.jpg",
        siteName: "IST 402",
        siteLicense: "by-sa",
        siteDescription: "Emerging Technology",
        siteLogo: "assets/images/photo-1497493292307-31c376b6e479.jpeg",
        themeElement: "clean-one", // clean-two, learn-two-theme, or any other valid HAXcms theme
        themeImage: "assets/banner.jpg",
        themeHexCode: "#FF5500",
        themeLogo: "lrn:network",
        themeColor: "green",
        twitterName: "btopro",
        git: {
            autoPush: false,
            branch: "master",
            staticBranch: "gh-pages",
            vendor: "github",
            publicRepoUrl: `https://github.com/${gitOrg}/${gitProject}/blob/master/`,
            url: `git@github.com:${gitOrg}/${gitProject}.git`
        },
        // advanced settings don't modify
        mode: "haxcms",
        lang: "en",
        version: "1.1.2-11ty",
        cdnBuild: cdnBase + cdnPart + "build/es6/node_modules/",
        cdn: cdnBase + cdnPart,
        preconnect: cdnBase,
        basePath: basePath,
        domain: url,
        url: url,
        siteUuid: "3474a06d-9d3b-4ec7-ba9b-0a448a6e685e",
        currentYear: year,
        segmentCount: segmentCount
    };
};