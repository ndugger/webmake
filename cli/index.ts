import { ApplicationCompiler } from '../src/ApplicationCompiler'

const compiler = new ApplicationCompiler({ moduleCompatabilityTarget: 'mjs' })

compiler.importIndex('demo/index.tsx')

const bundles = compiler.makeBundles('http://localhost:8080')

console.log(bundles)
