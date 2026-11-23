// Guards the self-update path. A release must not be able to close its own installer.
const fs = require('fs'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const nsh = fs.readFileSync(path.join(root, 'build/installer.nsh'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

// 1. Installer closes the app by exact name only — never the whole process tree.
for (const line of nsh.split('\n').filter(l => /taskkill/i.test(l)))
  assert(!/\s\/T\b/i.test(line), 'installer.nsh: taskkill must not use /T (it kills the installer): ' + line.trim());

// 2. App's "close other copies" must skip setup programs.
const m = /Win32_Process -Filter "([^"]+)"/.exec(main);
assert(m && /not Name like '%Setup%'/.test(m[1]), 'main.js killOtherCopies must exclude *Setup* processes');

// 3. The installer is started directly — no PowerShell (blocked on many PCs).
const upd = fs.readFileSync(path.join(root, 'src/updater.js'), 'utf8');
assert(!/spawn\('powershell/i.test(upd), 'updater.js must not launch the installer through PowerShell');
assert(/once\('spawn'/.test(upd), 'updater must only quit after the installer has started');

console.log('update-guard: ok');
