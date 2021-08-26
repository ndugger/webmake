import { Stats } from 'fs'
import { readdir, readFile, stat } from 'fs/promises'
import { join, parse, dirname, normalize, basename } from 'path/posix'
import * as TypeScript from 'typescript'
import * as WebBn from 'wbn'

import * as constants from './constants'

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

type EnumString<Value extends string> = `${ Value }`

interface OutputConfig {
    compatabilityTarget: EnumString<ModuleCompatabilityTarget>
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

function findDefaultConfigFile() {
    return TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, constants.defaultAppConfigFileName)
}

/**
 * Asynchronously reads a webmake.json file into memory
 */
export async function readConfig(path = findDefaultConfigFile()): Promise<WebMakeConfig> {
    return readFile(path ?? constants.defaultAppConfigFileName).then(buffer => JSON.parse(buffer.toString()) as WebMakeConfig)
}

function findDefaultPackageConfigFile() {
    return TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, constants.defaultPkgConfigFileName)
}

/**
 * Asynchronously reads a package.json file into memory
 */
export async function readPackageConfig(path = findDefaultPackageConfigFile()): Promise<PackageConfig> {
    return readFile(path ?? constants.defaultPkgConfigFileName).then(buffer => JSON.parse(buffer.toString()) as PackageConfig)
}

function findDefaultTypeScriptConfigFile() {
    return TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, constants.defaultTscConfigFileName)
}

/**
 * Asynchronously reads a tsconfig.json file into memory
 */
export async function readTypeScriptConfig(path = findDefaultTypeScriptConfigFile()): Promise<TypeScriptConfig> {
    return readFile(path ?? constants.defaultTscConfigFileName).then(buffer => JSON.parse(buffer.toString()) as TypeScriptConfig)
}

/**
 * Compiles a given index with output settings
 */
export async function webmake(index: string, outputConfig: Partial<OutputConfig> = {}): Promise<WebBundle> {
    const project = { 
        app: await readConfig(), 
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
            ? await importIndexModule(project, join(dirname(process.cwd()), project.app.imports[ from ]), {})
            : await importIndexModule(project, project.app.imports[ from ], {})
    }

    if (project.tsc) for (const _from of Object.keys(project.tsc.compilerOptions.paths ?? {})) {
        // TODO
    }

    if (project.pkg) for (const from of Object.keys(project.pkg.dependencies ?? {})) {
        const dependencyDirectory = join(dirname(process.cwd()), constants.nodeModulesDirName, from)
        const dependencyPkgConfig = await readPackageConfig(TypeScript.findConfigFile(dependencyDirectory, TypeScript.sys.fileExists, constants.defaultPkgConfigFileName))
        const dependencyDependencies = await importDependencies({ pkg: dependencyPkgConfig })
        const dependencyMain = dependencyPkgConfig.module
            ? [ '.js', '.mjs' ].some(ext => dependencyPkgConfig.module?.endsWith(ext)) // TODO
                ? dependencyPkgConfig.module // sorry
                : dependencyPkgConfig.module + '.js' // for
            : dependencyPkgConfig.main // this
                ? [ '.js', '.mjs', '.cjs' ].some(ext => dependencyPkgConfig.main?.endsWith(ext)) // code
                    ? dependencyPkgConfig.main // spaghetti
                    : dependencyPkgConfig.main + '.js' 
                : constants.indexFileName + '.js'

        dependencies[ from ] = await importIndexModule(project, join(dependencyDirectory, dependencyMain), dependencyDependencies)
    }
    
    if (project.app) {
        dependencies[ constants.jsxRuntimeName ] = await importIndexModule(project, join(dirname(process.cwd()), 'src', 'jsx-runtime.ts'), {})
        dependencies[ constants.runtimeName ] = await importIndexModule(project, join(dirname(process.cwd()), 'src', 'runtime.ts'), {})
    }

    return dependencies
}

/**
 * Asynchronously imports a module tree given an entry path
 */
export async function importWebModule(project: WebProject, parentModule: WebModule | undefined, path: string, dependencies: ModuleImportMap = {}): Promise<WebModule> {
    let content = await readModuleFile(path)

    if (constants.markupFileExtensions.some(ext => path.endsWith(ext))) {
        content = content.replace(/^<!doctype.+?>/i, '')
    }

    if (!content) {
        throw new Error('Module not found')
    }
    
    const module: WebModule = {
        fileName: normalize(path),
        content: '',
        dynamic: false,
        childModules: [],
        parentModule
    }

    if (constants.styleFileExtensions.some(ext => path.endsWith(ext))) {
        module.content = content
        return module
    }

    const printer = TypeScript.createPrinter({ newLine: TypeScript.NewLineKind.LineFeed })
    const srcFile = TypeScript.createSourceFile(path + '.tsx', content, TypeScript.ScriptTarget.ESNext)

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

                module.content += importDeclaration.declaration
            }
            else if (TypeScript.isExpressionStatement(node)) {

                for (const child of node.getChildren(srcFile)) {

                    if (TypeScript.isJsxElement(child)) {

                        if (module.content.includes('import.meta.document =')) {
                            throw new Error('Only one top-level HTML document allowed in web modules')
                        }

                        if (dependencies && dependencies[ constants.jsxRuntimeName ]) {
                            module.childModules.push(dependencies[ constants.jsxRuntimeName ])
                        }
                        
                        module.content += await printImportMetaDocument(node.getText(srcFile))
                    }
                    else {
                        module.content += printer.printNode(TypeScript.EmitHint.Unspecified, child, srcFile)
                    }
                }
            }
            else {
                module.content += printer.printNode(TypeScript.EmitHint.Unspecified, node, srcFile)
            }
        }
    }

    return module
}

