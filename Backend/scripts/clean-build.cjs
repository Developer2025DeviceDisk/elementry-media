const fs = require('node:fs');
const path = require('node:path');
// Resolve fixed build artifacts relative to this project, never user input.
const root = path.resolve(__dirname, '..');
for (const name of ['dist', 'tsconfig.build.tsbuildinfo']) {
  const target = path.resolve(root, name);
  if (path.dirname(target) !== root) throw new Error('Invalid build artifact path');
  fs.rmSync(target, { recursive: name === 'dist', force: true });
}
