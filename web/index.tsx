import customTextStyle from './components/custom-text/style'

<html>
    <template id="index-page">
        <custom-button>click</custom-button>
        <button>regular</button>
    </template>
</html>

export class IndexPage extends HTMLElement {

    #shadow = this.attachShadow({ mode: 'closed' })
    #template = import.meta.document?.getElementById('index-page') as HTMLTemplateElement

    public constructor() {
        super()

        this.#shadow.append(this.#template.content.cloneNode(true))
        this.#shadow.adoptedStyleSheets = [ customTextStyle ]
    }
}

customElements.define('index-page', IndexPage)
document.body.append(new IndexPage())
