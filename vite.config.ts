import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// Get all CodeMirror dependencies from package.json to externalize them
const cmDependencies = [
	'@codemirror/autocomplete',
	'@codemirror/commands',
	'@codemirror/language',
	'@codemirror/lint',
	'@codemirror/search',
	'@codemirror/state',
	'@codemirror/view',
	'@lezer/common',
	'@lezer/highlight',
	'@lezer/lr',
	'codemirror',
	'thememirror'
];

export default defineConfig(({ command }) => {
	const isProduction = command === 'build';

	return {
		server: {
			open: '/src/demo/index.html'
		},
		build: {
			lib: isProduction ? {
				entry: resolve(__dirname, 'src/index.ts'),
				fileName: (format) => `index.js`,
				formats: ['es'],
			} : undefined,
			rollupOptions: isProduction ? {
				external: cmDependencies,
				output: {
					preserveModules: true,
					preserveModulesRoot: 'src',
					entryFileNames: (chunk) => `${chunk.name.replace('src/', '')}.js`,
				}
			} : undefined,
			sourcemap: true,
			minify: 'esbuild',
			target: 'es2020',
			outDir: 'dist',
			emptyOutDir: true,
		},
		plugins: [
			...(isProduction ? [
				dts({
					entryRoot: 'src',
					include: ['src/**/*.ts'],
					exclude: ['src/**/*.test.ts', 'src/test/**/*', 'src/vite-env.d.ts', 'src/demo/**/*'],
				})
			] : [])
		],
		optimizeDeps: {
			esbuildOptions: {
				target: 'es2020'
			}
		}
	};
}); 