import {
  LitElement,
  html,
  css,
} from "../../../build/es6/node_modules/lit-element/lit-element.js";

class HaxthemeBanner extends LitElement {
  static get properties() {
    return {
      title: { type: String },
      image: { type: String },
      size: { type: String, reflect: true }
    };
  }
  constructor() {
    super();
    this.title = "";
    this.url = "";
    this.image = "";
    this.size = "default";
  }
  static get styles() {
    return css`
      :host([size="large"]) .big-banner {
        padding: calc(5em) calc(1em) calc(3em);
      }

      h1 {
        padding: 0;
        margin: 0;
        font-weight: 100;
        text-align: center;
      }

      .big-banner {
        text-transform: uppercase;
        letter-spacing: 0.3em;
        font-size: 40px;
        color: white;
        text-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        background-size: cover;
        margin-bottom: 50px;
        transition: 0.5s ease all;
        letter-spacing: 0.15em;
        font-size: clamp(16px, 5vw, 44px);
        padding: calc(2em) calc(1em) calc(2em);
        &.blurred {
          filter: blur(2px);
        }
      }
    `;
  }
  // render function
  render() {
    return html`
      <div class="big-banner" style="background-image:url(${this.image}); background-position: center center;">
        <div class="callout large primary">
          <div class="row column text-center">
            <h1>${this.title}</h1>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("haxtheme-banner", HaxthemeBanner);

export { HaxthemeBanner };
