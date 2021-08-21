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

interface WebAppConfig {
    manifest: WebAppManifest
    files: string[]
    imports: Dictionary
    scopes: Dictionary
}

interface WebAppImportMap {
    [ key: string ]: WebModule
}

interface WebAppManifest {
    name: string
    description: string
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

/**
 * ====================================================
 * UTILITIES & HELPERS
 * ====================================================
 */

/**
 * Utility for flattening module tree
 */
export function flattenModuleTree(indexModule: WebModule): WebModule[] {
    return [ indexModule, ...indexModule.childModules.flatMap(flattenModuleTree) ]
}

export function trimFileExtension(path: string): string {
    return path.replace('.' + path.split('.').pop() ?? '', '')
}

export const markupFileExtensions = [
    '.html'
]

export const scriptFileExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs'
]

export const styleFileExtensions = [
    '.css'
]

/**
 * Valid module file extensions
 */
export const moduleFileExtensions = [ 
    ...markupFileExtensions,
    ...scriptFileExtensions,
    ...styleFileExtensions 
] as const

/**
 * Module compatability compile targets
 */
export enum ModuleCompatabilityTarget {
    HTML = '.html',
    JS = '.mjs'
}

/**
 * Asynchronously reads a webmake.json file into memory
 */
export async function readWebAppConfig(path = TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, 'webmake.json') ?? 'webmake.json'): Promise<WebAppConfig> {
    return readFile(path).then(buffer => JSON.parse(buffer.toString()) as WebAppConfig)
}

/**
 * Asynchronously reads a package.json file into memory
 */
export async function readPackageConfig(path = TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, 'package.json') ?? 'package.json'): Promise<PackageConfig> {
    return readFile(path).then(buffer => JSON.parse(buffer.toString()) as PackageConfig)
}

/**
 * Asynchronously reads a tsconfig.json file into memory
 */
export async function readTypeScriptConfig(path = TypeScript.findConfigFile(dirname(process.cwd()), TypeScript.sys.fileExists, 'tsconfig.json') ?? 'tsconfig.json'): Promise<TypeScriptConfig> {
    return readFile(path).then(buffer => JSON.parse(buffer.toString()) as TypeScriptConfig)
}

/**
 * Asynchronously compiles a given index with app settings
 */
export async function webmake(path: string, compatabilityTarget = ModuleCompatabilityTarget.HTML): Promise<WebBundle> {
    const pkgConfig = await readPackageConfig()
    const appConfig = await readWebAppConfig()
    const tscConfig = await readTypeScriptConfig()

    const staticAssets = await importStaticAssets(appConfig)
    const dependencies = await importDependencies(pkgConfig, appConfig, tscConfig)
    const projectIndex = await importIndexModule(path, dependencies)

    const webModules = await compileModuleTree(projectIndex, compatabilityTarget, tscConfig)

    return createWebBundle(appConfig, staticAssets, webModules)
}

/**
 * ====================================================
 * PROGRAM CODE
 * ====================================================
 */

export async function importStaticAssets(appConfig: WebAppConfig): Promise<EphemeralFile[]> {
    return []
}

/**
 * Asynchronously imports a module tree from project dependencies
 */
export async function importDependencies(pkgConfig?: PackageConfig, appConfig?: WebAppConfig, tscConfig?: TypeScriptConfig): Promise<WebAppImportMap> {
    const dependencies: WebAppImportMap = {}

    if (appConfig) for (const from of Object.keys(appConfig.imports)) {
        dependencies[ from ] = appConfig.imports[ from ].startsWith('/') 
            ? await importIndexModule(join(dirname(process.cwd()), appConfig.imports[ from ]))
            : await importIndexModule(appConfig.imports[ from ])
    }

    if (tscConfig) for (const _from of Object.keys(tscConfig.compilerOptions.paths ?? {})) {
        // TODO
    }

    if (pkgConfig) for (const from of Object.keys(pkgConfig.dependencies ?? {})) {
        const dependencyDirectory = join(dirname(process.cwd()), 'node_modules', from)
        const dependencyPkgConfig = await readPackageConfig(TypeScript.findConfigFile(dependencyDirectory, TypeScript.sys.fileExists, 'package.json'))
        const dependencyDependencies = await importDependencies(dependencyPkgConfig)
        const dependencyMain = dependencyPkgConfig.module
            ? [ '.js', '.mjs' ].some(ext => dependencyPkgConfig.module?.endsWith(ext)) // TODO
                ? dependencyPkgConfig.module // sorry
                : dependencyPkgConfig.module + '.js' // for
            : dependencyPkgConfig.main // this
                ? [ '.js', '.mjs', '.cjs' ].some(ext => dependencyPkgConfig.main?.endsWith(ext)) // code
                    ? dependencyPkgConfig.main // spaghetti
                    : dependencyPkgConfig.main + '.js' 
                : 'index.js'

        dependencies[ from ] = await importIndexModule(join(dependencyDirectory, dependencyMain), dependencyDependencies)
    }

    dependencies[ 'webmake/jsx-runtime' ] = await importIndexModule(join(dirname(process.cwd()), 'src', 'jsx-runtime.ts'))

    return dependencies
}

/**
 * Asynchronously imports a module tree given an entry path
 */
export async function importWebModule(parentModule: WebModule | undefined, path: string, dependencies?: WebAppImportMap): Promise<WebModule> {
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

                if (dependencies && importDeclaration.from in dependencies) {
                    module.childModules.push(dependencies[ importDeclaration.from ])
                }
                else if (importDeclaration.fileName) {
                    module.childModules.push(await importWebModule(module, importDeclaration.fileName, dependencies))
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
export async function importIndexModule(path: string, dependencies?: WebAppImportMap): Promise<WebModule> {
    return importWebModule(void 0, path, dependencies)
}

export async function parseImportDeclaration(parentModule: WebModule, node: TypeScript.ImportDeclaration, srcFile: TypeScript.SourceFile, dependencies?: WebAppImportMap): Promise<ParsedImportDeclaration> {
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

export async function findModuleFile(path: string, dependencies?: WebAppImportMap): Promise<string> {

    if (dependencies && path in dependencies) {
        return dependencies[ path ].fileName
    }

    return ''
}

export async function compileModuleTree(indexModule: WebModule, compatabilityTarget: ModuleCompatabilityTarget, tscConfig?: TypeScriptConfig): Promise<WebModule[]> {
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
    const transpiled = TypeScript.transpileModule(module.content.toString(), {
        compilerOptions: {
            module: TypeScript.ModuleKind.ESNext,
            target: TypeScript.ScriptTarget.ESNext,
            jsx: TypeScript.JsxEmit.ReactJSX,
            jsxImportSource: '/node_modules/webmake'
        }
    })

    return { 
        ...module, 
        content: transpiled.outputText 
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

export async function createWebBundle(appConfig: WebAppConfig, staticAssets: EphemeralFile[] = [], modules: WebModule[] = []): Promise<WebBundle> {
    const primary = 'https://example.com/'
    const imports = modules.reduce((map, module) => Object.assign(map, { [ '/' + trimFileExtension(module.fileName) ]: '/' + module.fileName }), appConfig.imports)
    const builder = new WebBn.BundleBuilder(primary).setManifestURL(primary + 'manifest.json').addExchange(primary, 200, { 'content-type': 'text/html' }, `
        <!doctype html>
        <html>
            <head>
                <meta charset="utf-8"/>
                <script type="importmap">${ JSON.stringify({ imports }) }</script>
                <script type="module" src="${ modules[ 0 ]?.fileName }"></script>
                <title>${ appConfig.manifest.name }</title>
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
