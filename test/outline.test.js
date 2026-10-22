const test = require("node:test");
const assert = require("node:assert");
const { deriveSlug } = require("../app/lib/slug.js");
const { buildOutline, pageMetadata } = require("../app/lib/outline.js");
const { htmlToMarkdown } = require("../app/lib/markdown.js");

test("slugs follow the file path", () => {
  assert.strictEqual(deriveSlug("/content/about"), "about");
  assert.strictEqual(deriveSlug("/content/guides/install"), "guides/install");
  assert.strictEqual(deriveSlug("/content/guides/index"), "guides");
  assert.strictEqual(deriveSlug("/content/index"), "home");
});

test("a slug in front matter wins and is cleaned", () => {
  assert.strictEqual(deriveSlug("/content/about", "/team/about us/"), "team/about-us");
});

test("slugs that collide with published folders are refused", () => {
  assert.throws(() => deriveSlug("/content/files"), /already uses/);
  assert.throws(() => deriveSlug("/content/about", "assets/x"), /already uses/);
});

const entry = (slug, extra = {}) => ({
  slug,
  title: slug,
  created: 1,
  updated: 2,
  readtime: 1,
  ...extra,
});

test("outline puts children under the closest existing parent", () => {
  const items = buildOutline([entry("a/b/c"), entry("a"), entry("z")]);
  assert.deepStrictEqual(
    items.map((i) => [i.slug, i.indent, i.parent === null ? null : items.find((p) => p.id === i.parent).slug]),
    [
      ["a", 0, null],
      ["a/b/c", 1, "a"],
      ["z", 0, null],
    ],
  );
});

test("siblings sort by order then title and get consecutive order values", () => {
  const items = buildOutline([
    entry("b", { title: "B", order: 1 }),
    entry("a", { title: "A", order: 1 }),
    entry("first", { title: "Zed", order: 0 }),
    entry("unordered", { title: "Aardvark" }),
  ]);
  assert.deepStrictEqual(items.map((i) => i.slug), ["first", "a", "b", "unordered"]);
  assert.deepStrictEqual(items.map((i) => i.order), [0, 1, 2, 3]);
});

test("items point at the page folder layout HAXcms uses", () => {
  const [item] = buildOutline([entry("guides/install")]);
  assert.strictEqual(item.location, "pages/guides/install/index.html");
  assert.match(item.id, /^item-[0-9a-f]{16}$/);
});

test("duplicate slugs fail the build", () => {
  assert.throws(() => buildOutline([entry("a"), entry("a")]), /two files/);
});

test("metadata drops item fields and the internal content tag", () => {
  const metadata = pageMetadata({
    title: "T",
    order: 1,
    layout: "x",
    tags: ["content", "one", "two"],
    hideInMenu: true,
  });
  assert.deepStrictEqual(metadata, { hideInMenu: true, tags: "one,two" });
});

test("markdown keeps custom elements, even ones that only hold a template", () => {
  const md = htmlToMarkdown(
    "<h2>Hi</h2><p>Text <a href=\"https://example.com\">link</a></p><code-sample><template>npm i</template></code-sample>",
  );
  assert.match(md, /Hi\n--/);
  assert.match(md, /\[link\]\(https:\/\/example.com\)/);
  assert.match(md, /<code-sample><template>npm i<\/template><\/code-sample>/);
  assert.strictEqual(typeof htmlToMarkdown(""), "string");
});
