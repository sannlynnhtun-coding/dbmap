import test from 'node:test';
import assert from 'node:assert/strict';
import { projectDbml, markdownTableSections } from '../src/utils/schemaExport.js';
test('DBML export preserves source text and generates missing source', () => {
  assert.equal(projectDbml({ customDbml: '// original schema' }), '// original schema');
  assert.equal(projectDbml({ customDbml: '' }), '');
  assert.match(projectDbml({ name: 'test', tables: [{ name: 'users', columns: [{ name: 'id', type: 'int', pk: true }] }] }), /Table users/);
});

test('Markdown preview handles per-table and combined exports without interpreting HTML', () => {
  const table = '| Column | Notes |\n| :--- | :--- |\n| id | <script>alert(1)</script> |';
  const sections = markdownTableSections('### `users`\n\n' + table + '\n\n### `posts`\n\n' + table);
  assert.equal(sections.length, 2);
  assert.equal(sections[0].title, 'users');
  assert.deepEqual(sections[1].headers, ['Column', 'Notes']);
  assert.deepEqual(sections[0].rows, [['id', '<script>alert(1)</script>']]);
  assert.equal(markdownTableSections(table)[0].title, '');
});
