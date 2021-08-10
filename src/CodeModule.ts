import { HTMLElement } from 'node-html-parser'
import { join } from 'path/posix'
import * as TypeScript from 'typescript'

import { ApplicationCompiler } from './ApplicationCompiler'
import { EphemeralFile } from './EphemeralFile'
import { HTMLDocument } from './HTMLDocument'

function popPath(path: string): string {
    return path.replace(/\/(?!.+?\/).+/, '')
}

export class CodeModule extends EphemeralFile {

    public dynamic: boolean
    public fromName: string

    public document?: HTMLDocument
    public script: string

    public childModules: CodeModule[]
    public ownerProgram: ApplicationCompiler
    public parentModule: CodeModule | undefined

    public constructor(ownerProgram: ApplicationCompiler, parentModule: CodeModule | undefined, fromName: string, fileName: string, dynamic = false) {
        super(fileName, 'text/html')

        this.dynamic = dynamic
        this.fromName = fromName

        this.script = ''

        this.childModules = []
        this.ownerProgram = ownerProgram
        this.parentModule = parentModule
    }

    public compile() {

        if (!this.script || !this.document) {
            throw new Error('Module must be parsed before it may be compiled')
        }
        
        const parentNode = this.document.body ?? this.document.documentElement
        const script = new HTMLElement('script', {}, 'type="module"', parentNode)

        parentNode.appendChild(script)
        
        const transpiled = TypeScript.transpileModule(this.script.replace(/\n$/, ''), {
            compilerOptions: {
                module: TypeScript.ModuleKind.ESNext,
                moduleResolution: TypeScript.ModuleResolutionKind.NodeJs,
                target: TypeScript.ScriptTarget.ESNext
            }
        })

        script.textContent = transpiled.outputText
        this.contents = this.document.toString()

        this.childModules.forEach(module => module.compile())
        this.ownerProgram.emit('module-compile', this)

        return this
    }

    public parse() {
        const printer = TypeScript.createPrinter({ newLine: TypeScript.NewLineKind.LineFeed })
        const compiler = TypeScript.createProgram([ this.fileName ], { allowJs: true })
        const file = compiler.getSourceFile(this.fileName)

        TypeScript.forEachChild(file, node => {

            // Parse and map module tree
            if (TypeScript.isImportDeclaration(node)) {
                let alias = ''
                let fileName = ''

                TypeScript.forEachChild(node, child => {

                    if (TypeScript.isStringLiteral(child)) {
                        alias += child.text

                        if (child.text.startsWith('.')) {
                            fileName += join(popPath(this.fileName), alias)

                            if (!fileName.includes('.')) {
                                fileName += '.tsx' // TODO make the extension dynamic by reading from fs
                            }
                        }
                        else {
                            fileName += this.ownerProgram.lookupImportFrom(alias)
                        }
                    }
                })
                
                this.childModules.push(new CodeModule(this.ownerProgram, this, alias, fileName).parse())

                this.script += printer.printNode(TypeScript.EmitHint.Unspecified, node, file) + '\n'
            }
            
            // Parse embedded HTML document
            if (TypeScript.isExpressionStatement(node)) {

                TypeScript.forEachChild(node, child => {

                    if (TypeScript.isJsxElement(child)) {

                        if (this.document) {
                            throw new Error('Module may only contain one embedded HTML document')
                        }

                        this.document = new HTMLDocument(printer.printNode(TypeScript.EmitHint.Unspecified, node, file).replace(/;$/, ''))
                    }
                })
            }
            else {
                this.script += printer.printNode(TypeScript.EmitHint.Unspecified, node, file) + '\n'
            }
        })

        this.ownerProgram.emit('module-parse', this)

        return this
    }
}
