import { build } from "esbuild";
//import { dependencies, peerDependencies } from './package.json'

const shared = {
	entryPoints: ["src/timeline.ts"],
	bundle: true,
	//external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
};

build({
	...shared,
	outfile: "dist/timeline.esm.js",
	format: "esm",
});

build({
	...shared,
	outfile: "dist/timeline.udm.js"
});