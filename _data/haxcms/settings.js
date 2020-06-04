module.exports = () => {
    // @todo should be able to auto gen much of this / peg it to a JSON file
    //const cdnBase = "https://cdn.webcomponents.psu.edu";
    const cdnBase = "/";
    return {
    mode: "haxcms",
    //cdnBuild: cdnBase + "/cdn/build/es6/node_modules/",
    //cdn: cdnBase + "/cdn/",
    cdnBuild: cdnBase + "build/es6/node_modules/",
    cdn: cdnBase,
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
    hexCode: "#FFFF00",
    lang: "en",
    twitterName: "elmsln"
    };
};