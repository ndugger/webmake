declare module "*.css" {
    const css: CSSStyleSheet
    export = css
}

declare module "*.html" {
    const doc: Document | DocumentFragment
    export = doc
}

declare module "*.svg" {
    const doc: XMLDocument
    export = doc
}
