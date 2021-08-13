import { Button } from './components/Button'

<html>
    <template name="index-page">
        <custom-button>click</custom-button>
        <button>regular</button>
    </template>
</html>

export class IndexPage extends HTMLElement {

}

customElements.define('custom-button', Button)
customElements.define('index-page', IndexPage)

document.body.append(new IndexPage())
