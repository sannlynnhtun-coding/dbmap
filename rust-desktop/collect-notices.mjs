import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const metadata = JSON.parse(execFileSync('cargo', ['metadata', '--offline', '--locked', '--format-version', '1',
  '--filter-platform', 'x86_64-pc-windows-msvc', '--manifest-path', path.join(root, 'rust-desktop/Cargo.toml')], { maxBuffer: 32 * 1024 * 1024 }));
const notices = [];
async function collect(directory, name, version, license) {
  const files = (await readdir(directory, { withFileTypes: true }))
    .filter(item => item.isFile() && /^(licen[sc]e|copying|copyright|notice)([.-]|$)/i.test(item.name));
  assert.ok(license || files.length, `Missing license information: ${name}`);
  notices.push(`\n${'='.repeat(72)}\n${name} ${version}\nLicense: ${JSON.stringify(license || 'See included license')}\n`);
  for (const file of files) notices.push(`${file.name}\n${await readFile(path.join(directory, file.name), 'utf8')}\n`);
}
for (const pkg of metadata.packages.filter(pkg => pkg.name !== 'dbmaps-desktop')) {
  await collect(path.dirname(pkg.manifest_path), pkg.name, pkg.version, pkg.license);
}
async function npmPackages(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const folder = path.join(directory, entry.name);
    if (entry.name.startsWith('@')) { await npmPackages(folder); continue; }
    let pkg;
    try { pkg = JSON.parse(await readFile(path.join(folder, 'package.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    await collect(folder, pkg.name, pkg.version, pkg.license || pkg.licenses);
    try { await npmPackages(path.join(folder, 'node_modules')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
await npmPackages(path.join(root, 'node_modules'));
assert.ok(notices.length > 10, 'Dependency inventory was empty');
await mkdir(path.join(root, 'build'), { recursive: true });
await writeFile(path.join(root, 'build/THIRD-PARTY-NOTICES.txt'), notices.join(''), 'utf8');
console.log('Wrote build/THIRD-PARTY-NOTICES.txt');
