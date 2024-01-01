#!node_modules/.bin/rollup --config
import babelPresetEnv from "@babel/preset-env"
import babelPresetTypescript from "@babel/preset-typescript"
import { babel } from "@rollup/plugin-babel"
import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import babelPluginHere from "babel-plugin-here"

const MINIFY = false

/** @type {import("rollup").RollupOptions} */ export default {
	input: `src/index.ts`,
	output: { file: `dist/main.js`, generatedCode: "es2015", interop: "esModule", compact: MINIFY, format: "commonjs" },
	strictDeprecations: true,
	plugins: [
		nodeResolve({ extensions: [ ".ts" ] }),
		commonjs(),
		babel({
			babelHelpers: "bundled",
			extensions: [ ".ts", ".js" ],
			presets: [
				[ babelPresetEnv, { targets: { node: "10" } } ],
				[ babelPresetTypescript, { allowDeclareFields: true } ]
			],
			plugins: [ babelPluginHere() ]
		})
	]
}
