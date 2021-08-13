import { readFileSync } from 'fs'
import { join } from 'path/posix'
import { EventEmitter } from 'stream'
import * as TypeScript from 'typescript'

import { EphemeralFile } from './EphemeralFile'
import { CodeModule } from './CodeModule'
import { WebBundle } from './WebBundle'
import { HTMLDocument } from './HTMLDocument'

function flattenTree<Branch extends object>(root: Branch, key: keyof Branch): Branch[] {
    const flattened = [ root ]
    const branches = root[ key ] as unknown as Branch[]
  
    if (branches && branches.length > 0) {
        return flattened.concat(branches.map((child) => flattenTree(child, key)).reduce((a, b) => a.concat(b), []))
    }
  
    return flattened
}

export class ApplicationCompiler extends EventEmitter {

    public address?: string
    public index?: CodeModule

    public manual = JSON.parse(readFileSync('webmake.json').toString()) as ApplicationCompiler.Manual
    public package = JSON.parse(readFileSync('package.json').toString()) as ApplicationCompiler.Package

    public options: ApplicationCompiler.Options

    public constructor(options?: Partial<ApplicationCompiler.Options>) {
        super()

        this.options = { 
            ...ApplicationCompiler.defaultOptions, 
            ...options
        }
    }

    public importIndex(fileName: string): CodeModule {
        return this.index = new CodeModule(this, undefined, '~', fileName).parse()
    }

    public lookupImportFrom(alias: string): string {

        if (alias in this.manual.imports) {
            return join(this.manual.imports[ alias ])
        }
        
        if (alias in this.package.dependencies) {
            return join('node_modules', alias, JSON.parse(readFileSync(join('node_modules', alias)).toString()).main)
        }

        throw new Error(`Cannot find module: ${ alias }`)
    }

    public makeBundles(address: string): WebBundle[] {
        const modules = this.makeModules()
        const masterBundle = new WebBundle('master', address)
        const indexPayload = new EphemeralFile('/', 'text/html', new HTMLDocument(`
            <html>
                <head>
                    <script src="/index.html" type="module"></script>
                </head>
            </html>
        `).toString('html'))

        masterBundle.addFile(indexPayload)
        modules.forEach(module => masterBundle.addFile(module))

        return [ masterBundle.pack() ]
    }

    public makeModules(): CodeModule[] {

        if (!this.index) {
            throw new Error('Program must import an index')
        }
        
        return flattenTree(this.index.compile(), 'childModules')
    }
}

export namespace ApplicationCompiler {

    export interface ImportMap {
        [ key: string ]: string
    }

    export interface Manifest {
        name: string
    }

    export interface ScopeMap {

    }

    export interface Manual {
        manifest: Manifest
        imports: ImportMap
        scopes: ScopeMap
    }

    export interface Options extends TypeScript.CompilerOptions {
        moduleCompatabilityTarget: 'mjs' | 'html'
    }

    export interface Package {
        dependencies: object
    }

    export const defaultOptions: Options = {
        moduleCompatabilityTarget: 'html'
    }
}
