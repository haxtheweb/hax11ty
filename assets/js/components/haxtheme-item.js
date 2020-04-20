import { LitElement, html, css } from "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/lit-element/lit-element.js";
// import "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/@lrnwebcomponents/r-coder/r-coder.js";

class HaxthemeItem extends LitElement {
  static get properties() {
    return {
      title: {type: String},
      url: {type: String}
    }
  }
  constructor() {
    super();
    this.title = "";
    this.url = "";
  }
  // render function
  render() {
    return html`
      <a href="${this.url}">${this.title}</a>
      <!-- <r-coder></r-coder> -->
    `;
  }
}

customElements.define("haxtheme-item", HaxthemeItem);

export { HaxthemeItem };
