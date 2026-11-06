export function getTableDimensions(table) {
  if (!table) return { width: 300, headerHeight: 44, estimatedLines: 1 };
  const name = table.name || '';
  const nameLen = name.length;

  // Standardize uniform, consistent card width (300px) across all tables
  // to avoid uneven horizontal expansion while preserving crisp typography
  let width = 300;
  if (nameLen > 34) {
    width = 340;
  }

  // Available width in header: width minus container padding (28px), table icon + gap (24px),
  // and action buttons or note icon margin (~60px)
  const availableHeaderWidth = width - 110;
  const charsPerLine = Math.max(16, Math.floor(availableHeaderWidth / 8.2));
  const estimatedLines = Math.max(1, Math.ceil(nameLen / charsPerLine));

  // Base 1-line header is 44px
  // Each additional wrapped line adds 22px
  const headerHeight = estimatedLines === 1 ? 44 : 44 + (estimatedLines - 1) * 22;

  return { width, headerHeight, estimatedLines };
}

// Helper to compute actual table card height based on current display mode
export function getTableCardHeight(t, displayMode = 'all') {
  if (!t) return 120;
  const { headerHeight } = getTableDimensions(t);
  let colCount = t.columns ? t.columns.length : 1;
  if (displayMode === 'tables') {
    colCount = 0;
  } else if (displayMode === 'keys') {
    const keys = (t.columns || []).filter(c => c.isPk || c.pk || c.isFk || c.fk || c.isUnique || c.unique);
    colCount = keys.length === 0 ? 1 : keys.length;
  }
  return headerHeight + colCount * 33 + 28;
}

export function isOptionalRelationship(rel, tables = null) {
  if (!rel) return false;

  // 1. Explicit optional flag or operator containing '?'
  if (rel.optional === true || rel.isOptional === true) return true;
  if (typeof rel.operator === 'string' && rel.operator.includes('?')) return true;
  if (typeof rel.cardinality === 'string' && (rel.cardinality.includes('?') || rel.cardinality.includes('0..'))) return true;

  // 2. Check inline ref definition on fromTable column
  if (tables && rel.fromTable && rel.fromColumn) {
    const fromTbl = Array.isArray(tables)
      ? tables.find(t =>
          t.name?.toLowerCase() === rel.fromTable?.toLowerCase() ||
          (t.schema && `${t.schema}.${t.name}`.toLowerCase() === rel.fromTable?.toLowerCase()) ||
          (rel.fromTable && rel.fromTable.toLowerCase().endsWith('.' + t.name?.toLowerCase()))
        )
      : tables;
    if (fromTbl && fromTbl.columns) {
      const col = fromTbl.columns.find(c =>
        c.name?.toLowerCase().replace(/["'`]/g, '') === rel.fromColumn?.toLowerCase().replace(/["'`]/g, '')
      );
      if (col && col.inlineRef) {
        if (col.inlineRef.optional === true || (typeof col.inlineRef.operator === 'string' && col.inlineRef.operator.includes('?'))) {
          return true;
        }
      }
    }
  }

  return false;
}
