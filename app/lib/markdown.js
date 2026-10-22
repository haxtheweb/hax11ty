/**
 * HTML to markdown for the per-page .md copies, set up like haxcms-nodejs does
 * for the markdown it writes beside every page's index.html: custom elements
 * (anything with a dash in its tag name) are kept as markup instead of being
 * flattened, so a reader or agent still sees the HAX elements. Unlike haxcms-nodejs,
 * custom elements that only hold a <template> (code-sample) are kept as well.
 */
const TurndownService = require("turndown");

const isCustomElement = (node) =>
  node && node.nodeName && String(node.nodeName).indexOf("-") !== -1;

const turndown = new TurndownService({
  // turndown calls an element "blank" when it has no child nodes or text and drops
  // it before any keep rule is asked. Elements such as <code-sample> hold their
  // content in a <template>, so they look blank. Keep those as markup too.
  blankReplacement: (content, node) =>
    isCustomElement(node)
      ? node.outerHTML
      : node.isBlock
        ? "\n\n"
        : "",
});
turndown.keep(isCustomElement);

/**
 * @param {string} html page body
 * @returns {string} markdown ("" when the page has no body)
 */
function htmlToMarkdown(html) {
  const body = typeof html === "string" && html.trim() !== "" ? html : "<p></p>";
  try {
    return turndown.turndown(body);
  } catch {
    // a copy for readers and agents must never fail the build
    return "";
  }
}

module.exports = { htmlToMarkdown };
