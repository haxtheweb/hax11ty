import { LitElement, html, css } from "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/lit-element/lit-element.js";

class HaxthemeItemList extends LitElement {
  static get properties() {
    return {
      items: {type: Array}
    }
  }
  constructor() {
    super();
    this.items = [];
  }
  // render function
  render() {
    return html`
      ${this.items}
    `;
  }
}

customElements.define("haxtheme-item-list", HaxthemeItemList);

export { HaxthemeItemList };
