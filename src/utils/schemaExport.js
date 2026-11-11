import { generateDBML } from './dbmlParser.js';

export function projectDbml(project) {
  return project.customDbml ?? generateDBML(project.tables || [], project.relationships || [], project.name, {
    enums: project.enums || [], tableGroups: project.tableGroups || [], projectConfig: project.projectConfig || null
  });
}

export function downloadDbmlFile(project) {
  const url = URL.createObjectURL(new Blob([projectDbml(project)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(project.name || 'database').replace(/[^\p{L}\p{N}_-]+/gu, '_')}.dbml`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// shortcut: renders only generated Markdown tables, use a Markdown renderer for arbitrary documents.
export function markdownTableSections(markdown) {
  return markdown.split(/\n\n(?=### )/).map(section => {
    const lines = section.split('\n').filter(Boolean);
    const title = lines[0]?.startsWith('### ') ? lines.shift().slice(4).replace(/^`|`$/g, '') : '';
    const rows = lines.map(line => line.slice(1, -1).split('|').map(cell => cell.trim()));
    return { title, headers: rows[0] || [], rows: rows.slice(2) };
  });
}
