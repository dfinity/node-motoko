const { execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const { setSourceMapURL } = require('../../lib/wasmSourceMap');

execSync('$(dfx cache show)/moc -wasi-system-api --map Debug.test.mo', {
    cwd: __dirname,
    stdio: 'inherit',
});

execSync('wasm2wat Debug.test.wasm > Debug.test.wat', {
    cwd: __dirname,
    stdio: 'inherit',
});

const wasmPath = join(__dirname, 'Debug.test.wasm');

const buffer = readFileSync(wasmPath);

const editedBuffer = setSourceMapURL(
    buffer,
    'http://localhost:3000/Debug.test.wasm.map',
);

console.log(buffer.length, editedBuffer.length);

writeFileSync(wasmPath, editedBuffer);
