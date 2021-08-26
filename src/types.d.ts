declare module "*.css" {
    const css: CSSStyleSheet
    export = css
}

declare module "*.html" {
    const doc: Document | DocumentFragment
    export = doc
}