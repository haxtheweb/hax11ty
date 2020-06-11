module.exports = () => {
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
        siteAuthorImage: "https://btopro.com/files/headshot511743.1799999904.jpg",
        siteName: "IST 402",
        siteLicense: "by-sa",
        siteDescription: "Emerging Technology",
        siteLogo: "/assets/images/photo-1497493292307-31c376b6e479.jpeg",
        themeElement: "learn-two-theme",
        themeImage: "/assets/banner.jpg",
        themeHexCode: "#FFFF00",
        themeLogo: "lrn:network",
        themeColor: "green",
        twitterName: "elmsln",
        git: {
            autoPush: false,
            branch: "master",
            staticBranch: "gh-pages",
            vendor: "github",
            publicRepoUrl: "https://github.com/btopro/ist402/blob/master/",
            url: "git@github.com:btopro/ist402.git"
        },
        // advanced settings
        mode: "pro",
        lang: "en",
        version: "1.1.2-11ty",
        cdnBuild: cdnBase + cdnPart + "build/es6/node_modules/",
        cdn: cdnBase + cdnPart,
        preconnect: cdnBase,
        basePath: "/",
        domain: "https://localhost:8000",
        url: "https://localhost:8000",
        siteUuid: "3474a06d-9d3b-4ec7-ba9b-0a448a6e685e"
    };
};