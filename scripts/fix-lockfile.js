import { execSync } from 'child_process';
import { resolve } from 'path';

const root = resolve(import.meta.dirname, '..');

console.log('[v0] Regenerating package-lock.json with npm install...');
execSync('npm install --package-lock-only', {
  cwd: root,
  stdio: 'inherit',
});
console.log('[v0] Done. Lock file is now in sync.');
