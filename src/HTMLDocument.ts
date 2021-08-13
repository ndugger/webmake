import beautify from 'beautify'
import { HTMLElement, parse } from 'node-html-parser'

export class HTMLDocument {

    private root: HTMLElement

    public get body() {
        return this.root.querySelector('body')
    }

    public get documentElement() {
        return this.root.querySelector('html')
    }
    
    public constructor(markup: string) {
        this.root = parse(markup)
    }

    public toString(docType?: string) {
        return beautify((docType ? `<!doctype ${ docType }>` : '') + this.root.outerHTML, { format: 'html' })
    }
}
