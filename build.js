const fs = require('fs');
const path = require('path');

const src = fs.readFileSync('./dist/index.cjs', 'utf-8');

// Remove the shebang since we're using it as CommonJS
const cleanSrc = src.replace(/^#!.*\n/, '');

fs.writeFileSync('./dist/index.cjs', cleanSrc);
console.log('Built CLI');

// Make executable
const pkg = JSON.parse(fs.readFileSync('./package.json'));
const binPath = path.resolve('./' + pkg.bin.cipher);
fs.chmodSync(binPath, 0o755);
console.log('Made executable:', binPath);