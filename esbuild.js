import { build } from "esbuild";

const shared = {
	bundle: true,
	minify: true,
};

build({
	...shared,
	entryPoints: ["src/timeline.io.ts"],
	outfile: "index.js",
	format: "esm",
});

build({
	...shared,
	entryPoints: ["src/timeline.io.umd.js"],
	outfile: "dist/timeline.io.umd.js"
});