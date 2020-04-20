import { LitElement, html, css } from "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/lit-element/lit-element.js";
import { store } from "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/@lrnwebcomponents/haxcms-elements/lib/core/haxcms-site-store.js"
import { HAXCMSLitElementTheme } from "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/@lrnwebcomponents/haxcms-elements/lib/core/HAXCMSLitElementTheme.js"
import { autorun, toJS } from "https://cdn.webcomponents.psu.edu/cdn/build/es6/node_modules/mobx/lib/mobx.module.js"

class HaxthemeApp extends HAXCMSLitElementTheme {
  constructor() {
    super();
  }
  connectedCallback() {
    super.connectedCallback()
    autorun((resolve) => {
      console.log(store);
    })
  }
  // render function
  render() {
    return html`
      <div id="contentcontainer">
        <div id="slot">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define("haxtheme-app", HaxthemeApp);

export { HaxthemeApp };
