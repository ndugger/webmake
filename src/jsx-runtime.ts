interface AttributeMap {
    [ key: string ]: string
}

interface JSXProperties {
    children: HTMLElement
}

interface JSXSProperties {
    children: HTMLElement[]
}

export function jsx(tag: string, properties: JSXProperties): HTMLElement {
    return jsxs(tag, Object.assign(properties, { children: [ properties.children ] }))
}

export function jsxs(tag: string, properties: JSXSProperties): HTMLElement {
    const element = document.createElement(tag)
    const { children, ...attributes } = properties

    for (const attribute in attributes) {
        element.setAttribute(attribute, (attributes as AttributeMap)[ attribute ])
    }

    for (const child of children) if (child) {

        if (typeof child === 'string') {
            element.append(new Text(child))
        }
        else if (element.tagName.toLowerCase() === 'template') {
            (element as HTMLTemplateElement).content.append(child)
        }
        else {
            element.append(child)
        }
    }

    return element
}

declare global {

    interface ImportMeta {
        document?: Document | DocumentFragment
    }

    interface ShadowRoot {
        adoptedStyleSheets: CSSStyleSheet[]
    }

    interface Document {
        adoptedStyleSheets: CSSStyleSheet[]
    }

    interface CSSStyleSheet {
        replace(value: string): Promise<void>
        replaceSync(value: string): void
    }

    namespace JSX {
        
        interface IntrinsicElements {
            [key: string]: any
        }
    }
}
