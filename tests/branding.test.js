import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('Web and Windows retain original DBMaps artwork', () => {
  assert.equal(sha(read('public/favicon.svg').toString().replace(/\r\n/g, '\n')), '4f5b3c03e25db12e997ee190470b321317ec85028d55ec104c9e91ea6e746398');
  assert.equal(sha(read('rust-desktop/assets/DBMaps.ico')), '22cc22a23fc53c2bf8fc28b7c04b94fba2900da2d20f3bc66fa51d73284ef8e6');
  const component = read('src/components/DbMapLogo.vue').toString();
  assert.match(component, /src="\/favicon.svg"/);
  assert.doesNotMatch(component, /<svg/);
  assert.match(read('index.html').toString(), /<img src="\/favicon.svg"/);
  assert.match(read('rust-desktop/DBMaps.rc').toString(), /ICON "assets\/DBMaps.ico"/);
  assert.match(read('rust-desktop/installer.iss').toString(), /SetupIconFile=assets\\DBMaps.ico/);
});

test('Vendor artwork matches its recorded official publisher bytes', () => {
  const sources = JSON.parse(read('public/icons/sources.json'));
  assert.equal(Object.keys(sources).length, 6);
  for (const [name, { source, sha256 }] of Object.entries(sources)) {
    assert.equal(sha(read(`public/icons/${name}`)), sha256, name);
    assert.match(source, /^https:\/\/(?:www\.postgresql\.org|www\.mysql\.com|sqlite\.org|mariadb\.com|raw\.githubusercontent\.com\/holistics\/dbml|cdn-dynmedia-1\.microsoft\.com)\//);
  }
});
