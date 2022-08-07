import { build } from "esbuild";
//import { dependencies, peerDependencies } from './package.json'

const shared = {
	bundle: true,
	//external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
};

build({
	...shared,
	entryPoints: ["src/timeline.ts"],
	outfile: "dist/timeline.esm.js",
	format: "esm",
});

build({
	...shared,
	entryPoints: ["src/timeline.umd.js"],
	outfile: "dist/timeline.umd.js"
});