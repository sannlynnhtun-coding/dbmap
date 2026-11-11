import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tourSteps } from '../src/utils/tourSteps.js';
test('workflow tour targets retained controls and explicitly reveals editor and canvas', () => {
  assert.equal(new Set(tourSteps.map(step => step.id)).size, tourSteps.length);
  assert.equal(tourSteps.find(step => step.id === 'editor').view, 'editor');
  assert.equal(tourSteps.find(step => step.id === 'canvas').view, 'canvas');
  const markup = ['Navbar', 'Sidebar', 'CodeEditor', 'Canvas'].map(name => readFileSync(new URL(`../src/components/${name}.vue`, import.meta.url), 'utf8')).join('');
  for (const step of tourSteps) {
    assert.ok(markup.includes(`id="${step.target.slice(1)}"`), step.target);
    assert.doesNotMatch(step.description, /cloud|publish|marketplace/i);
  }
  assert.equal(tourSteps.at(-1).id, 'dbml');
});
