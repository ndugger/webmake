<html>
    <template name="button-component">
        <div></div>
    </template>
</html>

export class Button extends HTMLElement {

    #template = import.meta.document.getElementsByName('button-component').item(0)
    #shadow = this.attachShadow({ mode: 'closed' })

    public override connectedCallback() {
        
    }
}
