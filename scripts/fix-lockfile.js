import { execSync } from 'child_process';

const root = '/vercel/share/v0-project';

console.log('[v0] Regenerating package-lock.json in:', root);
execSync('npm install --package-lock-only', {
  cwd: root,
  stdio: 'inherit',
});
console.log('[v0] Done. Lock file is now in sync.');
