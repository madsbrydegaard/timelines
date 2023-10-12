import { build } from "esbuild";

const shared = {
	bundle: true,
	minify: true,
};

build({
	...shared,
	entryPoints: ["src/index.ts"],
	outfile: "dist/index.js",
	format: "esm",
});

build({
	...shared,
	entryPoints: ["src/index.umd.js"],
	outfile: "dist/index.umd.js",
});
