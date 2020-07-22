import { LitElement, html, css } from "../../../build/es6/node_modules/lit-element/lit-element.js";

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
  static get styles() {
    return css`
      :host {
        display: block;
      }
      a {
        display: block;
        width: 100%;
        border-width: 1px;
        border-style: solid;
        border-color: rgb(242, 242, 240);
        border-image: initial;
        min-width: unset;
        width: 100%;
        background-color: transparent;
        padding: 32px 16px;
        margin: 0px;
        color: inherit;
        text-decoration: inherit;
        transition: all .3s ease-out;
      }
      a:hover,
      a:focus {
        border-color: blue;
      }
      h3 {
        font-weight: bold;
      }
    `
  }
  // render function
  render() {
    return html`
      <a href="${this.url}">
        <h3>${this.title}</h3>
        <section class="post-excerpt" itemprop="description">
          <slot></slot>
        </section>
        <div class="post-meta">
          ${this.date}
        </div>
      </a>
    `;
  }
}

customElements.define("haxtheme-item", HaxthemeItem);

export { HaxthemeItem };
