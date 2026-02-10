const esbuild = require('esbuild');
const path = require('path');

const inputPath = path.resolve(__dirname, 'frontend', 'src', 'index.jsx');
const outputPath = path.resolve(__dirname, 'public', 'js', 'react-bundle.js');

console.log('🚀 Starting build process...\n');
console.log(`📦 Building React app from: ${inputPath}`);
console.log(`📄 Outputting to: ${outputPath}`);

esbuild.build({
    entryPoints: [inputPath],
    bundle: true,
    outfile: outputPath,
    minify: true,
    sourcemap: true,
    format: 'iife',
    globalName: 'TechSevaReact',
    loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
    },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
}).then(() => {
    console.log('\n✅ React app build successful!');
}).catch((error) => {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
});
