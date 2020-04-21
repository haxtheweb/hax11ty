import {
  LitElement,
  html,
  css,
} from "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/lit-element/lit-element.js";
import "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/@lrnwebcomponents/h-a-x/h-a-x.js";

class HaxthemeHaxContent extends LitElement {
  static get properties() {
    return {
    };
  }
  constructor() {
    super();
  }
  static get styles() {
    return css``;
  }
  firstUpdated() {
    this.shadowRoot.querySelector('h-a-x').addEventListener('click', e => {
      console.log(e);
    })
  }
  // render function
  render() {
    return html`
      <h-a-x>
        <slot></slot>
      </h-a-x>
    `;
  }
}

customElements.define("haxtheme-hax-content", HaxthemeHaxContent);

export { HaxthemeHaxContent };