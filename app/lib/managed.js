/**
 * HAXcms managed files, rendered from the haxcms-nodejs boilerplate.
 *
 * `npm run sync-assets` copies each file in MANAGED_FILES from
 * haxcms-nodejs src/boilerplate/site into app/_haxcms/site, and
 * app/haxcms-managed.11ty.js renders them here. hax11ty never keeps its own
 * copy of these files, so a site it builds stays the same as one a HAXcms
 * backend writes.
 *
 * The boilerplate files are Twig templates. The few Twig-only expressions
 * they use (`json_encode`, `constant(...)`, `raw`) are provided below so
 * Nunjucks renders them unchanged.
 */
const crypto = require("crypto");
const nunjucks = require("nunjucks");

// Files a static site ships, as named in haxcms-nodejs getManagedTemplateFiles().
// Left out on purpose: index.html (hax11ty renders its own, with page
// content), llms.txt (generated from the outline), package.json, config.php,
// index.php, AGENTS.md, the SCORM files, web-dev-server config and the
// .well-known server descriptions (security.txt, api-catalog), which describe
// a running HAXcms server rather than a static copy.
const MANAGED_FILES = [
  ".htaccess",
  "404.html",
  "browserconfig.xml",
  "files/.htaccess",
  "manifest.json",
  "offline.html",
  "push-manifest.json",
  "robots.txt",
  "service-worker.js",
];

// Files the service worker precaches; the rest are cached as visitors use them.
const SHELL_FILES = ["index.html", "site.json", "manifest.json", "offline.html"];

const ALL_RIGHTS_RESERVED = "all-rights-reserved";

// Security: the site title and description reach JSON, XML and text files.
// Each is escaped for the format of the file it is printed in, and every
// other string value printed into a non-HTML file is HTML-escaped, so no
// site setting can close the JSON string or XML node around it. Same rules
// and tables as haxcms-nodejs managedTemplateVarsFor().
const TEXT_FORMATS = {
  "manifest.json": "json",
  "llms.txt": "text",
};
const ESCAPE_ALL = ["manifest.json", "browserconfig.xml", "robots.txt", "llms.txt"];
// XML 1.0 allows #x9 #xA #xD [#x20-#xD7FF] [#xE000-#xFFFD] [#x10000-#x10FFFF]
const XML_ILLEGAL_CHARS =
  /[^\x09\x0A\x0D\x20-퟿-�\u{10000}-\u{10FFFF}]/gu;

function escapeHTMLAttribute(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeXMLValue(value) {
  return String(value === null || value === undefined ? "" : value)
    .replace(XML_ILLEGAL_CHARS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// CR, LF and TAB become a space; other control characters and backslashes are
// dropped, so a title can never break the JSON string it is printed in.
function sanitizeText(value) {
  if (typeof value !== "string") {
    return value;
  }
  return value.replace(/[\r\n\t]/g, " ").replace(/[\x00-\x1f\x7f\\]/g, "");
}

function escapeText(value, format) {
  if (value === null || value === undefined) {
    return "";
  }
  const text = sanitizeText(String(value));
  if (format === "json") {
    return JSON.stringify(text).slice(1, -1);
  }
  if (format === "xml") {
    return escapeXMLValue(text);
  }
  if (format === "html") {
    return escapeHTMLAttribute(text);
  }
  return text;
}

function varsFor(file, templateVars) {
  const format = Object.prototype.hasOwnProperty.call(TEXT_FORMATS, file)
    ? TEXT_FORMATS[file]
    : null;
  const escapeAll = ESCAPE_ALL.includes(file);
  if (!format && !escapeAll) {
    return templateVars;
  }
  const vars = Object.assign({}, templateVars);
  if (escapeAll) {
    for (const key of Object.keys(vars)) {
      if (typeof vars[key] === "string") {
        vars[key] = escapeHTMLAttribute(vars[key]);
      }
    }
  }
  if (format) {
    vars.title = escapeText(templateVars.title, format);
    vars.description = escapeText(templateVars.description, format);
  }
  return vars;
}

function iconPath(size) {
  return "assets/icon-" + size + "x" + size + ".png";
}

/**
 * Same names haxcms-nodejs rebuildManagedFiles() renders the boilerplate with.
 * @param {object} settings hax11ty settings (src/settings.js)
 */
function templateVars(settings) {
  let domain = String(settings.url || settings.basePath || "/");
  if (!domain.endsWith("/")) {
    domain += "/";
  }
  const vars = {
    hexCode: settings.themeHexCode,
    basePath: settings.basePath,
    domain,
    title: sanitizeText(settings.siteName),
    short: settings.siteMachineName,
    description: sanitizeText(settings.siteDescription),
    metaDescription: sanitizeText(settings.siteDescription || settings.siteName || ""),
    lang: settings.lang,
    privateSite: false,
    reservedSite: settings.siteLicense === ALL_RIGHTS_RESERVED,
    cdnRegex: null,
    favicon: "assets/favicon.png",
    swhash: [],
  };
  for (const size of [48, 72, 96, 144, 192, 256, 512]) {
    vars["logo" + size + "x" + size] = iconPath(size);
  }
  // Each shell entry is versioned per build: a static build has no earlier
  // copy to compare with, so every deploy gives visitors a fresh shell.
  const shell = SHELL_FILES.concat(vars.logo192x192);
  for (const location of [...new Set(shell)]) {
    const hash = crypto
      .createHmac("sha256", "haxcmsswhash")
      .update(location + settings.siteUuid)
      .digest("base64")
      .replace(/[+/=-]/g, "");
    vars.swhash.push([location, hash]);
  }
  return vars;
}

let env;
function environment() {
  if (!env) {
    env = new nunjucks.Environment(null, { autoescape: false });
    env.addGlobal("constant", (name) => name);
    env.addFilter("json_encode", (value, flag) =>
      JSON.stringify(value, null, flag === "JSON_PRETTY_PRINT" ? 4 : undefined),
    );
    env.addFilter("raw", (value) => value);
  }
  return env;
}

/**
 * Render one boilerplate file.
 * @param {string} file path relative to the site, one of MANAGED_FILES
 * @param {string} source the boilerplate file's text
 * @param {object} settings hax11ty settings
 */
function renderManagedFile(file, source, settings) {
  return environment().renderString(source, varsFor(file, templateVars(settings)));
}

module.exports = {
  MANAGED_FILES,
  renderManagedFile,
  templateVars,
  escapeHTMLAttribute,
};
