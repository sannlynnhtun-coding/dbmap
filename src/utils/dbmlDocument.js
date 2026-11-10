import { generateDBML, parseDBML, validateDBML } from './dbmlParser.js';
import { arrangeRelationshipFlow } from './diagramLayout.js';

const marker = /^\/\/ dbmaps-layout:.*(?:\r?\n|$)/gm;
const record = value => value && typeof value === 'object' && !Array.isArray(value);
function header(text) {
  return text.match(/^(?:(?:[ \t]*\/\/[^\n]*(?:\n|$))|(?:[ \t\r]*\n))*/)[0];
}
export const schemaText = text => header(text).replace(marker, '') + text.slice(header(text).length);

export function readDbmlDocument(text) {
  const schema = schemaText(text.replace(/^\uFEFF/, ''));
  const validation = validateDBML(schema);
  const errors = validation.diagnostics.filter(item => item.severity === 'error');
  if (errors.length) throw new Error(errors.map(item => item.message).join('\n'));
  const project = { ...parseDBML(schema), customDbml: schema };
  if (schema.trim() && !project.tables.length && !project.enums.length && !project.projectConfig) {
    throw new Error('No supported DBML definitions found. The current document was kept.');
  }
  if (new Set(project.tables.map(table => table.name)).size !== project.tables.length) {
    throw new Error('Duplicate table names are not supported.');
  }
  const matches = [...header(text.replace(/^\uFEFF/, '')).matchAll(marker)];
  let warning = '';
  let display = {};
  arrangeRelationshipFlow(project.tables, project.relationships);
  if (matches.length) {
    try {
      if (matches.length !== 1) throw new Error('Duplicate layout comments');
      const layout = JSON.parse(matches[0][0].slice('// dbmaps-layout:'.length));
      if (layout.version !== 1 || !record(layout.tables) || !record(layout.display)) throw new Error('Unsupported layout');
      for (const position of Object.values(layout.tables)) {
        if (!record(position) || !Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error('Invalid position');
      }
      if (!['all', 'tables', 'keys'].includes(layout.display.tableDisplayMode)
        || typeof layout.display.showOptionalRelationships !== 'boolean') throw new Error('Invalid display settings');
      for (const table of project.tables) {
        if (Object.hasOwn(layout.tables, table.name)) {
          const { x, y } = layout.tables[table.name];
          Object.assign(table, { x, y });
        }
      }
      display = { tableDisplayMode: layout.display.tableDisplayMode,
        showOptionalRelationships: layout.display.showOptionalRelationships };
    } catch {
      warning = 'Layout metadata is invalid or unsupported. Schema opened with automatic layout. Use Save As to keep the original file.';
    }
  }
  return { project, display, warning };
}

export function writeDbmlDocument(project, display) {
  const text = project.customDbml ?? generateDBML(project.tables, project.relationships, project.name, project);
  const tables = Object.fromEntries(project.tables.map(table => [table.name, { x: table.x, y: table.y }]));
  for (const position of Object.values(tables)) {
    if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) throw new Error('Cannot save an invalid table position.');
  }
  return `// dbmaps-layout: ${JSON.stringify({ version: 1, tables, display })}\n${schemaText(text)}`;
}

// Compare schema only; renderer IDs, positions and inferred colors are not DBML edits.
export function generatedSchema(project) {
  return generateDBML(project.tables, project.relationships, 'Database', project);
}

export function matchPreviousTable(table, tables, nextTables) {
  const byName = tables.find(previous => previous.name === table.name);
  if (byName) return byName;
  const signature = item => JSON.stringify(item.columns.map(column => [column.name, column.type]));
  const removed = tables.filter(previous => !nextTables.some(next => next.name === previous.name));
  const candidates = removed.filter(previous => signature(previous) === signature(table));
  const added = nextTables.filter(next => !tables.some(previous => next.name === previous.name));
  return candidates.length === 1 && added.filter(next => signature(next) === signature(table)).length === 1
    ? candidates[0] : undefined;
}
