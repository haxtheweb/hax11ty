/**
 * Page slugs for files under src/content/.
 *
 * A slug is the page's path in the HAXcms outline and its URL ("about",
 * "guides/install"). It comes from the file's location:
 *
 *   content/about.md            -> about
 *   content/guides/install.md   -> guides/install
 *   content/guides/index.md     -> guides      (a folder's index is the folder's page)
 *   content/index.md            -> home
 *
 * A `slug:` in the file's front matter wins.
 */
const CONTENT_DIR = "content";
// top level names the published site already uses for something else
const RESERVED = [
  "pages",
  "files",
  "assets",
  "theme",
  "custom",
  "build",
  "dist",
  "node_modules",
  "x",
  "system",
];

function cleanSegment(segment) {
  return String(segment)
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[?#%\\]/g, "");
}

/**
 * @param {string} filePathStem 11ty's page.filePathStem, e.g. "/content/guides/index"
 * @param {string} [explicit] slug set in front matter
 * @returns {string} slug without leading or trailing slashes
 */
function deriveSlug(filePathStem, explicit) {
  let raw = explicit;
  if (typeof raw !== "string" || raw.trim() === "") {
    raw = String(filePathStem || "")
      .replace(/\\/g, "/")
      .replace(new RegExp("^/?" + CONTENT_DIR + "/"), "")
      .replace(/(^|\/)index$/, "");
    if (raw === "") {
      raw = "home";
    }
  }
  const slug = raw
    .split("/")
    .map(cleanSegment)
    .filter(Boolean)
    .join("/");
  if (slug === "") {
    throw new Error(`hax11ty: cannot derive a slug for ${filePathStem}`);
  }
  if (RESERVED.includes(slug.split("/")[0])) {
    throw new Error(
      `hax11ty: the page "${slug}" (${filePathStem}) starts with "${slug.split("/")[0]}", ` +
        `a folder the published site already uses. Rename the file or set a different slug: in its front matter.`,
    );
  }
  return slug;
}

module.exports = { deriveSlug, RESERVED, CONTENT_DIR };
