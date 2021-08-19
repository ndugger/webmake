import { Button } from './components/Button'

<html>
    <template id="index-page">
        <custom-button>click</custom-button>
        <button>regular</button>
    </template>
</html>

export class IndexPage extends HTMLElement {

    public constructor() {
        super()
        console.log(import.meta.document.getElementById('index-page'))
        this.attachShadow({ mode: 'closed' }).append(import.meta.document.getElementById('index-page').content.cloneNode(true))
    }
}

customElements.define('index-page', IndexPage)
customElements.define('custom-button', Button)

document.body.append(new IndexPage())

console.log(import.meta)
console.log(<div/>)
console.log(<section><button>click</button></section>)
