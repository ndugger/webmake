import { readdir, readFile } from 'fs/promises'
import { join, parse, dirname, normalize, basename } from 'path/posix'
import * as TypeScript from 'typescript'
import * as WebBn from 'wbn'

/**
 * webmake
 * ====================================================
 * TABLE OF CONTENTS
 * ====================================================
 * 1. Data Structures
 * 2. Utilities & Helpers
 * 3. Program Code
 */

/**
 * ====================================================
 * DATA STRUCTURES
 * ====================================================
 */

interface Dictionary {
    [ key: string ]: string
}

interface EphemeralFile {
    fileName: string
    content: Buffer | string
}

interface WebBundle extends EphemeralFile {
    parentBundle?: WebBundle
    childFiles: EphemeralFile[]
}

interface WebModule extends EphemeralFile {
    dynamic: boolean
    parentModule?: WebModule
    childModules: WebModule[]
}

interface ModuleImportMap {
    [ key: string ]: WebModule
}

interface OutputConfig {
    compatabilityTarget: `${ ModuleCompatabilityTarget }`
}

interface PackageConfig {
    name: string
    version: string
    description: string
    main?: string
    module?: string
    dependencies: Dictionary
}

interface ParsedImportDeclaration {
    declaration: string
    fileName: string
    from: string
}

interface TypeScriptConfig {
    compilerOptions: TypeScript.CompilerOptions
    include: string[]
}

interface WebAppManifest {
    name: string
    description: string
}

interface WebMakeConfig {
    manifest: WebAppManifest
    files: string[]
    imports: Dictionary
    scopes: Dictionary
}

interface WebProject {
    app?: WebMakeConfig
    pkg?: PackageConfig
    tsc?: TypeScriptConfig
    out?: OutputConfig
}

/**
 * ====================================================
 * UTILITIES & HELPERS
 * ====================================================
 */

/**
 * Module compatability output targets
 */
export enum ModuleCompatabilityTarget {
    HTML = '.html',
    JS = '.mjs'
}

/**
 * Default output config
 */
export const defaultOutputConfig: OutputConfig = {
    compatabilityTarget: ModuleCompatabilityTarget.JS
}

/**
 * Valid markup file extensions
 */
export const markupFileExtensions = [
    '.html'
] as const

/**
 * Valid script file extensions
 */
export const scriptFileExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs'
] as const

/**
 * Valid style sheet file extensions
 */
export const styleFileExtensions = [
    '.css'
] as const

/**
 * Valid module file extensions
 */
export const moduleFileExtensions = [ 
    ...markupFileExtensions,
    ...scriptFileExtensions,
    ...styleFileExtensions 
] as const

/**
 * Default app config file name
 */
export const defaultAppConfigFileName = 'webmake.json'

/**
 * Default package config file name
 */
export const defaultPkgConfigFileName = 'package.json'

/**
 * Default TypeScript config file name
 */
export const defaultTscConfigFileName = 'tsconfig.json'

/**
 * Synchronously flatten a module tree into a 1-dimensional array
 */
export function flattenModuleTree(indexModule: WebModule): WebModule[] {
    return [ indexModule, ...indexModule.childModules.flatMap(flattenModuleTree) ]
}

/**
 * Synchronous utility for removing file extensions from a given path
 */
export function trimFileExtension(path: string): string {
    return path.replace('.' + path.split('.').pop() ?? '', '')
}

/**
 * Asynchronously reads a webmake.json file into memory
 */
export async function readWebAppConfig(path = TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, defaultAppConfigFileName)): Promise<WebMakeConfig> {
    return readFile(path ?? defaultAppConfigFileName).then(buffer => JSON.parse(buffer.toString()) as WebMakeConfig)
}

/**
 * Asynchronously reads a package.json file into memory
 */
export async function readPackageConfig(path = TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, defaultPkgConfigFileName)): Promise<PackageConfig> {
    return readFile(path ?? defaultPkgConfigFileName).then(buffer => JSON.parse(buffer.toString()) as PackageConfig)
}

/**
 * Asynchronously reads a tsconfig.json file into memory
 */
export async function readTypeScriptConfig(path = TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, defaultTscConfigFileName)): Promise<TypeScriptConfig> {
    return readFile(path ?? defaultTscConfigFileName).then(buffer => JSON.parse(buffer.toString()) as TypeScriptConfig)
}

/**
 * Compiles a given index with output settings
 */
