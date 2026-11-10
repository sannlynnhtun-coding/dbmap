/**
 * DBML Generator & Converter Utility for Vue ERD Canvas
 */

export function cleanNoteText(raw) {
  if (!raw) return '';
  let text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (text.startsWith('\n')) text = text.slice(1);
  if (text.endsWith('\n')) text = text.slice(0, -1);
  const lines = text.split('\n');
  if (lines.length > 1) {
    const nonBlank = lines.filter(l => l.trim().length > 0);
    if (nonBlank.length > 0) {
      const minIndent = Math.min(...nonBlank.map(l => l.match(/^\s*/)[0].length));
      if (minIndent > 0) {
        text = lines.map(l => (l.length >= minIndent ? l.slice(minIndent) : l)).join('\n');
      }
    }
  }
  return text.trim();
}

export function parseNoteFromSettings(settingsStr) {
  if (!settingsStr) return null;
  // 1. Triple-quoted note: note: '''...'''
  const tripleMatch = settingsStr.match(/note\s*:\s*'''([\s\S]*?)'''/i);
  if (tripleMatch) {
    return cleanNoteText(tripleMatch[1]);
  }
  // 2. Single-quoted note: note: '...' (supports quotes, braces, JSON, and escaped quotes)
  const singleMatch = settingsStr.match(/note\s*:\s*'((?:\\.|''|[^'\\])*)'/i);
  if (singleMatch) {
    const unescaped = singleMatch[1].replace(/\\'/g, "'").replace(/''/g, "'");
    return cleanNoteText(unescaped);
  }
  // 3. Double-quoted note: note: "..." (supports single quotes, braces, JSON, and escaped quotes)
  const doubleMatch = settingsStr.match(/note\s*:\s*"((?:\\.|""|[^"\\])*)"/i);
  if (doubleMatch) {
    const unescaped = doubleMatch[1].replace(/\\"/g, '"').replace(/""/g, '"');
    return cleanNoteText(unescaped);
  }
  return null;
}

export function hasClosingBracketOutsideStrings(str) {
  if (!str || !str.includes(']')) return false;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const prev = i > 0 ? str[i - 1] : '';
    if (ch === "'" && !inDouble && prev !== '\\') {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && prev !== '\\') {
      inDouble = !inDouble;
    } else if (ch === ']' && !inSingle && !inDouble) {
      return true;
    }
  }
  return false;
}

/**
 * Strips accidental DBML syntax wrappers if pasted into note fields, e.g.:
 * Table api_tokens [note: '''...'''] or [note: '''...'''] or note: '...'
 */
