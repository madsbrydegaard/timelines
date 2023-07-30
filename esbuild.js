import { build } from "esbuild";

const shared = {
	bundle: true,
	minify: true,
};

build({
	...shared,
	entryPoints: ["src/timelines.ts"],
	outfile: "index.js",
	format: "esm",
});

build({
	...shared,
	entryPoints: ["src/timelines.umd.js"],
	outfile: "dist/timelines.umd.js",
});
