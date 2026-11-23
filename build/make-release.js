// Makes the two files attached to a GitHub release (Degederon/TickerSec):
//   dist/release/TickerSec-Setup.exe   (the installer)
//   dist/release/latest.json           (tells every install which version is newest)
// Every install checks .../releases/latest/download/latest.json, so publishing
// a new GitHub release with these two files is all it takes.
// Usage: node build/make-release.js "What's new in this version"
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const REPO = 'Degederon/TickerSec';
const dist = path.join(__dirname, '..', 'dist');
const out = path.join(dist, 'release');
const exe = path.join(dist, `TickerSec Setup ${pkg.version}.exe`);
if (!fs.existsSync(exe)) { console.error(`Build the installer first: ${exe} not found`); process.exit(1); }

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(exe, path.join(out, 'TickerSec-Setup.exe'));
const manifest = {
  name: 'TickerSec',
  version: pkg.version,
  date: new Date().toISOString().slice(0, 10),
  notes: process.argv[2] || '',
  // Lets every install check that the installer it downloads really is this version.
  size: fs.statSync(exe).size,
  sha256: require('crypto').createHash('sha256').update(fs.readFileSync(exe)).digest('hex'),
  // This version's own download, so the checksum always matches.
  installer: `https://github.com/${REPO}/releases/download/v${pkg.version}/TickerSec-Setup.exe`
};
fs.writeFileSync(path.join(out, 'latest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Release files for v${pkg.version} written to ${out} — attach both to GitHub release v${pkg.version}.`);
