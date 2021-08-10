<html>
    <template name="index-page">
        <button>click</button>
    </template>
</html>

export class IndexPage extends HTMLElement {

}

customElements.define('index-page', IndexPage)
document.body.append(new IndexPage())
