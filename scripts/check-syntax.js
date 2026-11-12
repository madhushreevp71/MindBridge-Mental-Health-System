// `npm run check` — syntax-checks every .js file in server/, scripts/ and public/.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
let failed = 0;
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) {
      // Browser code in public/ uses ES modules; server code is CommonJS.
      const isBrowser = full.includes(path.sep + 'public' + path.sep);
      try {
        if (isBrowser) execFileSync(process.execPath, ['--input-type=module', '--check'], { input: fs.readFileSync(full), stdio: ['pipe', 'pipe', 'pipe'] });
        else execFileSync(process.execPath, ['--check', full], { stdio: 'pipe' });
      }
      catch (e) { failed++; console.error('✖', path.relative(root, full), '\n', e.stderr.toString()); }
    }
  }
})(root);
console.log(failed ? `${failed} file(s) have syntax errors.` : '✔ All JavaScript files parse.');
process.exit(failed ? 1 : 0);
