export default function getTemplate(document: Document | DocumentFragment | undefined, id: string): HTMLTemplateElement | undefined {
    const element = document?.getElementById(id)

    if (!element) {
        return void 0
    }

    return element as HTMLTemplateElement
}