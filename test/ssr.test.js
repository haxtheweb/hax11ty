// End to end check of the SSR step with a tiny fake web component build:
// one element that renders, one that throws, one that never finishes, one that
// renders nothing, and one the registry does not know.
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const GOOD = `
import { LitElement, html } from "lit";
class XGood extends LitElement {
  static properties = { label: { type: String } };
  render() { return html\`<p>Hello \${this.label}</p><slot></slot>\`; }
}
customElements.define("x-good", XGood);
`;
const THROWS = `
import { LitElement, html } from "lit";
class XThrows extends LitElement {
  render() { throw new Error("boom"); }
}
customElements.define("x-throws", XThrows);
`;
const HANGS = `
import { LitElement, html } from "lit";
class XHangs extends LitElement {
  render() { for (;;) {} }
}
customElements.define("x-hangs", XHangs);
`;
const EMPTY = `
import { LitElement, html } from "lit";
class XEmpty extends LitElement {
  render() { return html\`\`; }
}
customElements.define("x-empty", XEmpty);
`;

function makeSite() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hax11ty-ssr-"));
  const nm = path.join(dir, "build", "es6", "node_modules", "@test");
  const registry = {};
  for (const [tag, source] of Object.entries({
    "x-good": GOOD,
    "x-throws": THROWS,
    "x-hangs": HANGS,
    "x-empty": EMPTY,
  })) {
    fs.mkdirSync(path.join(nm, tag), { recursive: true });
    fs.writeFileSync(path.join(nm, tag, tag + ".js"), source);
    registry[tag] = `@test/${tag}/${tag}.js`;
  }
  fs.writeFileSync(path.join(dir, "wc-registry.json"), JSON.stringify(registry));
  const site = path.join(dir, "site");
  fs.mkdirSync(path.join(site, "page"), { recursive: true });
  const page = (body) =>
    `<!DOCTYPE html>\n<html><head><title>t</title></head><body>\n<haxcms-site-builder id="site" file="site.json">${body}</haxcms-site-builder>\n</body></html>\n`;
  const body =
    `<h2>Title</h2><x-good label="world"><b>light</b></x-good>` +
    `<x-throws><i>kept one</i></x-throws>` +
    `<x-hangs><i>kept two</i></x-hangs>` +
    `<x-empty><i>kept three</i></x-empty>` +
    `<x-empty></x-empty>` +
    `<x-unknown><i>kept four</i></x-unknown>` +
    `<div><x-good label="nested">inner</x-good></div>`;
  fs.writeFileSync(path.join(site, "page", "index.html"), page(body));
  fs.writeFileSync(path.join(site, "index.html"), page("<p>no elements</p>"));
  fs.writeFileSync(
    path.join(site, "site.json"),
    JSON.stringify({ items: [{ slug: "page" }] }),
  );
  return { dir, site, buildDir: path.join(dir, "build", "es6", "node_modules") };
}

test("renders what it can and leaves the rest as authored", async () => {
  const { renderSite } = await import("../scripts/ssr-pages.mjs");
  const { site, buildDir } = makeSite();
  const original = fs.readFileSync(path.join(site, "index.html"), "utf8");
  const report = await renderSite(site, buildDir, () => {});
  const html = fs.readFileSync(path.join(site, "page", "index.html"), "utf8");

  // the good element, including the one nested in a plain div, was rendered
  assert.match(html, /<template shadowroot="open" shadowrootmode="open">/);
  assert.strictEqual((html.match(/<p>Hello /g) || []).length, 2);
  assert.match(html, /<b>light<\/b>/);
  // everything else is exactly what the author wrote
  for (const kept of [
    "<x-throws><i>kept one</i></x-throws>",
    "<x-hangs><i>kept two</i></x-hangs>",
    "<x-empty></x-empty>",
    "<x-unknown><i>kept four</i></x-unknown>",
  ]) {
    assert.ok(html.includes(kept), `${kept} was kept`);
  }
  // an element whose shadow root is empty still keeps its authored light content
  assert.match(html, /<x-empty><template[^>]*>.*?<\/template><i>kept three<\/i><\/x-empty>/);
  assert.match(html, /<h2>Title<\/h2>/);
  // the shared stylesheet is linked once and exists
  assert.strictEqual((html.match(/assets\/hax11ty-ssr\.css/g) || []).length, 1);
  assert.ok(fs.existsSync(path.join(site, "assets", "hax11ty-ssr.css")));
  // a page with nothing to render is untouched
  assert.strictEqual(fs.readFileSync(path.join(site, "index.html"), "utf8"), original);

  assert.strictEqual(report.elements.rendered, 2);
  assert.ok(report.elements.threw >= 2, "throwing and unknown elements are counted");
  assert.strictEqual(report.elements.empty, 1, "the bare empty element");
  assert.strictEqual(report.elements.shell, 1, "the empty element with content");
  assert.ok(report.elements.hung >= 1 || report.elements.timeout >= 1, "the hang was caught");
  assert.deepStrictEqual(report.skippedPages, []);
});

test("running it again leaves rendered pages alone", async () => {
  const { renderSite } = await import("../scripts/ssr-pages.mjs");
  const { site, buildDir } = makeSite();
  await renderSite(site, buildDir, () => {});
  const once = fs.readFileSync(path.join(site, "page", "index.html"), "utf8");
  const report = await renderSite(site, buildDir, () => {});
  assert.strictEqual(fs.readFileSync(path.join(site, "page", "index.html"), "utf8"), once);
  assert.strictEqual(report.pages.length, 1, "only the page without elements is visited again");
});

test("HAX11TY_SSR=0 or ssr: false turns it off", async () => {
  const { ssrEnabled } = await import("../scripts/ssr-pages.mjs");
  assert.strictEqual(ssrEnabled({}, {}), true);
  assert.strictEqual(ssrEnabled({}, { ssr: false }), false);
  assert.strictEqual(ssrEnabled({ HAX11TY_SSR: "0" }, { ssr: true }), false);
  assert.strictEqual(ssrEnabled({ HAX11TY_SSR: "off" }, {}), false);
  assert.strictEqual(ssrEnabled({ HAX11TY_SSR: "1" }, { ssr: false }), true);
});