export async function webmake(index: string, outputConfig: Partial<OutputConfig> = {}): Promise<WebBundle> {
    const project = { 
        app: await readWebAppConfig(), 
        pkg: await readPackageConfig(), 
        tsc: await readTypeScriptConfig(),
        out: { 
            ...defaultOutputConfig, 
            ...outputConfig 
        }
    }

    const staticFiles = await importStaticFiles(project)
    const indexModule = await importIndexModule(project, index)
    const codeModules = await compileModuleTree(project, indexModule)

    return createWebBundle(project, staticFiles, codeModules)
}

/**
 * ====================================================
 * PROGRAM CODE
 * ====================================================
 */

export async function importStaticFiles(project: WebProject): Promise<EphemeralFile[]> {
    return []
}

/**
 * Asynchronously imports a module tree from project dependencies
 */
export async function importDependencies(project: WebProject): Promise<ModuleImportMap> {
    const dependencies: ModuleImportMap = {}

    if (project.app) for (const from of Object.keys(project.app.imports)) {
        dependencies[ from ] = project.app.imports[ from ].startsWith('/') 
            ? await importIndexModule(project, join(dirname(process.cwd()), project.app.imports[ from ]))
            : await importIndexModule(project, project.app.imports[ from ])
    }

    if (project.tsc) for (const _from of Object.keys(project.tsc.compilerOptions.paths ?? {})) {
        // TODO
    }

    if (project.pkg) for (const from of Object.keys(project.pkg.dependencies ?? {})) {
        const dependencyDirectory = join(dirname(process.cwd()), 'node_modules', from)
        const dependencyPkgConfig = await readPackageConfig(TypeScript.findConfigFile(dependencyDirectory, TypeScript.sys.fileExists, defaultPkgConfigFileName))
        const dependencyDependencies = await importDependencies({ pkg: dependencyPkgConfig })
        const dependencyMain = dependencyPkgConfig.module
            ? [ '.js', '.mjs' ].some(ext => dependencyPkgConfig.module?.endsWith(ext)) // TODO
                ? dependencyPkgConfig.module // sorry
                : dependencyPkgConfig.module + '.js' // for
            : dependencyPkgConfig.main // this
                ? [ '.js', '.mjs', '.cjs' ].some(ext => dependencyPkgConfig.main?.endsWith(ext)) // code
                    ? dependencyPkgConfig.main // spaghetti
                    : dependencyPkgConfig.main + '.js' 
                : 'index.js'

        dependencies[ from ] = await importIndexModule(project, join(dependencyDirectory, dependencyMain), dependencyDependencies)
    }
    
    dependencies[ 'webmake/jsx-runtime' ] = await importIndexModule(project, join(dirname(process.cwd()), 'src', 'jsx-runtime.ts'))

    return dependencies
}

/**
 * Asynchronously imports a module tree given an entry path
 */
export async function importWebModule(project: WebProject, parentModule: WebModule | undefined, path: string, dependencies: ModuleImportMap = {}): Promise<WebModule> {
    const printer = TypeScript.createPrinter({ newLine: TypeScript.NewLineKind.LineFeed })
    const srcFile = TypeScript.createSourceFile(path, (await readFile(path)).toString(), TypeScript.ScriptTarget.ESNext) // program.getSourceFile(path)

    if (!srcFile) {
        throw new Error('File not found')
    }

    const module: WebModule = {
        fileName: normalize(path),
        content: '',
        dynamic: false,
        childModules: [],
        parentModule
    }

    for (const file of srcFile.getChildren()) {

        for (const node of file.getChildren(srcFile)) {
        
            if (TypeScript.isImportDeclaration(node)) {
                const importDeclaration = await parseImportDeclaration(module, node, srcFile, dependencies)

                if (importDeclaration.from in dependencies) {
                    module.childModules.push(dependencies[ importDeclaration.from ])
                }
                else if (importDeclaration.fileName) {
                    module.childModules.push(await importWebModule(project, module, importDeclaration.fileName, dependencies))
                }

                module.content += importDeclaration.declaration + '\n'
            }
            else if (TypeScript.isExpressionStatement(node)) {

                for (const child of node.getChildren(srcFile)) {

                    if (TypeScript.isJsxElement(child)) {

                        if (module.content.includes('import.meta.document =')) {
                            throw new Error('Only one top-level HTML document allowed in web modules')
                        }

                        if (dependencies && dependencies[ 'webmake/jsx-runtime' ]) {
                            module.childModules.push(dependencies[ 'webmake/jsx-runtime' ])
                        }

                        module.content += 'import.meta.document = new DocumentFragment();' + '\n'
                        module.content += 'import.meta.document.append(' + node.getText(srcFile) + ');' + '\n'
                        module.content += 'export default import.meta.document;'
                    }
                    else {
                        module.content += printer.printNode(TypeScript.EmitHint.Unspecified, child, srcFile) + '\n'
                    }
                }
            }
            else {
                module.content += printer.printNode(TypeScript.EmitHint.Unspecified, node, srcFile) + '\n'
            }
        }
    }

    return module
}

