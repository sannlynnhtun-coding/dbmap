export function createProjectBackup(project) {
  return {
    format: 'dbmap-project',
    version: 1,
    project: {
      name: project.name,
      description: project.description || '',
      dialect: project.dialect || 'postgres',
      tables: project.tables || [],
      relationships: project.relationships || [],
      enums: project.enums || [],
      tableGroups: project.tableGroups || [],
      projectConfig: project.projectConfig || null,
      customDbml: project.customDbml || null
    }
  };
}

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isRecordList = value => Array.isArray(value) && value.every(isRecord);

export function readProjectBackup(content) {
  let backup;
  try {
    backup = JSON.parse(content);
  } catch {
    throw new Error('This file does not contain valid JSON.');
  }
  if (backup?.format !== 'dbmap-project' || backup.version !== 1) {
    throw new Error('This project backup format or version is unsupported.');
  }

  const project = backup.project;
  if (!isRecord(project) || typeof project.name !== 'string' || !project.name.trim()
      || typeof project.description !== 'string' || typeof project.dialect !== 'string'
      || !isRecordList(project.tables) || !isRecordList(project.relationships)
      || !isRecordList(project.enums) || !isRecordList(project.tableGroups)
      || (project.projectConfig !== null && !isRecord(project.projectConfig))
      || (project.customDbml !== null && typeof project.customDbml !== 'string')
      || !project.tables.every(table => typeof table.name === 'string'
        && isRecordList(table.columns)
        && table.columns.every(column => typeof column.name === 'string' && typeof column.type === 'string'))) {
    throw new Error('This backup contains invalid project data.');
  }
  return createProjectBackup(project).project;
}
