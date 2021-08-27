/**
 * Valid markup file extensions
 */
 export const markupFileExtensions = [
    '.html',
    '.svg'
] as const

/**
 * Valid script file extensions
 */
export const scriptFileExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
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

export const appName = 'webmake'

/**
 * Default app config file name
 */
export const defaultAppConfigFileName = `${ appName }.json` as const

/**
 * Default package config file name
 */
export const defaultPkgConfigFileName = 'package.json'

/**
 * Default TypeScript config file name
 */
export const defaultTscConfigFileName = 'tsconfig.json'

/**
 * Convenient string for referencing an index module
 */
export const indexFileName = 'index'

/**
 * Convenient string for referencing the jsx-runtime
 */
export const jsxRuntimeName = `${ appName }/jsx-runtime` as const

export const runtimeName = `${ appName }/runtime` as const

/**
 * Convenient string for referencing the web manifest file name
 */
export const manifestConfigFileName = 'manifest.json'

/**
 * Convenient string for referencing the node_modules dir
 */
export const nodeModulesDirName = 'node_modules'
