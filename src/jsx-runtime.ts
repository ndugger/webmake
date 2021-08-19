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

    for (const attribute of Object.keys(attributes)) {
        element.setAttribute(attribute, attributes[ attribute ])
    }

    for (const child of children) if (child) {

        if (element.tagName.toLowerCase() === 'template') {
            (element as HTMLTemplateElement).content.append(child)
        }
        else {
            element.append(child)
        }
    }

    return element
}