export function extractCleanNote(raw) {
  if (!raw) return '';
  const str = String(raw).trim();

  // Full table definition pasted: Table name [note: '''...''']
  const fullTableTriple = str.match(/Table\s+[a-zA-Z0-9_."']+\s*\[[\s\S]*?note\s*:\s*'''([\s\S]*?)'''[\s\S]*?\]/i);
  if (fullTableTriple) {
    return cleanNoteText(fullTableTriple[1]);
  }
  const fullTableSingle = str.match(/Table\s+[a-zA-Z0-9_."']+\s*\[[\s\S]*?note\s*:\s*(?:'((?:\\.|''|[^'\\])*)'|"((?:\\.|""|[^"\\])*)")[\s\S]*?\]/i);
  if (fullTableSingle) {
    const val = fullTableSingle[1] !== undefined ? fullTableSingle[1].replace(/\\'/g, "'").replace(/''/g, "'") : (fullTableSingle[2] || '').replace(/\\"/g, '"').replace(/""/g, '"');
    return cleanNoteText(val);
  }

  // Bracket note: [note: '''...'''] or [note: '...']
  const bracketTriple = str.match(/^\[?[\s\S]*?note\s*:\s*'''([\s\S]*?)'''[\s\S]*?\]?$/i);
  if (bracketTriple) {
    return cleanNoteText(bracketTriple[1]);
  }
  const bracketSingle = str.match(/^\[?[\s\S]*?note\s*:\s*(?:'((?:\\.|''|[^'\\])*)'|"((?:\\.|""|[^"\\])*)")[\s\S]*?\]?$/i);
  if (bracketSingle) {
    const val = bracketSingle[1] !== undefined ? bracketSingle[1].replace(/\\'/g, "'").replace(/''/g, "'") : (bracketSingle[2] || '').replace(/\\"/g, '"').replace(/""/g, '"');
    return cleanNoteText(val);
  }

  // Pure triple quotes: '''...'''
  const tripleOnly = str.match(/^'''([\s\S]*?)'''$/);
  if (tripleOnly) {
    return cleanNoteText(tripleOnly[1]);
  }

  return cleanNoteText(raw);
}

/**
 * Safely formats note text with HTML-escaping and Markdown enhancements
 * (inline code `code`, bold **text**, bullet points, and paragraph breaks)
 */
export function formatNoteHtml(text) {
  if (!text) return '';
  // 1. Safe HTML Entity Escaping
  let escaped = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 2. Inline code `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/80 font-mono text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold">$1</code>');

  // 3. Bold **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-slate-100">$1</strong>');

  // 4. Bullet lists and paragraph breaks
  const lines = escaped.split('\n');
  const processed = [];
  let inList = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (/^[-*•]\s+/.test(trimmedLine)) {
      if (!inList) {
        processed.push('<ul class="list-disc pl-4 space-y-1 my-1">');
        inList = true;
      }
      processed.push(`<li>${trimmedLine.replace(/^[-*•]\s+/, '')}</li>`);
    } else {
      if (inList) {
        processed.push('</ul>');
        inList = false;
      }
      processed.push(trimmedLine.length === 0 ? '<div class="h-1.5"></div>' : `<div>${line}</div>`);
    }
  }
  if (inList) {
    processed.push('</ul>');
  }

  return processed.join('');
}

/**
 * Supported DBML Relationship Operators
 * Standard:
 *   >  Many-to-One
 *   <  One-to-Many
 *   -  One-to-One
 *   <> Many-to-Many
 * Optional (Nullable foreign key with 0..1 cardinality):
 *   >? or ?>   Many-to-Optional-One (optional foreign key)
 *   <? or ?<   Optional One-to-Many
 *   -? or ?-   Optional One-to-One
 *   ?-?        Optional-to-Optional One-to-One
 *   <>? or ?<> Optional Many-to-Many
 */
export const VALID_REL_OPERATORS = [
  '>', '<', '-', '<>',
  '>?', '?>', '?>?',
  '<?', '?<', '?<?',
  '-?', '?-', '?-?',
  '<>?', '?<>', '?<>?'
];

export function isValidRelOperator(op) {
  return VALID_REL_OPERATORS.includes(op);
}

export function splitTableAndColumn(fullPath) {
  if (!fullPath) return { table: '', column: '', schema: '' };
  const trimmed = fullPath.trim();
  // Match tokens: either quoted "my table" / 'my col' or unquoted identifier
  const regex = /"([^"]+)"|'([^']+)'|([^\s.]+)/g;
  const parts = [];
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    const val = match[1] ?? match[2] ?? match[3];
    if (val !== undefined && val !== '') {
      parts.push(val.trim());
    }
  }

  if (parts.length === 0) return { table: '', column: '', schema: '' };
  if (parts.length === 1) return { table: parts[0], column: '', schema: '' };
  if (parts.length === 2) return { table: parts[0], column: parts[1], schema: '' };

  const column = parts[parts.length - 1];
  const table = parts[parts.length - 2];
  const schema = parts.slice(0, -2).join('.');
  return { table: `${schema}.${table}`, column, schema };
}

/**
 * Robust DBML relationship parser that handles:
 * - Ref: a.b > c.d
 * - Ref: a.b >? c.d
 * - Ref a.b > c.d
 * - Ref fk_name: a.b > c.d
 * - Ref: "Order Details"."order_id" > "Orders"."id"
 * - Operators: >, <, -, <>, and optional variants (>?, ?>, <?, ?<, -?, ?-, <>?, ?<>)
 * - Automatically normalizes child-referencing-parent so fromTable is foreign key and toTable is primary key
 */
export function parseRefLine(rawLine) {
  let line = (rawLine || '').trim();
  if (!line) return null;

  let refName = null;
  if (/^Ref\b/i.test(line)) {
    line = line.replace(/^Ref\b/i, '').trim();
    if (line.startsWith(':')) {
      line = line.substring(1).trim();
    } else {
      const namedMatch = line.match(/^([a-zA-Z0-9_"]+)\s*:(.*)$/);
      if (namedMatch) {
        refName = namedMatch[1].replace(/["']/g, '');
        line = namedMatch[2].trim();
      }
    }
  }

  let settingsBlock = '';
  const settingsMatch = line.match(/\[([\s\S]*)\]\s*$/);
  if (settingsMatch) {
    settingsBlock = settingsMatch[1];
    line = line.substring(0, settingsMatch.index).trim();
  }

  // Normalize spaces inside operator (e.g. "> ?" -> ">?", "? >" -> "?>")
  line = line.replace(/([><\-])\s*\?/g, '$1?').replace(/\?\s*([><\-])/g, '?$1');

  // Match lhs <operator> rhs
  const opMatch = line.match(/\s+([\-<>?]+)\s+/);
  let lhs = '';
  let rawSymbol = '';
  let rhs = '';

  if (opMatch) {
    rawSymbol = opMatch[1];
    lhs = line.substring(0, opMatch.index).trim();
    rhs = line.substring(opMatch.index + opMatch[0].length).trim();
  } else {
    // If no whitespace around operator, match direct operator boundary
    const directMatch = line.match(/^([^\s\[\-\<\>\?]+|"(?:\\.|[^"\\])*")\s*([\-<>?]+)\s*([^\s\[\-\<\>\?]+|"(?:\\.|[^"\\])*")$/);
    if (!directMatch) return null;
    lhs = directMatch[1].trim();
    rawSymbol = directMatch[2].trim();
    rhs = directMatch[3].trim();
  }

  const fromParts = splitTableAndColumn(lhs);
  const toParts = splitTableAndColumn(rhs);

  if (!fromParts.table || !fromParts.column || !toParts.table || !toParts.column) {
    return null;
  }

  const isOptional = rawSymbol.includes('?');
  let fromTable = fromParts.table;
  let fromColumn = fromParts.column;
  let toTable = toParts.table;
  let toColumn = toParts.column;
  let operator = '>';
  let cardinality = 'N:1';

  if (rawSymbol.includes('<>')) {
    operator = isOptional ? '<>?' : '<>';
    cardinality = 'N:M';
  } else if (rawSymbol.includes('-')) {
    operator = isOptional ? '-?' : '-';
    cardinality = '1:1';
  } else if (rawSymbol.startsWith('<') || rawSymbol.endsWith('<')) {
    // Normalization: left side was parent (1), right side was child (N).
    // Swap so fromTable is ALWAYS child (FK) and toTable is ALWAYS parent (PK)
    fromTable = toParts.table;
    fromColumn = toParts.column;
    toTable = fromParts.table;
    toColumn = fromParts.column;
    operator = isOptional ? '>?' : '>';
    cardinality = 'N:1';
  } else {
    operator = isOptional ? '>?' : '>';
    cardinality = 'N:1';
  }

  let onDelete = 'CASCADE';
  const delMatch = (settingsBlock || '').match(/(?:delete|on\s+delete)\s*:\s*([a-zA-Z_]+(?:\s+[a-zA-Z_]+)?)/i);
  if (delMatch) {
    onDelete = delMatch[1].toUpperCase().trim();
  }

  let onUpdate = null;
  const updateMatch = (settingsBlock || '').match(/(?:update|on\s+update)\s*:\s*([a-zA-Z_]+(?:\s+[a-zA-Z_]+)?)/i);
  if (updateMatch) {
    onUpdate = updateMatch[1].toUpperCase().trim();
  }

  return {
    id: 'rel-' + Math.random().toString(36).substring(2, 9),
    name: refName || undefined,
    fromTable,
    fromColumn,
    toTable,
    toColumn,
    cardinality,
    operator,
    optional: isOptional,
    onDelete,
    hasExplicitOnDelete: Boolean(delMatch),
    onUpdate: onUpdate || null,
    isInline: false
  };
}

/**
 * Helpers for bracket settings formatting
 */
export function splitBracketSettings(content) {
  const parts = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "'" && !inDoubleQuote && !inBacktick) {
      if (content.substr(i, 3) === "'''") {
        current += "'''";
        i += 2;
        inSingleQuote = !inSingleQuote;
        continue;
      }
      inSingleQuote = !inSingleQuote;
    } else if (ch === '"' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (ch === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (ch === ',' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function formatSingleSetting(s) {
  const trimmed = s.trim();
  let inQuote = false;
  let quoteChar = '';
  let colonIdx = -1;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if ((ch === "'" || ch === '"' || ch === '`') && !inQuote) {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === quoteChar && inQuote) {
      inQuote = false;
    } else if (ch === ':' && !inQuote) {
      colonIdx = i;
      break;
    }
  }

  if (colonIdx !== -1) {
    const key = trimmed.substring(0, colonIdx).trim();
    const val = trimmed.substring(colonIdx + 1).trim();
    return `${key}: ${val}`;
  }
  return trimmed;
}

export function formatBracketString(bracketWithBrackets) {
  if (!bracketWithBrackets) return '';
  const match = bracketWithBrackets.match(/^\[([\s\S]*)\]$/);
  if (!match) return bracketWithBrackets;
  const inner = match[1];
  const items = splitBracketSettings(inner);
  const formattedItems = items.map(formatSingleSetting);
  return `[${formattedItems.join(', ')}]`;
}

/**
 * Parses a column definition line in DBML.
 * Handles:
 * - Unquoted, double-quoted, single-quoted, and backtick-quoted column names ("created_at", `id`, 'status')
 * - Any data type including timestamptz, bigint, text[], int[][], varchar(255), decimal(10, 2), timestamp with time zone, "custom_enum"
 * - Bracket settings [pk, increment, not null, default: `now()`, note: '...']
 */
export function parseColumnDefinition(trimmed) {
  if (!trimmed || typeof trimmed !== 'string') return null;
  const line = trimmed.trim();
  if (!line) return null;
  if (/^(?:indexes|note)\b/i.test(line) || /^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|CHECK)\b/i.test(line)) {
    return null;
  }

  let colName = '';
  let rest = '';
  let rawName = '';

  if (line.startsWith('"')) {
    const endQuote = line.indexOf('"', 1);
    if (endQuote === -1) return null;
    colName = line.substring(1, endQuote);
    rawName = line.substring(0, endQuote + 1);
    rest = line.substring(endQuote + 1).trim();
  } else if (line.startsWith("'")) {
    const endQuote = line.indexOf("'", 1);
    if (endQuote === -1) return null;
    colName = line.substring(1, endQuote);
    rawName = line.substring(0, endQuote + 1);
    rest = line.substring(endQuote + 1).trim();
  } else if (line.startsWith('`')) {
    const endQuote = line.indexOf('`', 1);
    if (endQuote === -1) return null;
    colName = line.substring(1, endQuote);
    rawName = line.substring(0, endQuote + 1);
    rest = line.substring(endQuote + 1).trim();
  } else {
    const nameMatch = line.match(/^([a-zA-Z0-9_.-]+)\s*(.*)$/);
    if (!nameMatch) return null;
    colName = nameMatch[1];
    rawName = colName;
    rest = nameMatch[2].trim();
  }

  if (!colName) return null;

  let colType = '';
  let bracketContent = undefined;

  // Find settings bracket: skip array brackets like [] or [][]
  let settingsStartIdx = -1;
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '[') {
      if (rest[i + 1] === ']') {
        i++; // skip array closing bracket
        continue;
      }
      settingsStartIdx = i;
      break;
    }
  }

  if (settingsStartIdx !== -1) {
    colType = rest.substring(0, settingsStartIdx).trim().replace(/^["']|["']$/g, '');
    bracketContent = rest.substring(settingsStartIdx + 1);
  } else {
    colType = rest.trim().replace(/^["']|["']$/g, '');
  }

  return { colName, colType, bracketContent, rawName };
}

/**
 * Format DBML document with zero data loss.
 * Preserves 100% of all:
 * - Table, Enum, TableGroup, Project, Ref, Note blocks
 * - Table aliases, headercolors, notes
 * - Columns, types, brackets [pk, unique, not null, default: ..., note: ..., ref: ...]
 * - Table indexes { ... } with composite keys, expressions, settings
 * - Enum values with settings [note: ...]
 * - TableGroup lists with [color: ...]
 * - Inline and standalone relationships with cardinality, actions (delete, update)
 * - Single-line (//, #) and multi-line (/* ... *\/) comments
 * - Multi-line strings (''' ... ''')
 */
export function formatDBML(dbmlText) {
  if (!dbmlText || typeof dbmlText !== 'string') return dbmlText || '';

  const rawLines = dbmlText.split('\n');
  const formattedLines = [];

  let inBlockComment = false;
  let inTripleQuote = false;
  const blockStack = [];
  let pendingBlockHeader = null;

  function hasUnclosedBracket(str) {
    let bracketDepth = 0;
    let inSingle = false;
    let inDouble = false;
    let inBacktick = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const prev = i > 0 ? str[i - 1] : '';
      if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
        if (str.substr(i, 3) === "'''") {
          i += 2;
        }
        inSingle = !inSingle;
      } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
        inDouble = !inDouble;
      } else if (ch === '`' && !inSingle && !inDouble && prev !== '\\') {
        inBacktick = !inBacktick;
      } else if (!inSingle && !inDouble && !inBacktick) {
        if (ch === '[') bracketDepth++;
        else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
      }
    }
    return bracketDepth > 0;
  }

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimmed = rawLine.trim();

    // 1. Handle inside triple-quote note (multi-line string)
    if (inTripleQuote) {
      if (trimmed.includes("'''")) {
        inTripleQuote = false;
        const endIdx = trimmed.indexOf("'''");
        const afterTriple = trimmed.substring(endIdx + 3).trim();
        const baseIndent = '  '.repeat(blockStack.length);
        const sep = (afterTriple && !afterTriple.startsWith(']') && !afterTriple.startsWith(',') && !afterTriple.startsWith(')')) ? ' ' : '';
        const formattedLine = afterTriple ? `${baseIndent}'''${sep}${afterTriple}` : `${baseIndent}'''`;
        formattedLines.push(formattedLine);

        if (pendingBlockHeader && formattedLine.trim().endsWith('{')) {
          blockStack.push(pendingBlockHeader);
          pendingBlockHeader = null;
        }
      } else {
        formattedLines.push(rawLine);
      }
      continue;
    }

    // 2. Handle inside block comment /* ... */
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
        const currentIndent = '  '.repeat(blockStack.length);
        formattedLines.push(currentIndent + trimmed);
      } else {
        formattedLines.push(rawLine);
      }
      continue;
    }

    // Check for start of block comment on this line
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/') || trimmed.indexOf('*/') < trimmed.indexOf('/*') + 2) {
        inBlockComment = true;
      }
      const currentIndent = '  '.repeat(blockStack.length);
      formattedLines.push(currentIndent + trimmed);
      continue;
    }

    // Handle blank lines
    if (!trimmed) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    // Handle line comments (// or #)
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      const currentIndent = '  '.repeat(blockStack.length);
      formattedLines.push(currentIndent + trimmed);
      continue;
    }

    // Check for start of triple quote note on this line
    const tripleQuoteIdx = trimmed.indexOf("'''");
    if (tripleQuoteIdx !== -1) {
      const secondTripleIdx = trimmed.indexOf("'''", tripleQuoteIdx + 3);
      if (secondTripleIdx === -1) {
        inTripleQuote = true;
      }
    }

    // Check for lone opening brace { if preceding block header already opened {
    if (trimmed === '{' && formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim().endsWith('{')) {
      continue;
    }

    // 3. Check for closing brace }
    if (trimmed.startsWith('}')) {
      if (blockStack.length > 0) {
        blockStack.pop();
      }
      const closingIndent = '  '.repeat(blockStack.length);
      formattedLines.push(closingIndent + '}');
      continue;
    }

    // Pending block header check (e.g. multi-line header closing bracket or brace)
    if (pendingBlockHeader) {
      if (trimmed.endsWith('{')) {
        const lineIndent = '  '.repeat(blockStack.length);
        formattedLines.push(lineIndent + trimmed);
        blockStack.push(pendingBlockHeader);
        pendingBlockHeader = null;
        continue;
      } else if (!hasUnclosedBracket(trimmed) && trimmed.includes(']')) {
        const lineIndent = '  '.repeat(blockStack.length);
        formattedLines.push(lineIndent + trimmed + ' {');
        blockStack.push(pendingBlockHeader);
        pendingBlockHeader = null;
        continue;
      } else {
        const lineIndent = '  '.repeat(blockStack.length + 1);
        formattedLines.push(lineIndent + trimmed);
        continue;
      }
    }

    // 4. Check for Block Headers
    // Project block
    if (/^Project\b/i.test(trimmed)) {
      const match = trimmed.match(/^Project(?:\s+([a-zA-Z0-9_."]+))?\s*(\{?)$/i);
      const projName = match && match[1] ? ` ${match[1]}` : '';
      formattedLines.push(`Project${projName} {`);
      blockStack.push('Project');
      continue;
    }

    // Enum block
    if (/^Enum\b/i.test(trimmed)) {
      const match = trimmed.match(/^Enum\s+([a-zA-Z0-9_."`']+)\s*(\{?)$/i);
      const enumName = match && match[1] ? match[1] : trimmed.replace(/^Enum\s+/i, '').replace(/\{$/, '').trim();
      formattedLines.push(`Enum ${enumName} {`);
      blockStack.push('Enum');
      continue;
    }

    // TableGroup block
    if (/^TableGroup\b/i.test(trimmed)) {
      const isMultiLine = hasUnclosedBracket(trimmed) || inTripleQuote || (!trimmed.endsWith('{') && (trimmed.includes('[') || trimmed.includes("'''")));
      if (isMultiLine) {
        pendingBlockHeader = 'TableGroup';
        formattedLines.push(trimmed);
        continue;
      }
      const match = trimmed.match(/^TableGroup\s+([a-zA-Z0-9_."`']+)(?:\s*\[([\s\S]*?)\])?\s*(\{?)$/i);
      if (match) {
        const tgName = match[1];
        const settings = match[2] ? ' ' + formatBracketString(`[${match[2]}]`) : '';
        formattedLines.push(`TableGroup ${tgName}${settings} {`);
      } else {
        formattedLines.push(trimmed.endsWith('{') ? trimmed : trimmed + ' {');
      }
      blockStack.push('TableGroup');
      continue;
    }

    // Table block
    if (/^Table\b/i.test(trimmed)) {
      const isMultiLine = hasUnclosedBracket(trimmed) || inTripleQuote || (!trimmed.endsWith('{') && (trimmed.includes('[') || trimmed.includes("'''")));
      if (isMultiLine) {
        pendingBlockHeader = 'Table';
        formattedLines.push(trimmed);
        continue;
      }
      const match = trimmed.match(/^Table\s+(?:([a-zA-Z0-9_"`']+)\.)?([a-zA-Z0-9_"`']+)(?:\s+as\s+([a-zA-Z0-9_"`']+))?(?:\s*\[([\s\S]*?)\])?\s*(\{?)$/i);
      if (match) {
        const schema = match[1] ? `${match[1]}.` : '';
        const name = match[2];
        const alias = match[3] ? ` as ${match[3]}` : '';
        const settings = match[4] ? ' ' + formatBracketString(`[${match[4]}]`) : '';
        formattedLines.push(`Table ${schema}${name}${alias}${settings} {`);
      } else {
        formattedLines.push(trimmed.endsWith('{') ? trimmed : trimmed + ' {');
      }
      blockStack.push('Table');
      continue;
    }

    // indexes block inside Table
    if (/^indexes\b/i.test(trimmed)) {
      const currentIndent = '  '.repeat(blockStack.length);
      formattedLines.push(`${currentIndent}indexes {`);
      blockStack.push('indexes');
      continue;
    }

    // Ref block header: Ref [name] {
    if (/^Ref\b.*\{$/i.test(trimmed)) {
      const currentIndent = '  '.repeat(blockStack.length);
      const header = trimmed.replace(/\s*\{$/, ' {').trim();
      formattedLines.push(`${currentIndent}${header}`);
      blockStack.push('Ref');
      continue;
    }

    // Note block header: Note [name] {
    if (/^Note\b.*\{$/i.test(trimmed)) {
      const currentIndent = '  '.repeat(blockStack.length);
      const header = trimmed.replace(/\s*\{$/, ' {').trim();
      formattedLines.push(`${currentIndent}${header}`);
      blockStack.push('Note');
      continue;
    }

    // 5. Inside blocks
    const currentBlock = blockStack[blockStack.length - 1];
    const currentIndent = '  '.repeat(blockStack.length);

    if (currentBlock === 'Enum') {
      const bracketIdx = trimmed.indexOf('[');
      if (bracketIdx !== -1 && trimmed.endsWith(']')) {
        const valName = trimmed.substring(0, bracketIdx).trim();
        const bracketPart = trimmed.substring(bracketIdx).trim();
        formattedLines.push(`${currentIndent}${valName} ${formatBracketString(bracketPart)}`);
      } else {
        formattedLines.push(`${currentIndent}${trimmed}`);
      }
      continue;
    }

    if (currentBlock === 'TableGroup') {
      formattedLines.push(`${currentIndent}${trimmed}`);
      continue;
    }

    if (currentBlock === 'indexes') {
      const bracketIdx = trimmed.indexOf('[');
      if (bracketIdx !== -1 && trimmed.endsWith(']')) {
        const colPart = trimmed.substring(0, bracketIdx).trim();
        const bracketPart = trimmed.substring(bracketIdx).trim();
        formattedLines.push(`${currentIndent}${colPart} ${formatBracketString(bracketPart)}`);
      } else {
        formattedLines.push(`${currentIndent}${trimmed}`);
      }
      continue;
    }

    if (currentBlock === 'Project') {
      formattedLines.push(`${currentIndent}${trimmed}`);
      continue;
    }

    if (currentBlock === 'Table') {
      if (/^Note\b/i.test(trimmed)) {
        formattedLines.push(`${currentIndent}${trimmed}`);
        continue;
      }

      if (/^Ref\b/i.test(trimmed)) {
        formattedLines.push(`${currentIndent}${trimmed}`);
        continue;
      }

      const colDef = parseColumnDefinition(trimmed);
      if (colDef) {
        const name = colDef.rawName;
        const typeStr = colDef.colType ? ` ${colDef.colType}` : '';
        if (colDef.bracketContent !== undefined) {
          formattedLines.push(`${currentIndent}${name}${typeStr} ${formatBracketString('[' + colDef.bracketContent)}`);
        } else {
          formattedLines.push(`${currentIndent}${name}${typeStr}`);
        }
      } else {
        formattedLines.push(`${currentIndent}${trimmed}`);
      }
      continue;
    }

    // 6. Standalone lines (Ref: a > b, Note: '...', etc.)
    if (/^Ref\b/i.test(trimmed)) {
      const bracketIdx = trimmed.indexOf('[');
      if (bracketIdx !== -1 && trimmed.endsWith(']')) {
        const refExpr = trimmed.substring(0, bracketIdx).trim();
        const bracketPart = trimmed.substring(bracketIdx).trim();
        formattedLines.push(`${currentIndent}${refExpr} ${formatBracketString(bracketPart)}`);
      } else {
        formattedLines.push(`${currentIndent}${trimmed}`);
      }
      continue;
    }

    formattedLines.push(`${currentIndent}${trimmed}`);
  }

  // Ensure clean 1 blank line between top-level blocks
  const resultLines = [];
  let prevWasCloseBrace = false;

  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    if (prevWasCloseBrace && line !== '' && !line.startsWith(' ') && !line.startsWith('}')) {
      resultLines.push('');
    }
    resultLines.push(line);
    prevWasCloseBrace = line === '}';
  }

  return resultLines.join('\n').trim() + '\n';
}

export function generateDBML(tables = [], relationships = [], projectName = 'Database Schema', options = {}) {
  // Support options object or array (for enums)
  const actualOptions = Array.isArray(options) ? { enums: options } : (options || {});
  const projectConfig = actualOptions.projectConfig || null;
  const enums = actualOptions.enums || [];
  const tableGroups = actualOptions.tableGroups || [];

  let dbml = `// DBML Database Schema: ${projectName}\n`;
  dbml += `// Generated on ${new Date().toLocaleDateString()}\n\n`;

  // Project block if defined
  if (projectConfig) {
    dbml += `Project ${projectConfig.name || projectName} {\n`;
    if (projectConfig.databaseType) {
      dbml += `  database_type: '${projectConfig.databaseType}'\n`;
    }
    if (projectConfig.note) {
      dbml += `  Note: '${projectConfig.note.replace(/'/g, "\\'")}'\n`;
    }
    dbml += `}\n\n`;
  }

  // Enums
  if (enums && enums.length > 0) {
    enums.forEach(en => {
      dbml += `Enum ${en.name} {\n`;
      (en.values || []).forEach(val => {
        if (typeof val === 'string') {
          dbml += `  ${val}\n`;
        } else if (val.note) {
          dbml += `  ${val.name} [note: '${val.note.replace(/'/g, "\\'")}']\n`;
        } else {
          dbml += `  ${val.name}\n`;
        }
      });
      dbml += `}\n\n`;
    });
  }

  // Track which relationships were rendered as field-level inline refs so they aren't duplicated at bottom
  const emittedInlineRelIds = new Set();

  // Tables
  tables.forEach(table => {
    const aliasStr = table.alias ? ` as ${table.alias}` : '';
    const headerColorStr = table.headerColor ? ` [headercolor: ${table.headerColor}]` : '';
    dbml += `Table ${table.name}${aliasStr}${headerColorStr} {\n`;
    (table.columns || []).forEach(col => {
      let settings = [];
      if (col.isPk || col.pk) settings.push('pk');
      if (col.increment) settings.push('increment');
      if ((col.isUnique || col.unique) && !(col.isPk || col.pk)) settings.push('unique');
      if ((col.isNull === false || col.notNull === true) && !(col.isPk || col.pk)) settings.push('not null');

      // Preserve and format field-level ref: e.g. [ref: > users.id]
      const inlineRels = (relationships || []).filter(r =>
        r.isInline &&
        r.fromTable?.toLowerCase() === table.name?.toLowerCase() &&
        r.fromColumn?.toLowerCase() === col.name?.toLowerCase()
      );

      if (inlineRels.length === 0 && (col.isInlineRef || col.inlineRef)) {
        if (col.inlineRef && col.inlineRef.toTable && col.inlineRef.toColumn) {
          inlineRels.push({
            id: col.inlineRef.id,
            fromTable: table.name,
            fromColumn: col.name,
            toTable: col.inlineRef.toTable,
            toColumn: col.inlineRef.toColumn,
            operator: col.inlineRef.operator || '>',
            optional: col.inlineRef.optional,
            onDelete: col.inlineRef.onDelete,
            hasExplicitOnDelete: col.inlineRef.hasExplicitOnDelete,
            onUpdate: col.inlineRef.onUpdate
          });
        }
      }

      inlineRels.forEach(rel => {
        if (rel.id) emittedInlineRelIds.add(rel.id);
        const isOptional = rel.optional === true || (rel.operator && rel.operator.includes('?'));
        let op = rel.operator;
        if (!op) {
          if (rel.cardinality === '1:1') op = isOptional ? '-?' : '-';
          else if (rel.cardinality === 'N:M') op = isOptional ? '<>?' : '<>';
          else op = isOptional ? '>?' : '>';
        } else if (isOptional && !op.includes('?')) {
          op += '?';
        }

        settings.push(`ref: ${op} ${rel.toTable}.${rel.toColumn}`);
        if (rel.hasExplicitOnDelete && rel.onDelete) {
          settings.push(`delete: ${rel.onDelete.toLowerCase()}`);
        }
        if (rel.onUpdate) {
          settings.push(`update: ${rel.onUpdate.toLowerCase()}`);
        }
      });

      if (col.default !== undefined && col.default !== null && col.default !== '') {
        settings.push(`default: ${col.default}`);
      }

      if (col.note) {
        if (col.note.includes('\n')) {
          const cleanNoteVal = col.note.replace(/'''/g, "''\\'");
          const indented = cleanNoteVal.split('\n').map(line => `    ${line}`).join('\n');
          settings.push(`note: '''\n${indented}\n  '''`);
        } else {
          settings.push(`note: '${col.note.replace(/'/g, "\\'")}'`);
        }
      }

      const settingsStr = settings.length > 0 ? ` [${settings.join(', ')}]` : '';
      dbml += `  ${col.name} ${col.type || 'varchar'}${settingsStr}\n`;
    });

    // Indexes
    if (table.indexes && table.indexes.length > 0) {
      dbml += `\n  indexes {\n`;
      table.indexes.forEach(idx => {
        const line = typeof idx === 'string' ? idx : (idx.raw || idx.definition || (idx.columns ? (idx.columns.length > 1 ? `(${idx.columns.join(', ')})` : idx.columns[0]) : ''));
        if (line) {
          dbml += `    ${line}\n`;
        }
      });
      dbml += `  }\n`;
    }

    if (table.note) {
      dbml += `\n`;
      if (table.note.includes('\n')) {
        const cleanTableNote = table.note.replace(/'''/g, "''\\'");
        const indented = cleanTableNote.split('\n').map(line => `    ${line}`).join('\n');
        dbml += `  Note: '''\n${indented}\n  '''\n`;
      } else {
        dbml += `  Note: '${table.note.replace(/'/g, "\\'")}'\n`;
      }
    }

    dbml += `}\n\n`;
  });

  // TableGroups
  if (tableGroups && tableGroups.length > 0) {
    tableGroups.forEach(tg => {
      const colorStr = tg.color ? ` [color: ${tg.color}]` : '';
      dbml += `TableGroup ${tg.name}${colorStr} {\n`;
      (tg.tables || []).forEach(tblName => {
        dbml += `  ${tblName}\n`;
      });
      dbml += `}\n\n`;
    });
  }

  // Standalone Relationships (Ref) - only emit relationships that are NOT inline!
  const standaloneRels = (relationships || []).filter(rel => {
    if (rel.id && emittedInlineRelIds.has(rel.id)) return false;
    if (rel.isInline) return false;
    const isMatchingColInline = (tables || []).some(t =>
      t.name?.toLowerCase() === rel.fromTable?.toLowerCase() &&
      (t.columns || []).some(c =>
        c.name?.toLowerCase() === rel.fromColumn?.toLowerCase() &&
        (c.isInlineRef || (c.inlineRef && c.inlineRef.toTable?.toLowerCase() === rel.toTable?.toLowerCase()))
      )
    );
    return !isMatchingColInline;
  });

  if (standaloneRels.length > 0) {
    standaloneRels.forEach(rel => {
      const isOptional = rel.optional === true || (rel.operator && rel.operator.includes('?'));
      let cardSymbol = rel.operator;
      if (!cardSymbol) {
        if (rel.cardinality === '1:1') cardSymbol = isOptional ? '-?' : '-';
        else if (rel.cardinality === 'N:M') cardSymbol = isOptional ? '<>?' : '<>';
        else cardSymbol = isOptional ? '>?' : '>';
      } else if (isOptional && !cardSymbol.includes('?')) {
        cardSymbol += '?';
      }

      let settings = [];
      if (rel.hasExplicitOnDelete && rel.onDelete) settings.push(`delete: ${rel.onDelete.toLowerCase()}`);
      if (rel.onUpdate) settings.push(`update: ${rel.onUpdate.toLowerCase()}`);
      const settingsStr = settings.length > 0 ? ` [${settings.join(', ')}]` : '';

      dbml += `Ref: ${rel.fromTable}.${rel.fromColumn} ${cardSymbol} ${rel.toTable}.${rel.toColumn}${settingsStr}\n`;
    });
  }

  return dbml;
}

export function parseDBML(dbmlText) {
  const tables = [];
  const relationships = [];
  const enums = [];
  const tableGroups = [];
  let projectConfig = null;
  const customNotes = [];

  let currentEnum = null;
  let currentTableGroup = null;

  if (!dbmlText) return { tables, relationships, enums, tableGroups, projectConfig, customNotes, rawDbml: '' };

  const lines = dbmlText.split('\n');
  let currentTable = null;
  let tableX = 50;
  let tableY = 40;

  const headerColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];
  let colorIdx = 0;

  let inMultilineNote = false;
  let multilineNoteType = null; // 'table' | 'column'
  let multilineNoteBuffer = [];
  let currentColumnPending = null;

  let inSettingsBlock = false;
  let settingsBuffer = '';

  let inIndexesBlock = false;
  let inEnumBlock = false;
  let inTableGroupBlock = false;
  let inProjectBlock = false;
  let inRefBlock = false;
  let inBlockComment = false;
  let waitingForNoteContent = false;
  let pendingNoteType = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Handle block comments across lines /* ... */ (if not inside multiline note)
    let cleanLine = rawLine;
    if (!inMultilineNote) {
      if (inBlockComment) {
        const closeIdx = cleanLine.indexOf('*/');
        if (closeIdx === -1) {
          continue;
        }
        cleanLine = cleanLine.substring(closeIdx + 2);
        inBlockComment = false;
      }

      while (cleanLine.includes('/*')) {
        const openIdx = cleanLine.indexOf('/*');
        const closeIdx = cleanLine.indexOf('*/', openIdx + 2);
        if (closeIdx !== -1) {
          cleanLine = cleanLine.substring(0, openIdx) + ' ' + cleanLine.substring(closeIdx + 2);
        } else {
          cleanLine = cleanLine.substring(0, openIdx);
          inBlockComment = true;
          break;
        }
      }
    }

    const trimmed = cleanLine.trim();

    // Check if previous line had "note:" waiting for note opening
    if (waitingForNoteContent) {
      if (trimmed.startsWith("'''")) {
        const afterTriple = cleanLine.substring(cleanLine.indexOf("'''") + 3);
        if (afterTriple.includes("'''")) {
          const endIdx = afterTriple.indexOf("'''");
          const noteText = afterTriple.substring(0, endIdx);
          if (pendingNoteType === 'table' && currentTable) {
            currentTable.note = cleanNoteText(noteText);
          }
          waitingForNoteContent = false;
          pendingNoteType = null;
        } else {
          inMultilineNote = true;
          multilineNoteType = pendingNoteType || 'table';
          multilineNoteBuffer = afterTriple.trim().length > 0 ? [afterTriple] : [];
          waitingForNoteContent = false;
          pendingNoteType = null;
        }
        continue;
      } else if (/^['"]/.test(trimmed)) {
        const match = trimmed.match(/^['"]([^'"]*)['"]/);
        if (match && pendingNoteType === 'table' && currentTable) {
          currentTable.note = cleanNoteText(match[1]);
        }
        waitingForNoteContent = false;
        pendingNoteType = null;
        continue;
      } else {
        waitingForNoteContent = false;
        pendingNoteType = null;
      }
    }

    // 1. If inside a multi-line note block (''' ... ''')
    if (inMultilineNote) {
      if (trimmed.includes("'''")) {
        const endQuoteIdx = rawLine.indexOf("'''");
        const beforeEndQuote = rawLine.substring(0, endQuoteIdx);
        multilineNoteBuffer.push(beforeEndQuote);
        const finalNote = cleanNoteText(multilineNoteBuffer.join('\n'));

        if (multilineNoteType === 'table' && currentTable) {
          currentTable.note = finalNote;
        } else if (multilineNoteType === 'column' && currentColumnPending) {
          currentColumnPending.note = finalNote;
        }

        const afterEndQuote = rawLine.substring(endQuoteIdx + 3).trim();
        const savedNoteType = multilineNoteType;
        inMultilineNote = false;
        multilineNoteBuffer = [];
        multilineNoteType = null;

        if (inSettingsBlock) {
          if (savedNoteType === 'column' && currentColumnPending) {
            settingsBuffer += ' ' + afterEndQuote;
            if (afterEndQuote.includes(']')) {
              inSettingsBlock = false;
              parseColumnSettings(settingsBuffer, currentColumnPending, relationships, currentTable);
              currentTable.columns.push(currentColumnPending);
              currentColumnPending = null;
              settingsBuffer = '';
            }
          } else if (savedNoteType === 'table' && currentTable) {
            settingsBuffer += ' ' + afterEndQuote;
            if (afterEndQuote.includes(']')) {
              inSettingsBlock = false;
              parseTableSettings(settingsBuffer, currentTable);
              settingsBuffer = '';
            }
          }
        }
      } else {
        multilineNoteBuffer.push(rawLine);
      }
      continue;
    }

    // 2. If inside a multi-line settings block [ ... ] without note open
    if (inSettingsBlock) {
      if (currentColumnPending) {
        const noteTripleStart = trimmed.match(/note\s*:\s*'''([\s\S]*)/i);
        if (noteTripleStart) {
          const restOfLine = noteTripleStart[1];
          if (restOfLine.includes("'''")) {
            const endIdx = restOfLine.indexOf("'''");
            const noteContent = restOfLine.substring(0, endIdx);
            currentColumnPending.note = cleanNoteText(noteContent);
            const afterEnd = restOfLine.substring(endIdx + 3);
            settingsBuffer += ' ' + afterEnd;
            if (afterEnd.includes(']')) {
              inSettingsBlock = false;
              parseColumnSettings(settingsBuffer, currentColumnPending, relationships, currentTable);
              currentTable.columns.push(currentColumnPending);
              currentColumnPending = null;
              settingsBuffer = '';
            }
          } else {
            inMultilineNote = true;
            multilineNoteType = 'column';
            multilineNoteBuffer = [restOfLine];
          }
          continue;
        }

        settingsBuffer += ' ' + trimmed;
        if (trimmed.includes(']')) {
          inSettingsBlock = false;
          parseColumnSettings(settingsBuffer, currentColumnPending, relationships, currentTable);
          currentTable.columns.push(currentColumnPending);
          currentColumnPending = null;
          settingsBuffer = '';
        }
        continue;
      } else if (currentTable) {
        const noteTripleStart = trimmed.match(/note\s*:\s*'''([\s\S]*)/i);
        if (noteTripleStart) {
          const restOfLine = noteTripleStart[1];
          if (restOfLine.includes("'''")) {
            const endIdx = restOfLine.indexOf("'''");
            currentTable.note = cleanNoteText(restOfLine.substring(0, endIdx));
            const afterEnd = restOfLine.substring(endIdx + 3);
            settingsBuffer += ' ' + afterEnd;
            if (afterEnd.includes(']')) {
              inSettingsBlock = false;
              parseTableSettings(settingsBuffer, currentTable);
              settingsBuffer = '';
            }
          } else {
            inMultilineNote = true;
            multilineNoteType = 'table';
            multilineNoteBuffer = [restOfLine];
          }
          continue;
        }

        settingsBuffer += ' ' + trimmed;
        if (trimmed.includes(']')) {
          inSettingsBlock = false;
          parseTableSettings(settingsBuffer, currentTable);
          settingsBuffer = '';
        }
        continue;
      }
    }

    // Skip empty lines & comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

    // Handle root blocks
    if (/^Project\b/i.test(trimmed)) {
      if (currentTable) { tables.push(currentTable); currentTable = null; }
      const projMatch = trimmed.match(/^Project(?:\s+([a-zA-Z0-9_."]+))?\s*(?:\{)?/i);
      projectConfig = {
        name: (projMatch && projMatch[1] ? projMatch[1].replace(/["']/g, '') : '').trim(),
        databaseType: '',
        note: ''
      };
      if (trimmed.includes('{')) inProjectBlock = true;
      continue;
    }
    if (inProjectBlock) {
      if (trimmed.includes('}')) { inProjectBlock = false; continue; }
      if (projectConfig) {
        const dbTypeMatch = trimmed.match(/database_type\s*:\s*['"]?([^'"]+)['"]?/i);
        if (dbTypeMatch) projectConfig.databaseType = dbTypeMatch[1].trim();
        const noteMatch = trimmed.match(/Note\s*:\s*(?:'([^']*)'|"([^"]*)"|'''([\s\S]*?)''')/i);
        if (noteMatch) projectConfig.note = noteMatch[1] || noteMatch[2] || noteMatch[3] || '';
      }
      continue;
    }
    if (/^Enum\b/i.test(trimmed)) {
      if (currentTable) { tables.push(currentTable); currentTable = null; }
      const enumMatch = trimmed.match(/^Enum\s+([a-zA-Z0-9_."]+)\s*(?:\{)?/i);
      const enumName = enumMatch && enumMatch[1] ? enumMatch[1].replace(/["']/g, '') : trimmed.replace(/^Enum\s+/i, '').replace(/\{$/, '').trim();
      currentEnum = {
        name: enumName,
        values: []
      };
      enums.push(currentEnum);
      if (trimmed.includes('{')) inEnumBlock = true;
      continue;
    }
    if (inEnumBlock) {
      if (trimmed.includes('}')) {
        inEnumBlock = false;
        currentEnum = null;
        continue;
      }
      if (currentEnum && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
        const valBracketIdx = trimmed.indexOf('[');
        if (valBracketIdx !== -1 && trimmed.endsWith(']')) {
          const valName = trimmed.substring(0, valBracketIdx).trim().replace(/^["']|["']$/g, '');
          const bracketPart = trimmed.substring(valBracketIdx);
          const noteText = parseNoteFromSettings(bracketPart) || '';
          currentEnum.values.push({ name: valName, note: noteText, raw: trimmed });
        } else {
          const valName = trimmed.replace(/^["']|["']$/g, '');
          currentEnum.values.push({ name: valName, note: '', raw: trimmed });
        }
      }
      continue;
    }
    if (/^TableGroup\b/i.test(trimmed)) {
      if (currentTable) { tables.push(currentTable); currentTable = null; }
      const tgMatch = trimmed.match(/^TableGroup\s+([a-zA-Z0-9_."]+)(?:\s*\[([\s\S]*?)\])?\s*(?:\{)?/i);
      const tgName = tgMatch && tgMatch[1] ? tgMatch[1].replace(/["']/g, '') : 'group';
      let color = null;
      if (tgMatch && tgMatch[2]) {
        const colorMatch = tgMatch[2].match(/color\s*:\s*([#a-zA-Z0-9_]+)/i);
        if (colorMatch) color = colorMatch[1];
      }
      currentTableGroup = {
        name: tgName,
        color: color || '#3b82f6',
        tables: []
      };
      tableGroups.push(currentTableGroup);
      if (trimmed.includes('{')) inTableGroupBlock = true;
      continue;
    }
    if (inTableGroupBlock) {
      if (trimmed.includes('}')) {
        inTableGroupBlock = false;
        currentTableGroup = null;
        continue;
      }
      if (currentTableGroup && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
        const cleanTbl = trimmed.replace(/["',]/g, '').trim();
        if (cleanTbl) currentTableGroup.tables.push(cleanTbl);
      }
      continue;
    }

    // Match Table definition (e.g. Table api_tokens [note: '''] or Table users as U { )
    const tableMatch = trimmed.match(/^Table\s+(?:([a-zA-Z0-9_"`']+)\.)?([a-zA-Z0-9_"`']+)(?:\s+as\s+([a-zA-Z0-9_"`']+))?(?:\s*\[([\s\S]*))?/i);
    if (tableMatch) {
      if (currentTable) {
        tables.push(currentTable);
        currentTable = null;
      }
      inIndexesBlock = false;
      inSettingsBlock = false;
      settingsBuffer = '';
      waitingForNoteContent = false;
      pendingNoteType = null;

      const rawTableName = tableMatch[2] || tableMatch[1];
      const tableName = [tableMatch[1], rawTableName].filter(Boolean)
        .map(part => part.replace(/^["'`]|["'`]$/g, '')).join('.');
      const alias = tableMatch[3] ? tableMatch[3].replace(/^["'`]|["'`]$/g, '') : null;
      currentTable = {
        id: 'tbl-' + tableName.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        name: tableName,
        alias: alias,
        headerColor: headerColors[colorIdx % headerColors.length],
        x: tableX,
        y: tableY,
        note: '',
        columns: [],
        indexes: []
      };
      colorIdx++;
      tableX += 368;
      if (tableX > 1150) {
        tableX = 50;
        tableY += 300;
      }

      const settingsPart = tableMatch[4];
      if (settingsPart !== undefined) {
        if (settingsPart.includes("note:") && settingsPart.includes("'''")) {
          const afterTriple = settingsPart.substring(settingsPart.indexOf("'''") + 3);
          if (afterTriple.includes("'''")) {
            const endIdx = afterTriple.indexOf("'''");
            currentTable.note = cleanNoteText(afterTriple.substring(0, endIdx));
            const afterEnd = afterTriple.substring(endIdx + 3);
            if (afterEnd.includes(']')) {
              parseTableSettings(afterEnd, currentTable);
            } else {
              inSettingsBlock = true;
              settingsBuffer = afterEnd;
            }
          } else {
            inMultilineNote = true;
            multilineNoteType = 'table';
            inSettingsBlock = true;
            multilineNoteBuffer = [];
            if (afterTriple.trim().length > 0) {
              multilineNoteBuffer.push(afterTriple);
            }
            const beforeNote = settingsPart.substring(0, settingsPart.indexOf("note:"));
            if (beforeNote.trim().length > 0) {
              parseTableSettings(beforeNote, currentTable);
            }
          }
        } else if (settingsPart.includes("'''")) {
          const afterTriple = settingsPart.substring(settingsPart.indexOf("'''") + 3);
          if (afterTriple.includes("'''")) {
            const endIdx = afterTriple.indexOf("'''");
            currentTable.note = cleanNoteText(afterTriple.substring(0, endIdx));
            const afterEnd = afterTriple.substring(endIdx + 3);
            if (afterEnd.includes(']')) {
              parseTableSettings(afterEnd, currentTable);
            } else {
              inSettingsBlock = true;
              settingsBuffer = afterEnd;
            }
          } else {
            inMultilineNote = true;
            multilineNoteType = 'table';
            inSettingsBlock = true;
            multilineNoteBuffer = [];
            if (afterTriple.trim().length > 0) {
              multilineNoteBuffer.push(afterTriple);
            }
          }
        } else if (settingsPart.includes(']')) {
          const bracketContent = settingsPart.substring(0, settingsPart.indexOf(']'));
          parseTableSettings(bracketContent, currentTable);
        } else {
          inSettingsBlock = true;
          settingsBuffer = settingsPart;
        }
      }
      continue;
    }

    // Inside Table definition - handle indexes block before checking table close brace
    if (currentTable) {
      if (/^indexes\s*\{/i.test(trimmed)) {
        currentTable.indexes = currentTable.indexes || [];
        if (!trimmed.includes('}') || trimmed.indexOf('}') <= trimmed.indexOf('{')) {
          inIndexesBlock = true;
        }
        continue;
      }
      if (inIndexesBlock) {
        if (trimmed.includes('}')) {
          inIndexesBlock = false;
          continue;
        }
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
          currentTable.indexes = currentTable.indexes || [];
          currentTable.indexes.push(trimmed);
        }
        continue;
      }
    }

    if (trimmed === '}' && currentTable) {
      tables.push(currentTable);
      currentTable = null;
      inIndexesBlock = false;
      inSettingsBlock = false;
      settingsBuffer = '';
      waitingForNoteContent = false;
      pendingNoteType = null;
      continue;
    }

    if (trimmed === '{' && currentTable) {
      continue;
    }

    // Inside Table definition
    if (currentTable) {
      // Allow inline or nested Ref statements inside table definition if written by user
      if (/^Ref\b/i.test(trimmed)) {
        const parsedRel = parseRefLine(trimmed);
        if (parsedRel) {
          relationships.push(parsedRel);
          continue;
        }
      }

      // Table Note: Note: '''...''' or Note: '...' or Note { ... } or Note: alone on line
      if (/^Note\s*:?\s*'''/i.test(trimmed)) {
        const afterTriple = trimmed.replace(/^Note\s*:?\s*'''/i, '');
        if (afterTriple.includes("'''")) {
          const content = afterTriple.substring(0, afterTriple.indexOf("'''"));
          currentTable.note = cleanNoteText(content);
        } else {
          inMultilineNote = true;
          multilineNoteType = 'table';
          multilineNoteBuffer = afterTriple.trim().length > 0 ? [afterTriple] : [];
        }
        continue;
      }

      if (/^Note\s*:?\s*$/i.test(trimmed)) {
        waitingForNoteContent = true;
        pendingNoteType = 'table';
        continue;
      }

      if (/^Note\s*\{/i.test(trimmed)) {
        inMultilineNote = true;
        multilineNoteType = 'table';
        multilineNoteBuffer = [];
        continue;
      }

      const singleTableNote = trimmed.match(/^Note\s*:?\s*(?:'((?:\\.|''|[^'\\])*)'|"((?:\\.|""|[^"\\])*)")/i);
      if (singleTableNote) {
        const rawContent = singleTableNote[1] !== undefined
          ? singleTableNote[1].replace(/\\'/g, "'").replace(/''/g, "'")
          : (singleTableNote[2] || '').replace(/\\"/g, '"').replace(/""/g, '"');
        currentTable.note = cleanNoteText(rawContent);
        continue;
      }

      // Skip SQL table-level constraints if pasted or present
      if (/^(?:CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|CHECK)\b/i.test(trimmed)) {
        continue;
      }

      // Column Definition: colName colType [settings]
      const colDef = parseColumnDefinition(trimmed);
      if (colDef) {
        const colName = colDef.colName;
        if (colName.toUpperCase() === 'CONSTRAINT') {
          continue;
        }
        let colType = colDef.colType || 'varchar';
        const bracketRest = colDef.bracketContent !== undefined ? colDef.bracketContent.trim() : null;

        const colObj = {
          name: colName,
          type: colType,
          isPk: false,
          isFk: false,
          isNull: true,
          isUnique: false,
          note: ''
        };

        if (bracketRest !== null) {
          const noteTripleStart = bracketRest.match(/note\s*:\s*'''([\s\S]*)/i);
          if (noteTripleStart) {
            const afterStart = noteTripleStart[1];
            if (afterStart.includes("'''")) {
              const endQuoteIdx = afterStart.indexOf("'''");
              colObj.note = cleanNoteText(afterStart.substring(0, endQuoteIdx));
              const afterEnd = afterStart.substring(endQuoteIdx + 3);
              if (afterEnd.includes(']')) {
                const preSettings = bracketRest.substring(0, bracketRest.toLowerCase().indexOf('note:'));
                parseColumnSettings(preSettings + ' ' + afterEnd, colObj, relationships, currentTable);
                currentTable.columns.push(colObj);
                continue;
              } else {
                inSettingsBlock = true;
                settingsBuffer = bracketRest.substring(0, bracketRest.toLowerCase().indexOf('note:')) + ' ' + afterEnd;
                currentColumnPending = colObj;
                continue;
              }
            } else {
              inMultilineNote = true;
              multilineNoteType = 'column';
              multilineNoteBuffer = [afterStart];
              inSettingsBlock = true;
              settingsBuffer = bracketRest.substring(0, bracketRest.toLowerCase().indexOf('note:'));
              currentColumnPending = colObj;
              continue;
            }
          }

          if (hasClosingBracketOutsideStrings(bracketRest)) {
            parseColumnSettings(bracketRest, colObj, relationships, currentTable);
            currentTable.columns.push(colObj);
          } else {
            inSettingsBlock = true;
            settingsBuffer = bracketRest;
            currentColumnPending = colObj;
          }
        } else {
          currentTable.columns.push(colObj);
        }
        continue;
      }
    }

    // Match Ref block opening: Ref [name] {
    if (/^Ref(?:\s+[a-zA-Z0-9_]+)?\s*\{/i.test(trimmed)) {
      inRefBlock = true;
      continue;
    }

    if (inRefBlock) {
      if (trimmed === '}') {
        inRefBlock = false;
        continue;
      }
      const parsedRel = parseRefLine(trimmed);
      if (parsedRel) {
        relationships.push(parsedRel);
      }
      continue;
    }

    // Match Ref statement: Ref: table1.col1 > table2.col2 or Ref: table1.col1 >? table2.col2
    if (/^Ref\b/i.test(trimmed)) {
      const parsedRel = parseRefLine(trimmed);
      if (parsedRel) {
        relationships.push(parsedRel);
        continue;
      }
    }

    // Match standalone relationship line without Ref keyword at root level
    if (!currentTable && /[\-<>?]/.test(trimmed)) {
      const parsedRel = parseRefLine(trimmed);
      if (parsedRel) {
        relationships.push(parsedRel);
        continue;
      }
    }
  }

  function parseColumnSettings(settingsStr, col, relsList, table) {
    if (!settingsStr) return;
    if (/primary key|\bpk\b/i.test(settingsStr)) {
      col.isPk = true;
      col.pk = true;
      col.isNull = false;
      col.notNull = true;
    }
    if (/\bincrement\b/i.test(settingsStr)) {
      col.increment = true;
    }
    if (/\bunique\b/i.test(settingsStr)) {
      col.isUnique = true;
    }
    if (/not null/i.test(settingsStr)) {
      col.isNull = false;
    } else if (/\bnull\b/i.test(settingsStr)) {
      col.isNull = true;
    }

    const defaultMatch = settingsStr.match(/default\s*:\s*(`[^`]+`|'[^']+'|"[^"]+"|[a-zA-Z0-9_.-]+)/i);
    if (defaultMatch) {
      col.default = defaultMatch[1];
    }

    if (!col.note) {
      const extractedNote = parseNoteFromSettings(settingsStr);
      if (extractedNote !== null) {
        col.note = extractedNote;
      }
    }

    // Inline ref: [ref: > table.col] or [ref: >? table.col] or [ref: ?> table.col]
    const inlineRef = settingsStr.match(/ref\s*:\s*([\-<>?]+|\b(?:>|<|-|<>)\s*\?)\s*([^\],]+)/i);
    if (inlineRef && table) {
      const rawSymbol = inlineRef[1].replace(/\s+/g, '');
      const targetParts = splitTableAndColumn(inlineRef[2].trim());
      const targetTable = targetParts.table;
      const targetCol = targetParts.column;

      if (targetTable && targetCol) {
        const isOptional = rawSymbol.includes('?');
        let operator = '>';
        let cardinality = 'N:1';
        if (rawSymbol.includes('<>')) {
          operator = isOptional ? '<>?' : '<>';
          cardinality = 'N:M';
        } else if (rawSymbol.includes('-')) {
          operator = isOptional ? '-?' : '-';
          cardinality = '1:1';
        } else {
          operator = isOptional ? '>?' : '>';
          cardinality = 'N:1';
        }

        let onDelete = null;
        const delMatch = settingsStr.match(/(?:delete|on\s+delete)\s*:\s*([a-zA-Z_]+(?:\s+[a-zA-Z_]+)?)/i);
        if (delMatch) {
          onDelete = delMatch[1].toUpperCase().trim();
        }

        let onUpdate = null;
        const updateMatch = settingsStr.match(/(?:update|on\s+update)\s*:\s*([a-zA-Z_]+(?:\s+[a-zA-Z_]+)?)/i);
        if (updateMatch) {
          onUpdate = updateMatch[1].toUpperCase().trim();
        }

        const relId = 'rel-' + Math.random().toString(36).substring(2, 9);
        relsList.push({
          id: relId,
          fromTable: table.name,
          fromColumn: col.name,
          toTable: targetTable,
          toColumn: targetCol,
          cardinality,
          operator,
          optional: isOptional,
          onDelete: onDelete || 'CASCADE',
          hasExplicitOnDelete: Boolean(onDelete),
          onUpdate: onUpdate || null,
          isInline: true
        });
        col.isFk = true;
        col.fk = true;
        col.isInlineRef = true;
        col.inlineRef = {
          id: relId,
          operator,
          toTable: targetTable,
          toColumn: targetCol,
          optional: isOptional,
          onDelete: onDelete || null,
          hasExplicitOnDelete: Boolean(onDelete),
          onUpdate: onUpdate || null
        };
        // In DBML, >? or ?> marks foreign key as nullable unless explicitly specified as 'not null'
        if (isOptional && !/not null/i.test(settingsStr)) {
          col.isNull = true;
        }
      }
    }
  }

  function parseTableSettings(settingsStr, table) {
    if (!settingsStr || !table) return;
    const colorMatch = settingsStr.match(/(?:headercolor|header_color|color)\s*:\s*['"]?(#[a-fA-F0-9]{3,8}|[a-zA-Z]+)['"]?/i);
    if (colorMatch) {
      table.headerColor = colorMatch[1];
      table.hasExplicitHeaderColor = true;
    }
    if (!table.note) {
      const extractedNote = parseNoteFromSettings(settingsStr);
      if (extractedNote !== null) {
        table.note = extractedNote;
        return;
      }
      const directTriple = settingsStr.match(/'''([\s\S]*?)'''/);
      if (directTriple) {
        table.note = cleanNoteText(directTriple[1]);
      }
    }
  }

  // Push trailing table if still active (e.g. table declared without braces)
  if (currentTable) {
    tables.push(currentTable);
    currentTable = null;
  }

  // Mark FK flags on columns
  relationships.forEach(rel => {
    const tbl = tables.find(t =>
      t.name.toLowerCase() === rel.fromTable.toLowerCase() ||
      (t.schema && `${t.schema}.${t.name}`.toLowerCase() === rel.fromTable.toLowerCase()) ||
      rel.fromTable.toLowerCase().endsWith('.' + t.name.toLowerCase())
    );
    if (tbl && tbl.columns) {
      const col = tbl.columns.find(c =>
        c.name.toLowerCase().replace(/["'`]/g, '') === rel.fromColumn.toLowerCase().replace(/["'`]/g, '')
      );
      if (col) {
        col.isFk = true;
        col.fk = true;
      }
    }
  });

  return {
    tables,
    relationships,
    enums,
    tableGroups,
    projectConfig,
    customNotes,
    rawDbml: dbmlText
  };
}

function stripStringsForBraceCount(str) {
  if (!str) return '';
  // 1. Triple-quoted strings: '''...'''
  let s = str.replace(/'''[\s\S]*?'''/g, '""');
  // 2. Single-quoted strings: '...' handling escaped single quotes \' or ''
  s = s.replace(/'(?:\\.|''|[^'\\])*'/g, '""');
  // 3. Double-quoted strings: "..." handling escaped \" or ""
  s = s.replace(/"(?:\\.|""|[^"\\])*"/g, '""');
  // 4. Backticks: `...`
  s = s.replace(/`[^`]*`/g, '""');
  return s;
}

/**
 * DBML Sentence and Line Validator
 */
export function validateDBML(dbmlText) {
  const diagnostics = [];
  if (!dbmlText) return { isValid: true, diagnostics: [] };

  const lines = dbmlText.split('\n');
  let openBraces = 0;
  let inTableBlock = false;
  let inTripleQuoteNote = false;
  let inSettingsBracket = false;
  let inNoteBrace = false;
  let inIndexesBlock = false;
  let inEnumBlock = false;
  let inProjectBlock = false;
  let inTableGroupBlock = false;
  let inRefBlock = false;
  let inBlockComment = false;
  let valWaitingForNote = false;
  let pendingBlock = null;

  let currentTableName = '';
  const declaredTables = new Set();
  const declaredColumnsMap = new Map();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    // Handle block comments across lines /* ... */ (if not inside triple-quote note)
    let cleanLine = line;
    if (!inTripleQuoteNote && !inNoteBrace) {
      if (inBlockComment) {
        const closeIdx = cleanLine.indexOf('*/');
        if (closeIdx === -1) {
          // Entire line is inside comment
          continue;
        }
        cleanLine = cleanLine.substring(closeIdx + 2);
        inBlockComment = false;
      }

      while (cleanLine.includes('/*')) {
        const openIdx = cleanLine.indexOf('/*');
        const closeIdx = cleanLine.indexOf('*/', openIdx + 2);
        if (closeIdx !== -1) {
          cleanLine = cleanLine.substring(0, openIdx) + ' ' + cleanLine.substring(closeIdx + 2);
        } else {
          cleanLine = cleanLine.substring(0, openIdx);
          inBlockComment = true;
          break;
        }
      }

      // Strip single-line comments // and # safely (without breaking hex colors e.g. #3b82f6 or URLs in notes)
      if (cleanLine.trim().startsWith('//') || cleanLine.trim().startsWith('#')) {
        continue;
      }
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let inBacktick = false;
      let bracketDepth = 0;
      for (let ci = 0; ci < cleanLine.length; ci++) {
        const ch = cleanLine[ci];
        const prev = ci > 0 ? cleanLine[ci - 1] : '';
        if (ch === "'" && !inDoubleQuote && !inBacktick && prev !== '\\') {
          inSingleQuote = !inSingleQuote;
        } else if (ch === '"' && !inSingleQuote && !inBacktick && prev !== '\\') {
          inDoubleQuote = !inDoubleQuote;
        } else if (ch === '`' && !inSingleQuote && !inDoubleQuote && prev !== '\\') {
          inBacktick = !inBacktick;
        } else if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
          if (ch === '[') bracketDepth++;
          else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
          else if (ch === '/' && cleanLine[ci + 1] === '/' && bracketDepth === 0) {
            cleanLine = cleanLine.substring(0, ci);
            break;
          }
        }
      }
    }

    const trimmed = cleanLine.trim();

    if (!trimmed) {
      continue;
    }

    // If previous line was "note:" waiting for note opening quotes or string
    if (valWaitingForNote) {
      if (trimmed.startsWith("'''")) {
        const secondIdx = trimmed.indexOf("'''", 3);
        if (secondIdx !== -1) {
          valWaitingForNote = false;
        } else {
          inTripleQuoteNote = true;
          valWaitingForNote = false;
        }
        continue;
      } else if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
        valWaitingForNote = false;
        continue;
      } else {
        valWaitingForNote = false;
      }
    }

    // 1. If currently inside a triple-quote string/note block
    if (inTripleQuoteNote) {
      if (trimmed.includes("'''")) {
        inTripleQuoteNote = false;
        const afterQuote = trimmed.substring(trimmed.indexOf("'''") + 3);
        if (inSettingsBracket && afterQuote.includes(']')) {
          inSettingsBracket = false;
        }
        const cleanAfterQuote = stripStringsForBraceCount(afterQuote);
        for (const char of cleanAfterQuote) {
          if (char === '{') openBraces++;
          if (char === '}') openBraces--;
        }
        if (afterQuote.includes('{')) {
          inTableBlock = true;
        }
      }
      continue;
    }

    // 2. If inside Note { ... } block
    if (inNoteBrace) {
      if (trimmed === '}' || trimmed.endsWith('}')) {
        inNoteBrace = false;
        openBraces--;
      }
      continue;
    }

    // 3. Track brace count (ignoring braces inside string literals)
    const lineWithoutStrings = stripStringsForBraceCount(trimmed);
    for (const char of lineWithoutStrings) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
    }

    if (openBraces < 0) {
      diagnostics.push({
        line: lineNum,
        text: trimmed,
        message: 'Unexpected closing brace "}" without opening block',
        severity: 'error'
      });
      openBraces = 0;
    }

    if (openBraces === 0 && !inSettingsBracket && !inTripleQuoteNote && !pendingBlock) {
      inTableBlock = false;
      currentTableName = '';
      inIndexesBlock = false;
      inEnumBlock = false;
      inProjectBlock = false;
      inTableGroupBlock = false;
      inRefBlock = false;
      inNoteBrace = false;
      valWaitingForNote = false;
    }

    // Check if inside indexes block
    if (inIndexesBlock) {
      if (trimmed.includes('}')) inIndexesBlock = false;
      continue;
    }
    if (inEnumBlock) {
      if (trimmed.includes('}')) inEnumBlock = false;
      continue;
    }
    if (inProjectBlock) {
      if (trimmed.includes('}')) inProjectBlock = false;
      continue;
    }
    if (inTableGroupBlock) {
      if (trimmed.includes('}')) inTableGroupBlock = false;
      continue;
    }

    // Root level blocks: Project, Enum, TableGroup
    if (/^Project\b/i.test(trimmed)) {
      if (trimmed.includes('{')) inProjectBlock = true;
      else pendingBlock = 'Project';
      continue;
    }
    if (/^Enum\b/i.test(trimmed)) {
      if (trimmed.includes('{')) inEnumBlock = true;
      else pendingBlock = 'Enum';
      continue;
    }
    if (/^TableGroup\b/i.test(trimmed)) {
      if (trimmed.includes('{')) inTableGroupBlock = true;
      else pendingBlock = 'TableGroup';
      if (trimmed.includes('[') && !trimmed.includes(']')) inSettingsBracket = true;
      continue;
    }

    if (pendingBlock && trimmed.includes('{')) {
      if (pendingBlock === 'Enum') inEnumBlock = true;
      else if (pendingBlock === 'TableGroup') inTableGroupBlock = true;
      else if (pendingBlock === 'Project') inProjectBlock = true;
      else if (pendingBlock === 'Table') inTableBlock = true;
      pendingBlock = null;
      continue;
    }

    // If inside an open [ ... ] bracket across multiple lines (e.g. column settings)
    if (inSettingsBracket) {
      if (trimmed.includes("note:") && trimmed.includes("'''")) {
        const afterTriple = trimmed.substring(trimmed.indexOf("'''") + 3);
        if (!afterTriple.includes("'''")) {
          inTripleQuoteNote = true;
        } else {
          const afterEnd = afterTriple.substring(afterTriple.indexOf("'''") + 3);
          if (afterEnd.includes(']')) {
            inSettingsBracket = false;
            if (afterEnd.includes('{')) {
              inTableBlock = true;
              pendingBlock = null;
            }
          }
        }
      } else if (trimmed.includes("'''")) {
        const afterTriple = trimmed.substring(trimmed.indexOf("'''") + 3);
        if (!afterTriple.includes("'''")) {
          inTripleQuoteNote = true;
        }
      } else if (trimmed.includes(']')) {
        inSettingsBracket = false;
        if (trimmed.includes('{')) {
          inTableBlock = true;
          pendingBlock = null;
        }
      }
      continue;
    }

    // Match Table header (e.g. Table api_tokens [note: '''] or Table users { )
    if (/^Table\b/i.test(trimmed)) {
      const match = trimmed.match(/^Table\s+(?:([a-zA-Z0-9_"`']+)\.)?([a-zA-Z0-9_"`']+)(?:\s+as\s+[a-zA-Z0-9_"`']+)?(?:\s*\[([\s\S]*))?/i);
      if (!match || (!match[2] && !match[1])) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Syntax error in Table declaration. Correct format: Table <table_name> [...] {',
          severity: 'error'
        });
      } else {
        const rawName = match[2] || match[1];
        const tableName = [match[1], rawName].filter(Boolean)
          .map(part => part.replace(/^["'`]|["'`]$/g, '')).join('.');
        if (declaredTables.has(tableName.toLowerCase())) {
          diagnostics.push({
            line: lineNum,
            text: trimmed,
            message: `Duplicate table definition "${tableName}"`,
            severity: 'warning'
          });
        }
        declaredTables.add(tableName.toLowerCase());
        currentTableName = tableName;
        declaredColumnsMap.set(tableName.toLowerCase(), new Set());
        if (trimmed.includes('{')) {
          inTableBlock = true;
        } else {
          pendingBlock = 'Table';
        }

        const settingsPart = match[3];
        if (settingsPart !== undefined) {
          if (settingsPart.includes("note:") && settingsPart.includes("'''")) {
            const afterTriple = settingsPart.substring(settingsPart.indexOf("'''") + 3);
            if (!afterTriple.includes("'''")) {
              inTripleQuoteNote = true;
              inSettingsBracket = true;
            } else {
              const afterEnd = afterTriple.substring(afterTriple.indexOf("'''") + 3);
              if (!afterEnd.includes(']')) {
                inSettingsBracket = true;
              }
            }
          } else if (settingsPart.includes("'''")) {
            const afterTriple = settingsPart.substring(settingsPart.indexOf("'''") + 3);
            if (!afterTriple.includes("'''")) {
              inTripleQuoteNote = true;
              inSettingsBracket = true;
            } else {
              const afterEnd = afterTriple.substring(afterTriple.indexOf("'''") + 3);
              if (!afterEnd.includes(']')) {
                inSettingsBracket = true;
              }
            }
          } else if (!settingsPart.includes(']')) {
            inSettingsBracket = true;
          }
        }
      }
      continue;
    }

    if (trimmed === '}') {
      if (openBraces === 0) {
        inTableBlock = false;
        currentTableName = '';
        inIndexesBlock = false;
        valWaitingForNote = false;
      }
      continue;
    }

    if (trimmed === '{') {
      continue;
    }

    // Match Ref block opening: Ref [name] {
    if (/^Ref(?:\s+[a-zA-Z0-9_]+)?\s*\{/i.test(trimmed)) {
      inRefBlock = true;
      continue;
    }

    if (inRefBlock) {
      if (trimmed === '}') {
        inRefBlock = false;
        continue;
      }
      const parsedRel = parseRefLine(trimmed);
      if (!parsedRel) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Syntax error in Ref block item. Correct format: table1.col1 > table2.col2 or table1.col1 >? table2.col2',
          severity: 'error'
        });
      }
      continue;
    }

    // Match Ref statement
    if (/^Ref\b/i.test(trimmed)) {
      const parsedRel = parseRefLine(trimmed);
      if (!parsedRel) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Syntax error in Ref relationship sentence. Correct format: Ref: table1.col1 > table2.col2 or Ref: table1.col1 >? table2.col2',
          severity: 'error'
        });
      }
      continue;
    }

    // Inside Table block - column or table-level element validation
    if (inTableBlock && openBraces > 0) {
      // 1. Check for Table Note statements
      if (/^Note\b/i.test(trimmed) || /^note\s*:/i.test(trimmed)) {
        if (/^Note\s*:?\s*'''/i.test(trimmed) || /^note\s*:\s*'''/i.test(trimmed)) {
          const afterTriple = trimmed.replace(/^Note\s*:?\s*'''/i, '').replace(/^note\s*:\s*'''/i, '');
          if (!afterTriple.includes("'''")) {
            inTripleQuoteNote = true;
          }
        } else if (/^Note\s*\{/i.test(trimmed)) {
          inNoteBrace = true;
        } else if (/^Note\s*:?\s*['"]/i.test(trimmed) || /^note\s*:\s*['"]/i.test(trimmed)) {
          // single-line note with quotes: Note: '...'
        } else if (/^Note\s*:?\s*$/i.test(trimmed)) {
          valWaitingForNote = true;
        }
        continue;
      }

      // 2. Check for indexes block inside table
      if (/^indexes\s*\{/i.test(trimmed)) {
        if (!trimmed.includes('}') || trimmed.indexOf('}') <= trimmed.indexOf('{')) {
          inIndexesBlock = true;
        }
        continue;
      }

      // 3. Check for accidental SQL table constraint inside DBML Table block
      if (/^CONSTRAINT\b/i.test(trimmed)) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Table constraint keyword "CONSTRAINT" is not used in DBML. Primary keys and unique constraints are defined inline (e.g. "id integer [pk, unique]") or in an "indexes { }" block.',
          severity: 'warning'
        });
        continue;
      }

      // 4. Column line validation
      const colDef = parseColumnDefinition(trimmed);
      if (!colDef || !colDef.colName) {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Invalid column sentence syntax in Table block',
          severity: 'error'
        });
      } else {
        const { colName, colType, bracketContent } = colDef;

        if (!colType && bracketContent === undefined) {
          diagnostics.push({
            line: lineNum,
            text: trimmed,
            message: `Missing column data type for "${colName}" (e.g. integer, varchar, timestamptz)`,
            severity: 'warning'
          });
        }

        if (currentTableName) {
          const colSet = declaredColumnsMap.get(currentTableName.toLowerCase());
          if (colSet) {
            if (colSet.has(colName.toLowerCase())) {
              diagnostics.push({
                line: lineNum,
                text: trimmed,
                message: `Duplicate column name "${colName}" in table "${currentTableName}"`,
                severity: 'warning'
              });
            }
            colSet.add(colName.toLowerCase());
          }
        }

        if (bracketContent !== undefined) {
          const inlineRefCheck = bracketContent.match(/ref\s*:\s*([\-<>?]+)/i);
          if (inlineRefCheck) {
            const op = inlineRefCheck[1];
            if (!isValidRelOperator(op)) {
              diagnostics.push({
                line: lineNum,
                text: trimmed,
                message: `Invalid inline relationship operator "${op}". Allowed: >, <, -, <>, or optional variants (>?, ?>, <?, ?<, -?, ?-, <>?, ?<>).`,
                severity: 'warning'
              });
            }
          }

          if (bracketContent.includes("note:") && bracketContent.includes("'''")) {
            const afterTriple = bracketContent.substring(bracketContent.indexOf("'''") + 3);
            if (!afterTriple.includes("'''")) {
              inTripleQuoteNote = true;
              inSettingsBracket = true;
            } else {
              const afterEnd = afterTriple.substring(afterTriple.indexOf("'''") + 3);
              if (!afterEnd.includes(']')) {
                inSettingsBracket = true;
              }
            }
          } else if (!bracketContent.includes(']')) {
            inSettingsBracket = true;
          }
        }
      }
      continue;
    }

    // Unexpected line format
    if (!inTableBlock && !inRefBlock && !inEnumBlock && !inProjectBlock && !inTableGroupBlock && !inNoteBrace && !/^Project\b|^Enum\b|^TableGroup\b|^Ref\b|^Note\b/i.test(trimmed)) {
      if (trimmed !== '{' && trimmed !== '}') {
        diagnostics.push({
          line: lineNum,
          text: trimmed,
          message: 'Unrecognized line syntax outside table block',
          severity: 'warning'
        });
      }
    }
  }

  if (openBraces > 0) {
    diagnostics.push({
      line: lines.length,
      text: '',
      message: `Unclosed table block - missing ${openBraces} closing brace "}"`,
      severity: 'error'
    });
  }

  if (inTripleQuoteNote) {
    diagnostics.push({
      line: lines.length,
      text: '',
      message: 'Unclosed multiline note - missing closing triple quotes "\'\'\'"',
      severity: 'error'
    });
  }

  return {
    isValid: diagnostics.filter(d => d.severity === 'error').length === 0,
    diagnostics
  };
}

export function exportToSQL(tables, relationships, dialect = 'postgres') {
  let sql = `-- Generated SQL Script for ${dialect.toUpperCase()}\n`;
  sql += `-- Exported on ${new Date().toISOString()}\n\n`;

  if (dialect === 'postgres') {
    tables.forEach(table => {
      sql += `CREATE TABLE "${table.name}" (\n`;
      const colLines = table.columns.map(col => {
        let line = `  "${col.name}" ${col.type.toUpperCase()}`;
        const isPk = Boolean(col.isPk || col.pk);
        if (isPk) line += ` PRIMARY KEY`;
        if ((col.isNull === false || col.notNull === true) && !isPk) line += ` NOT NULL`;
        if ((col.isUnique || col.unique) && !isPk) line += ` UNIQUE`;
        return line;
      });
      sql += colLines.join(',\n');
      sql += `\n);\n\n`;

      if (table.note) {
        const cleanTNote = table.note.replace(/'/g, "''");
        sql += `COMMENT ON TABLE "${table.name}" IS '${cleanTNote}';\n`;
      }
      table.columns.forEach(col => {
        if (col.note) {
          const cleanCNote = col.note.replace(/'/g, "''");
          sql += `COMMENT ON COLUMN "${table.name}"."${col.name}" IS '${cleanCNote}';\n`;
        }
      });
      if (table.note || table.columns.some(c => c.note)) {
        sql += `\n`;
      }
    });

    // Foreign Keys
    relationships.forEach(rel => {
      const fromTbl = (rel.fromTable || '').replace(/["'`]/g, '');
      const fromCol = (rel.fromColumn || '').replace(/["'`]/g, '');
      const toTbl = (rel.toTable || '').replace(/["'`]/g, '');
      const toCol = (rel.toColumn || '').replace(/["'`]/g, '');
      if (fromTbl && fromCol && toTbl && toCol) {
        sql += `ALTER TABLE "${fromTbl}" ADD CONSTRAINT "fk_${fromTbl}_${fromCol}" `;
        sql += `FOREIGN KEY ("${fromCol}") REFERENCES "${toTbl}" ("${toCol}") `;
        sql += `ON DELETE ${rel.onDelete || 'CASCADE'};\n\n`;
      }
    });
  } else if (dialect === 'mysql') {
    tables.forEach(table => {
      sql += `CREATE TABLE \`${table.name}\` (\n`;
      const colLines = table.columns.map(col => {
        let line = `  \`${col.name}\` ${col.type.toUpperCase()}`;
        const isPk = Boolean(col.isPk || col.pk);
        if (isPk) line += ` PRIMARY KEY`;
        if ((col.isNull === false || col.notNull === true) && !isPk) line += ` NOT NULL`;
        if ((col.isUnique || col.unique) && !isPk) line += ` UNIQUE`;
        if (col.note) {
          const cleanCNote = col.note.replace(/'/g, "''").replace(/\n/g, ' ');
          line += ` COMMENT '${cleanCNote}'`;
        }
        return line;
      });
      
      relationships.filter(r => (r.fromTable || '').toLowerCase().replace(/["'`]/g, '') === table.name.toLowerCase().replace(/["'`]/g, '')).forEach(rel => {
        const fromTbl = (rel.fromTable || '').replace(/["'`]/g, '');
        const fromCol = (rel.fromColumn || '').replace(/["'`]/g, '');
        const toTbl = (rel.toTable || '').replace(/["'`]/g, '');
        const toCol = (rel.toColumn || '').replace(/["'`]/g, '');
        if (fromTbl && fromCol && toTbl && toCol) {
          colLines.push(`  CONSTRAINT \`fk_${fromTbl}_${fromCol}\` FOREIGN KEY (\`${fromCol}\`) REFERENCES \`${toTbl}\` (\`${toCol}\`) ON DELETE ${rel.onDelete || 'CASCADE'}`);
        }
      });

      sql += colLines.join(',\n');
      let tableComment = '';
      if (table.note) {
        const cleanTNote = table.note.replace(/'/g, "''").replace(/\n/g, ' ');
        tableComment = ` COMMENT='${cleanTNote}'`;
      }
      sql += `\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4${tableComment};\n\n`;
    });
  } else if (dialect === 'sqlite') {
    tables.forEach(table => {
      sql += `CREATE TABLE "${table.name}" (\n`;
      const colLines = table.columns.map(col => {
        let line = `  "${col.name}" ${col.type.toUpperCase()}`;
        const isPk = Boolean(col.isPk || col.pk);
        if (isPk) line += ` PRIMARY KEY`;
        if ((col.isNull === false || col.notNull === true) && !isPk) line += ` NOT NULL`;
        if ((col.isUnique || col.unique) && !isPk) line += ` UNIQUE`;
        return line;
      });

      relationships.filter(r => (r.fromTable || '').toLowerCase().replace(/["'`]/g, '') === table.name.toLowerCase().replace(/["'`]/g, '')).forEach(rel => {
        const fromCol = (rel.fromColumn || '').replace(/["'`]/g, '');
        const toTbl = (rel.toTable || '').replace(/["'`]/g, '');
        const toCol = (rel.toColumn || '').replace(/["'`]/g, '');
        if (fromCol && toTbl && toCol) {
          colLines.push(`  FOREIGN KEY ("${fromCol}") REFERENCES "${toTbl}" ("${toCol}") ON DELETE ${rel.onDelete || 'CASCADE'}`);
        }
      });

      sql += colLines.join(',\n');
      sql += `\n);\n\n`;
    });
  } else if (dialect === 'mssql') {
    tables.forEach(table => {
      sql += `CREATE TABLE [${table.name}] (\n`;
      const colLines = table.columns.map(col => {
        let line = `  [${col.name}] ${col.type.toUpperCase()}`;
        const isPk = Boolean(col.isPk || col.pk);
        if (isPk) line += ` PRIMARY KEY`;
        if ((col.isNull === false || col.notNull === true) && !isPk) line += ` NOT NULL`;
        if ((col.isUnique || col.unique) && !isPk) line += ` UNIQUE`;
        return line;
      });
      sql += colLines.join(',\n');
      sql += `\n);\nGO\n\n`;
    });

    relationships.forEach(rel => {
      const fromTbl = (rel.fromTable || '').replace(/["'`]/g, '');
      const fromCol = (rel.fromColumn || '').replace(/["'`]/g, '');
      const toTbl = (rel.toTable || '').replace(/["'`]/g, '');
      const toCol = (rel.toColumn || '').replace(/["'`]/g, '');
      if (fromTbl && fromCol && toTbl && toCol) {
        sql += `ALTER TABLE [${fromTbl}] ADD CONSTRAINT [FK_${fromTbl}_${fromCol}] `;
        sql += `FOREIGN KEY ([${fromCol}]) REFERENCES [${toTbl}] ([${toCol}]) `;
        sql += `ON DELETE ${rel.onDelete || 'CASCADE'};\nGO\n\n`;
      }
    });
  }

  return sql;
}

export function exportToMarkdownDocs(projectName, tables, relationships) {
  let md = `# Database Documentation: ${projectName}\n\n`;
  md += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
  md += `## Schema Summary\n\n`;
  md += `- **Total Tables:** ${tables.length}\n`;
  md += `- **Total Relationships:** ${relationships.length}\n\n`;

  md += `## Tables Overview\n\n`;
  tables.forEach(table => {
    md += `- [${table.name}](#${table.name.toLowerCase()}) - ${table.columns.length} fields`;
    if (table.note) md += `: *${table.note.split('\n')[0]}*`;
    md += `\n`;
  });
  md += `\n---\n\n`;

  tables.forEach(table => {
    md += `### <a id="${table.name.toLowerCase()}"></a> Table: \`${table.name}\`\n\n`;
    if (table.note) {
      md += `**Description:**\n\n> ${table.note.replace(/\n/g, '\n> ')}\n\n`;
    }

    md += `#### Columns\n\n`;
    md += `| Field | Type | Attributes | Description / Notes |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;

    table.columns.forEach(col => {
      let attrs = [];
      if (col.isPk) attrs.push('`PK`');
      if (col.isFk) attrs.push('`FK`');
      if (col.isUnique) attrs.push('`UNIQUE`');
      if (col.isNull === false && !col.isPk) attrs.push('`NOT NULL`');

      const attrStr = attrs.length > 0 ? attrs.join(' ') : '-';
      const noteStr = col.note ? col.note.replace(/\n/g, '<br>') : '-';
      md += `| **\`${col.name}\`** | \`${col.type}\` | ${attrStr} | ${noteStr} |\n`;
    });

    const rels = relationships.filter(r => r.fromTable === table.name || r.toTable === table.name);
    if (rels.length > 0) {
      md += `\n#### Foreign Keys & Relationships\n\n`;
      rels.forEach(r => {
        md += `- \`${r.fromTable}.${r.fromColumn}\` **${r.cardinality}** \`${r.toTable}.${r.toColumn}\`\n`;
      });
    }

    md += `\n---\n\n`;
  });

  return md;
}

/**
 * Updates or removes the headercolor setting for a table in DBML text.
 * Preserves all other settings, comments, notes, and formatting.
 *
 * @param {string} dbmlText - The current DBML code
 * @param {string} tableName - The table name to target
 * @param {string|null} newColor - The new hex color (e.g. '#3b82f6') or null/empty to remove
 * @returns {string} The updated DBML text
 */
export function updateTableHeaderColorInDBML(dbmlText, tableName, newColor) {
  if (!dbmlText || typeof dbmlText !== 'string' || !tableName) return dbmlText || '';
  const lines = dbmlText.split('\n');
  const targetLower = tableName.replace(/^["'`]|["'`]$/g, '').toLowerCase();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!/^Table\b/i.test(trimmed)) continue;

    const match = trimmed.match(/^Table\s+(?:([a-zA-Z0-9_"`']+)\.)?([a-zA-Z0-9_"`']+)(?:\s+as\s+[a-zA-Z0-9_"`']+)?(?:\s*\[([\s\S]*))?/i);
    if (!match) continue;

    const rawName = match[2] || match[1];
    const parsedName = rawName.replace(/^["'`]|["'`]$/g, '').toLowerCase();
    if (parsedName !== targetLower) continue;

    // Found target table declaration starting at line i
    // Determine the extent of the table header block (up to the opening { or next block)
    let headerEndLine = i;
    let inTriple = false;
    let inBracket = false;

    for (let j = i; j < lines.length; j++) {
      headerEndLine = j;
      const curLine = lines[j];
      for (let c = 0; c < curLine.length; c++) {
        if (curLine.substr(c, 3) === "'''") {
          inTriple = !inTriple;
          c += 2;
          continue;
        }
        if (inTriple) continue;
        if (curLine[c] === '[') inBracket = true;
        else if (curLine[c] === ']') inBracket = false;
      }
      if (!inTriple && !inBracket && curLine.includes('{')) {
        break;
      }
      if (j < lines.length - 1) {
        const nextLineTrimmed = lines[j + 1].trim();
        // Only stop if we are NOT inside brackets or notes, and reach a top-level block
        if (!inTriple && !inBracket && (/^(?:Table|Enum|TableGroup|Project|Ref)\s+[a-zA-Z0-9_"`']/i.test(nextLineTrimmed) || /^\}/.test(nextLineTrimmed))) {
          break;
        }
      }
    }

    const headerLines = lines.slice(i, headerEndLine + 1);
    let headerText = headerLines.join('\n');

    // Find the opening '[' and matching ']' in headerText (after the table name)
    const nameIdx = headerText.toLowerCase().indexOf(rawName.toLowerCase());
    const openBracketIdx = nameIdx !== -1 ? headerText.indexOf('[', nameIdx) : headerText.indexOf('[');

    let closeBracketIdx = -1;
    if (openBracketIdx !== -1) {
      let inSingle = false;
      let inDouble = false;
      let inTripleQuote = false;
      let inBacktick = false;
      for (let c = openBracketIdx; c < headerText.length; c++) {
        const ch = headerText[c];
        const prev = c > 0 ? headerText[c - 1] : '';
        if (headerText.substr(c, 3) === "'''") {
          inTripleQuote = !inTripleQuote;
          c += 2;
          continue;
        }
        if (inTripleQuote) continue;
        if (ch === "'" && !inDouble && !inBacktick && prev !== '\\') {
          inSingle = !inSingle;
        } else if (ch === '"' && !inSingle && !inBacktick && prev !== '\\') {
          inDouble = !inDouble;
        } else if (ch === '`' && !inSingle && !inDouble && prev !== '\\') {
          inBacktick = !inBacktick;
        } else if (!inSingle && !inDouble && !inBacktick) {
          if (ch === ']') {
            closeBracketIdx = c;
            break;
          }
        }
      }
    }

    const colorRegex = /(?:headercolor|header_color|color)\s*:\s*['"]?(#[0-9a-fA-F]{3,8}|[a-zA-Z0-9]+)['"]?/i;

    if (newColor) {
      if (openBracketIdx !== -1 && closeBracketIdx !== -1) {
        // Settings bracket already exists
        const before = headerText.substring(0, openBracketIdx + 1);
        const inside = headerText.substring(openBracketIdx + 1, closeBracketIdx);
        const after = headerText.substring(closeBracketIdx);

        if (colorRegex.test(inside)) {
          const updatedInside = inside.replace(colorRegex, `headercolor: ${newColor}`);
          headerText = before + updatedInside + after;
        } else {
          // Prepend headercolor to existing settings
          const trimmedInside = inside.trim();
          let updatedInside = '';
          if (!trimmedInside) {
            updatedInside = `headercolor: ${newColor}`;
          } else if (inside.startsWith('\n')) {
            updatedInside = `\n  headercolor: ${newColor},${inside}`;
          } else {
            updatedInside = `headercolor: ${newColor}, ${inside.trimStart()}`;
          }
          headerText = before + updatedInside + after;
        }
      } else {
        // No brackets exist in table header: insert [headercolor: ${newColor}] before '{'
        const braceIdx = headerText.indexOf('{');
        if (braceIdx !== -1) {
          const beforeBrace = headerText.substring(0, braceIdx).trimEnd();
          const afterBrace = headerText.substring(braceIdx);
          headerText = `${beforeBrace} [headercolor: ${newColor}] ${afterBrace}`;
        } else {
          headerText = `${headerText.trimEnd()} [headercolor: ${newColor}]`;
        }
      }
    } else {
      // Remove color (Reset to default)
      if (openBracketIdx !== -1 && closeBracketIdx !== -1) {
        const before = headerText.substring(0, openBracketIdx);
        let inside = headerText.substring(openBracketIdx + 1, closeBracketIdx);
        const after = headerText.substring(closeBracketIdx + 1);

        if (colorRegex.test(inside)) {
          // Remove color setting along with surrounding commas
          inside = inside.replace(/(?:,\s*)?(?:headercolor|header_color|color)\s*:\s*['"]?(#[0-9a-fA-F]{3,8}|[a-zA-Z0-9]+)['"]?(?:\s*,)?/i, (m) => {
            if (m.startsWith(',') && m.trim().endsWith(',')) {
              return ', ';
            }
            return '';
          });

          // Clean up stray commas/spaces
          inside = inside.replace(/^[\s,]+/, '').replace(/[\s,]+$/, '').trim();

          if (inside.length === 0) {
            // No other settings remain: remove brackets cleanly
            const cleanBefore = before.trimEnd();
            const cleanAfter = after.trimStart();
            if (cleanAfter.startsWith('{')) {
              headerText = `${cleanBefore} ${cleanAfter}`;
            } else if (cleanAfter.length > 0) {
              headerText = `${cleanBefore} ${cleanAfter}`;
            } else {
              headerText = cleanBefore;
            }
          } else {
            // Other settings remain (e.g. note: '...'): keep opening and closing brackets intact!
            const pad = inside.includes('\n') ? '\n  ' : ' ';
            const padEnd = inside.includes('\n') ? '\n' : ' ';
            headerText = `${before}[${pad}${inside}${padEnd}]${after}`;
          }
        }
      }
    }

    // Replace the slice in lines with the updated header lines
    const newHeaderLines = headerText.split('\n');
    lines.splice(i, headerEndLine - i + 1, ...newHeaderLines);
    break;
  }

  return lines.join('\n');
}
