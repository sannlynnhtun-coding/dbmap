import assert from 'node:assert/strict';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
const file = path.resolve(import.meta.dirname, '../tmp/desktop-integration.dbml');
const [page] = await fetch('http://127.0.0.1:13378/json').then(r => r.json());
assert.equal(page.url, 'https://dbmaps.localhost/app');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
function call(method, params = {}) {
  const current = ++id;
  const result = new Promise(resolve => { const handler = event => { const message = JSON.parse(event.data); if (message.id === current) { ws.removeEventListener('message', handler); resolve(message); } }; ws.addEventListener('message', handler); });
  ws.send(JSON.stringify({ id: current, method, params })); return result;
}
async function evaluate(expression) {
  const response = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.result.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails));
  return response.result.result.value;
}
async function until(expression) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) { if (await evaluate(expression)) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(`Timed out: ${expression}`);
}
await until("document.title === 'desktop-integration.dbml — DBMaps'");
const originalSchema = (await readFile(file, 'utf8')).split('\n').slice(1).join('\n');
const initial = await evaluate("({x:document.getElementById('table-card-public.users').style.left,y:document.getElementById('table-card-public.users').style.top})");
assert.deepEqual(initial, { x: '80px', y: '80px' });
await evaluate("(()=>{const table=document.getElementById('table-card-public.users');table.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,clientX:200,clientY:200}));window.dispatchEvent(new MouseEvent('mousemove',{clientX:300,clientY:260}));window.dispatchEvent(new MouseEvent('mouseup'));})()");
await until("document.title.startsWith('* ')");
const moved = await evaluate("({x:parseFloat(document.getElementById('table-card-public.users').style.left),y:parseFloat(document.getElementById('table-card-public.users').style.top)})");
assert.ok(moved.x > 80 && moved.y > 80);
await evaluate("window.dispatchEvent(new Event('dbmaps-save'))");
await until("!document.title.startsWith('* ')");
const saved = await readFile(file, 'utf8');
assert.equal(saved.split('\n').slice(1).join('\n'), originalSchema);
assert.deepEqual(JSON.parse(saved.split('\n')[0].slice('// dbmaps-layout:'.length)).tables['public.users'], moved);
const renamedSchema = originalSchema.replaceAll('public.users', 'public.members');
await evaluate("document.querySelector('.cm-content').focus()");
await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', modifiers: 2, windowsVirtualKeyCode: 65 });
await call('Input.insertText', { text: renamedSchema });
await until("!!document.getElementById('table-card-public.members')");
assert.deepEqual(await evaluate("({x:parseFloat(document.getElementById('table-card-public.members').style.left),y:parseFloat(document.getElementById('table-card-public.members').style.top)})"), moved);
await evaluate("document.querySelector('.cm-content').blur();document.getElementById('table-card-public.members').querySelectorAll('[title=\"Remove Column\"]')[1].click()");
await until("!document.querySelector('.cm-content').innerText.includes('name varchar')");
await evaluate("window.dispatchEvent(new Event('dbmaps-save'))");
await until("!document.title.startsWith('* ')");
const finalText = await readFile(file, 'utf8');
assert.match(finalText, /Table public\.members/);
assert.doesNotMatch(finalText, /name varchar/);
assert.deepEqual(JSON.parse(finalText.split('\n')[0].slice('// dbmaps-layout:'.length)).tables['public.members'], moved);
ws.close();
console.log('PASS: native document load, actual drag/save, raw text preservation, rename/layout, visual edit/editor sync, native disk save');
