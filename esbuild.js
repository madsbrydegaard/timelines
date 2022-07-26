import { build } from 'esbuild'
//import { Generator } from 'npm-dts'
//import { dependencies, peerDependencies } from './package.json'

const shared = {
entryPoints: ['src/index.ts'],
bundle: true,
sourcemap: true,
//external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
}

build({
...shared,
outfile: 'dist/timeline.js',
})

build({
...shared,
outfile: 'dist/timeline.esm.js',
format: 'esm',
})

// new Generator({
//   entry: 'src/index.ts',
//   output: 'dist/index.d.ts',
// }).generate()