module.exports = () => {
  return `window.appSettings = ${JSON.stringify({
    login: "/login.php?redirect_url=/login.php",
    refreshUrl: "/mgp140/system/api/refreshAccessToken",
    logout: "/mgp140/system/api/logout",
    redirectUrl: "/login.php?redirect_url=/login.php",
    themes: {
      "learn-two-theme": {
        element: "learn-two-theme",
        path: "@lrnwebcomponents/learn-two-theme/learn-two-theme.js",
        name: "Learn",
      },
      "haxor-slevin": {
        element: "haxor-slevin",
        path: "@lrnwebcomponents/haxor-slevin/haxor-slevin.js",
        name: "Coder blog",
      },
      "outline-player": {
        element: "outline-player",
        path: "@lrnwebcomponents/outline-player/outline-player.js",
        name: "Documentation",
      },
      "simple-blog": {
        element: "simple-blog",
        path: "@lrnwebcomponents/simple-blog/simple-blog.js",
        name: "Simple blog",
      },
      "haxcms-basic-theme": {
        element: "haxcms-basic-theme",
        path:
          "@lrnwebcomponents/haxcms-elements/lib/core/themes/haxcms-basic-theme.js",
        name: "Basic site",
      },
      "haxcms-custom-theme": {
        element: "haxcms-custom-theme",
        path:
          "@lrnwebcomponents/haxcms-elements/lib/core/themes/haxcms-custom-theme.js",
        name: "Custom theme",
      },
      "haxcms-user-theme": {
        element: "haxcms-user-theme",
        path:
          "@lrnwebcomponents/haxcms-elements/lib/core/themes/haxcms-user-theme.js",
        name: "User theme",
      },
      "haxcms-minimalist-theme": {
        element: "haxcms-minimalist-theme",
        path:
          "@lrnwebcomponents/haxcms-elements/lib/core/themes/haxcms-minimalist-theme.js",
        name: "Minimalist site",
      },
      "haxcms-slide-theme": {
        element: "haxcms-slide-theme",
        path:
          "@lrnwebcomponents/haxcms-elements/lib/core/themes/haxcms-slide-theme.js",
        name: "Slide deck",
      },
      "haxcms-dev-theme": {
        element: "haxcms-dev-theme",
        path:
          "@lrnwebcomponents/haxcms-elements/lib/development/haxcms-dev-theme.js",
        name: "DEVELOPER: Test theme",
      },
      "haxcms-theme-developer": {
        element: "haxcms-theme-developer",
        path:
          "@lrnwebcomponents/haxcms-elements/lib/development/haxcms-theme-developer.js",
        name: "EXPERIMENTAL: HAX Theme Maker",
      },
    },
    saveNodePath: "/mgp140/system/api/saveNode",
    saveManifestPath: "/mgp140/system/api/saveManifest",
    saveOutlinePath: "/mgp140/system/api/saveOutline",
    publishSitePath: "/mgp140/system/api/publishSite",
    syncSitePath: "/mgp140/system/api/syncSite",
    setConfigPath: "/mgp140/system/api/setConfig",
    getConfigPath: "/mgp140/system/api/getConfig",
    getNodeFieldsPath: "/mgp140/system/api/getNodeFields",
    getSiteFieldsPath:
      "/mgp140/system/api/formLoad?haxcms_form_id=siteSettings",
    revertSitePath: "/mgp140/system/api/revertCommit",
    getFormToken: "_fKooppQmgxzaRhIx7s2OWt7atWUJiHICt4vksHkB6E",
    createNodePath: "/mgp140/system/api/createNode",
    getUserDataPath: "/mgp140/system/api/getUserData",
    setUserPhotoPath: "/mgp140/system/api/setUserPhoto",
    deleteNodePath: "/mgp140/system/api/deleteNode",
    createNewSitePath: "/mgp140/system/api/createSite",
    gitImportSitePath: "/mgp140/system/api/gitImportSite",
    downloadSitePath: "/mgp140/system/api/downloadSite",
    archiveSitePath: "/mgp140/system/api/archiveSite",
    cloneSitePath: "/mgp140/system/api/cloneSite",
    deleteSitePath: "/mgp140/system/api/deleteSite",
    appStore: {
      url:
        "/mgp140/system/api/generateAppStore?app-store-token=dxBSYYShFGgmxdII6NxM0F9ZFPHA7P_hh0izsdu3B5s",
    },
    jwt:
      "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IndzTXc1XzhYQXRuUUhlTVlJNnIyYTFmUmY4ZFMxZzZoMXEzV0tBQThpakUiLCJpYXQiOjE1ODc0MzAxNTUsImV4cCI6MTU4NzQzMTA1NSwidXNlciI6Im1ncDE0MCJ9.e3ig-Vbggpv7xOQePJ-xULvcGwAYYR20hD42-DbLmUI",
  })}`;
};