/**
 * Asynchronously imports a module tree from its index
 */
export async function importIndexModule(project: WebProject, path: string, dependencies?: ModuleImportMap): Promise<WebModule> {
    return importWebModule(project, void 0, path, dependencies ?? await importDependencies(project))
}

export async function parseImportDeclaration(parentModule: WebModule, node: TypeScript.ImportDeclaration, srcFile: TypeScript.SourceFile, dependencies?: ModuleImportMap): Promise<ParsedImportDeclaration> {
    const importDeclaration: ParsedImportDeclaration = {
        declaration: '',
        fileName: '',
        from: ''
    }

    for (const child of node.getChildren(srcFile)) {

        if (TypeScript.isStringLiteral(child)) {
            importDeclaration.from = child.text

            if (importDeclaration.from.startsWith('.')) {
                const parentModulePath = parse(parentModule.fileName)
                const joinedModulePath = join(parentModulePath.dir, importDeclaration.from)

                importDeclaration.fileName = joinedModulePath

                if (!moduleFileExtensions.some(ext => importDeclaration.fileName.endsWith(ext))) {
                    importDeclaration.fileName += await guessFileExtension(importDeclaration.fileName)
                }
            }
            else if (dependencies) {
                importDeclaration.fileName = await findModuleFile(importDeclaration.from, dependencies)
            }
            else {
                throw new Error('Missing dependencies')
            }

            importDeclaration.declaration += `"/${ trimFileExtension(importDeclaration.fileName) }";`
        }
        else {
            importDeclaration.declaration += `${ child.getText(srcFile) } `
        }
    }

    return importDeclaration
}

export async function guessFileExtension(path: string): Promise<string> {
    const files = await readdir(dirname(path))

    for (const file of files) {
        const filePath = parse(file)

        if (filePath.name === basename(path)) {
            return filePath.ext
        }
    }

    return '.tsx'
}

export async function findModuleFile(path: string, dependencies?: ModuleImportMap): Promise<string> {

    if (dependencies && path in dependencies) {
        return dependencies[ path ].fileName
    }

    return ''
}

export async function compileModuleTree(project: WebProject, indexModule: WebModule): Promise<WebModule[]> {
    const modules: WebModule[] = []

    for (const module of flattenModuleTree(indexModule)) {

        if (module.fileName.startsWith('node_modules')) {
            modules.push(module)
        }
        else if (styleFileExtensions.some(ext => module.fileName.endsWith(ext))) {
            modules.push(await transpileStyle(module))
        }
        else if (scriptFileExtensions.some(ext => module.fileName.endsWith(ext))) {
            modules.push(await transpileScript(module))
        }
        else {
            throw new Error(`Unsupported module type: ${ module.fileName }`)
        }
    }

    return modules
}

export async function transpileScript(module: WebModule): Promise<WebModule> {
    return { 
        ...module, 
        content: TypeScript.transpileModule(module.content.toString(), {
            compilerOptions: {
                module: TypeScript.ModuleKind.ESNext,
                target: TypeScript.ScriptTarget.ESNext,
                jsx: TypeScript.JsxEmit.ReactJSX,
                jsxImportSource: '/node_modules/webmake'
            }
        }).outputText 
    }
}

export async function transpileStyle(module: WebModule): Promise<WebModule> {
    return {
        ...module,
        content: `
            const css = new CSSStyleSheet();
            css.replace(\`${ module.content }\`);
            export default css;
        `
    }
}

export async function createWebBundle(project: WebProject, staticAssets: EphemeralFile[] = [], modules: WebModule[] = []): Promise<WebBundle> {
    const primary = 'http://localhost/'
    const imports = modules.reduce((map, module) => Object.assign(map, { [ '/' + trimFileExtension(module.fileName) ]: '/' + module.fileName }), project.app?.imports ?? {})
    const builder = new WebBn.BundleBuilder(primary).setManifestURL(primary + 'manifest.json').addExchange(primary, 200, { 'content-type': 'text/html' }, `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8"/>
                <script type="importmap">${ JSON.stringify({ imports }) }</script>
                <script type="module" src="${ modules[ 0 ]?.fileName }"></script>
                <title>${ project.app?.manifest?.name }</title>
            </head>
        </html>
    `)

    for (const module of modules) {
        builder.addExchange(primary + module.fileName, 200, { 'content-type': 'text/javascript' }, module.content)
    }

    const bundle: WebBundle = {
        fileName: 'master.wbn',
        content: builder.createBundle(),
        childFiles: [
            ...modules,
            ...staticAssets
        ]
    }

    return bundle
}
