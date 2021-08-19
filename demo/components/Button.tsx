<html>
    <template id="button-component">
        <div>faking</div>
    </template>
</html>

export class Button extends HTMLElement {

    #template = import.meta.document.getElementById('button-component')
    #shadow = this.attachShadow({ mode: 'closed' })

    public override connectedCallback() {
        this.#shadow.append(this.#template.content.cloneNode(true))
    }
}
