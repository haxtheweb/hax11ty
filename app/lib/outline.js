/**
 * Build the HAXcms outline (site.json items) from the pages hax11ty found.
 *
 * Pure functions, no 11ty or file system access, so they can be tested alone.
 * An entry is { slug, title, order?, description?, created, updated, readtime,
 * metadata? } and the result is a list of JSON Outline Schema items in outline
 * order (parents before their children).
 */
const crypto = require("crypto");

// front matter keys that become item fields or are 11ty's own, so they are not
// repeated in the item's metadata
const NOT_METADATA = [
  "title",
  "description",
  "order",
  "slug",
  "layout",
  "tags",
  "permalink",
  "date",
  "updated",
  "eleventyExcludeFromCollections",
  "templateEngineOverride",
];

function itemId(slug) {
  return "item-" + crypto.createHash("sha1").update(slug).digest("hex").slice(0, 16);
}

/**
 * The closest existing ancestor: "a/b/c" looks for "a/b", then "a".
 */
function findParentSlug(slug, known) {
  const parts = slug.split("/");
  while (parts.length > 1) {
    parts.pop();
    const candidate = parts.join("/");
    if (known.has(candidate)) {
      return candidate;
    }
  }
  return null;
}

function compareSiblings(a, b) {
  const ao = typeof a.order === "number" ? a.order : Infinity;
  const bo = typeof b.order === "number" ? b.order : Infinity;
  if (ao !== bo) {
    return ao < bo ? -1 : 1;
  }
  return String(a.title).localeCompare(String(b.title)) || a.slug.localeCompare(b.slug);
}

/**
 * Front matter minus the keys that are item fields. `tags` becomes the comma
 * separated string HAXcms uses, without the internal "content" collection tag.
 */
function pageMetadata(frontMatter = {}) {
  const metadata = {};
  for (const [key, value] of Object.entries(frontMatter)) {
    if (!NOT_METADATA.includes(key)) {
      metadata[key] = value;
    }
  }
  const tags = []
    .concat(frontMatter.tags || [])
    .map((tag) => String(tag).trim())
    .filter((tag) => tag && tag !== "content");
  if (tags.length) {
    metadata.tags = tags.join(",");
  }
  return metadata;
}

/**
 * @param {Array} entries pages found by the build
 * @returns {Array} JSON Outline Schema items, parents first
 */
function buildOutline(entries) {
  const bySlug = new Map();
  for (const entry of entries) {
    if (bySlug.has(entry.slug)) {
      throw new Error(`hax11ty: two files produce the slug "${entry.slug}"`);
    }
    bySlug.set(entry.slug, entry);
  }
  const known = new Set(bySlug.keys());
  const children = new Map();
  for (const entry of entries) {
    const parent = findParentSlug(entry.slug, known);
    entry.__parent = parent;
    if (!children.has(parent)) {
      children.set(parent, []);
    }
    children.get(parent).push(entry);
  }
  const items = [];
  const visit = (parentSlug, indent) => {
    const siblings = (children.get(parentSlug) || []).sort(compareSiblings);
    siblings.forEach((entry, index) => {
      items.push({
        id: itemId(entry.slug),
        indent,
        location: `pages/${entry.slug}/index.html`,
        slug: entry.slug,
        order: index,
        title: entry.title,
        description: entry.description || "",
        parent: parentSlug ? itemId(parentSlug) : null,
        metadata: {
          created: entry.created,
          updated: entry.updated,
          readtime: entry.readtime,
          contentDetails: {},
          files: [],
          ...(entry.metadata || {}),
        },
      });
      visit(entry.slug, indent + 1);
    });
  };
  visit(null, 0);
  for (const entry of entries) {
    delete entry.__parent;
  }
  return items;
}

module.exports = { buildOutline, pageMetadata, findParentSlug, itemId };