export async function readFileStats(path: string): Promise<Stats | undefined> {
    try {
        return await stat(path)
    }
    catch {
        return void 0
    }
}

export async function readModuleFile(path: string): Promise<string> {
    const stats = await readFileStats(path)
    let contents = ''
    
    if (!stats) {
        return readModuleFile(dirname(path))
    }
    else if (stats.isDirectory()) {
        const joined = join(path, constants.indexFileName)
        const ext = await guessFileExtension(joined)
        const index = await readFile(joined + ext)
        contents = index.toString()
    }
    else {
        const file = await readFile(path)
        contents = file.toString()
    }

    return contents
}

export async function printImportMetaDocument(jsx: string): Promise<string> {
    return `
        import.meta.document = new DocumentFragment();
        import.meta.document.append(${ jsx });
        export default import.meta.document;
    `
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

                const ext = await guessFileExtension(joinedModulePath)
                const stats = await readFileStats(joinedModulePath) ?? await readFileStats(joinedModulePath + ext)

                if (stats?.isDirectory()) {
                    importDeclaration.fileName = join(joinedModulePath, constants.indexFileName + ext)
                }
                else {
                    importDeclaration.fileName = joinedModulePath

                    if (!constants.moduleFileExtensions.some(ext => importDeclaration.fileName.endsWith(ext))) {
                        importDeclaration.fileName += ext
                    }
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
            importDeclaration.declaration += child.getText(srcFile) + ' '
        }
    }

    return importDeclaration
}

export async function guessFileExtension(path: string, base?: string): Promise<string> {
    const stats = await readFileStats(path)

    if (!stats) {
        return guessFileExtension(dirname(path), basename(path))
    }

    const files = await readdir(stats.isDirectory() ? path : dirname(path))

    for (const file of files) {
        const filePath = parse(file)

        if (base && filePath.name === base) {
            return filePath.ext
        }

        if (filePath.base === basename(path)) {
            return filePath.ext
        }
    }

    const filePaths = files.map(parse)
    const index = filePaths.find(path => path.name === constants.indexFileName)

    if (stats.isDirectory() && index) {
        return index.ext
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

        if (module.fileName.startsWith(constants.nodeModulesDirName)) {
            modules.push(module)
        }
        else if (constants.markupFileExtensions.some(ext => module.fileName.endsWith(ext))) {
            modules.push(await transpileMarkup(module))
        }
        else if (constants.styleFileExtensions.some(ext => module.fileName.endsWith(ext))) {
            modules.push(await transpileStyle(module))
        }
        else if (constants.scriptFileExtensions.some(ext => module.fileName.endsWith(ext))) {
            modules.push(await transpileScript(module))
        }
        else {
            throw new Error(`Unsupported module type: ${ module.fileName }`)
        }
    }

    return modules
}

export async function transpileMarkup(module: WebModule): Promise<WebModule> {
    return {
        ...module,
        content: (await transpileScript(module)).content
    }
}

export async function transpileScript(module: WebModule): Promise<WebModule> {
    return { 
        ...module, 
        content: TypeScript.transpileModule(module.content.toString(), {
            compilerOptions: {
                module: TypeScript.ModuleKind.ESNext,
                target: TypeScript.ScriptTarget.ESNext,
                jsx: TypeScript.JsxEmit.ReactJSX,
                jsxImportSource: `/${ constants.nodeModulesDirName }/${ constants.appName }`
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

export async function createWebBundle(project: WebProject, staticFiles: EphemeralFile[] = [], codeModules: WebModule[] = []): Promise<WebBundle> {
    const primary = 'http://localhost/'
    const imports = codeModules.reduce((map, module) => Object.assign(map, { [ '/' + trimFileExtension(module.fileName) ]: '/' + module.fileName }), project.app?.imports ?? {})
    const builder = new WebBn.BundleBuilder(primary).setManifestURL(primary + constants.manifestConfigFileName).addExchange(primary, 200, { 'content-type': 'text/html' }, `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8"/>
                <title>${ project.app?.manifest?.name }</title>
                <link rel="manifest" href="/${ constants.manifestConfigFileName }"/>
                <script type="importmap">${ JSON.stringify({ imports }) }</script>
                <script type="module" src="${ codeModules[ 0 ]?.fileName }"></script>
            </head>
        </html>
    `)

    for (const module of codeModules) {
        builder.addExchange(primary + module.fileName, 200, { 'content-type': 'text/javascript' }, module.content)
    }

    const bundle: WebBundle = {
        fileName: 'main.wbn',
        content: builder.createBundle(),
        childFiles: [
            ...codeModules,
            ...staticFiles
        ]
    }

    return bundle
}
