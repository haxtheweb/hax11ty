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
      <h-a-x app-store='{"url": "appstore.json"}' element-align="right"></h-a-x>
    `;
  }
    /**
   * Attached to the DOM; now we can fire event to the store that
   * we exist and are the thing being edited.
   */
  connectedCallback() {
    super.connectedCallback();
    this.__applyMO();
  }
  __applyMO() {
    // notice ANY change to body and bubble up, only when we are attached though
    if (
      !this._observer &&
      this.syncBody &&
      window.HaxStore &&
      window.HaxStore.instance &&
      window.HaxStore.instance.activeHaxBody
    ) {
      this._observer = new MutationObserver(mutations => {
        if (!this.__lock) {
          this.__lock = true;
          this.dispatchEvent(
            new CustomEvent("hax-body-content-changed", {
              bubbles: true,
              cancelable: true,
              composed: true,
              detail: window.HaxStore.instance.activeHaxBody.haxToContent()
            })
          );
          setTimeout(() => {
            this.__lock = false;
          }, 100);
        }
      });
      this._observer.observe(window.HaxStore.instance.activeHaxBody, {
        childList: true,
        subtree: true
      });
    }
  }
}

customElements.define("haxtheme-hax-content", HaxthemeHaxContent);

export { HaxthemeHaxContent };