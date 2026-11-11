import { StreamLanguage, HighlightStyle, syntaxHighlighting, foldService } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, Decoration } from '@codemirror/view';
import { EditorState, StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { SearchQuery } from '@codemirror/search';

// State effect and field for custom search highlight across entire document
export const setCustomSearchEffect = StateEffect.define();

export const customSearchHighlightField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setCustomSearchEffect)) {
        const { query, activeMatch } = effect.value || {};
        if (!query || !query.trim()) {
          return Decoration.none;
        }
        const builder = new RangeSetBuilder();
        try {
          const sq = new SearchQuery({ search: query, caseSensitive: false });
          const cursor = sq.getCursor(tr.state.doc);
          let item;
          while (!(item = cursor.next()).done) {
            const from = item.value.from;
            const to = item.value.to;
            const isSelected = Boolean(activeMatch && activeMatch.from === from && activeMatch.to === to);
            builder.add(
              from,
              to,
              Decoration.mark({
                class: isSelected ? 'cm-searchMatch cm-searchMatch-selected' : 'cm-searchMatch'
              })
            );
          }
          return builder.finish();
        } catch (err) {
          return Decoration.none;
        }
      }
    }
    return tr.docChanged ? decorations.map(tr.changes) : decorations;
  },
  provide: (f) => EditorView.decorations.from(f)
});

// Helper to find matching brace while ignoring strings and comments
function findMatchingBrace(doc, startPos) {
  let depth = 0;
  const total = doc.length;
  let inString = false;
  let quoteChar = null;
  let inComment = false;

  const getSlice = (from, to) => doc.sliceString ? doc.sliceString(from, to) : doc.slice(from, to);

  for (let i = startPos; i < total; i++) {
    const ch = getSlice(i, i + 1);
    const next2 = getSlice(i, i + 2);
    const next3 = getSlice(i, i + 3);

    if (inComment) {
      if (next2 === '*/') {
        inComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (quoteChar === "'''" && next3 === "'''") {
        inString = false;
        quoteChar = null;
        i += 2;
      } else if ((quoteChar === "'" && ch === "'") || (quoteChar === '"' && ch === '"')) {
        inString = false;
        quoteChar = null;
      }
      continue;
    }

    if (next2 === '/*') {
      inComment = true;
      i++;
      continue;
    }

    if (next3 === "'''") {
      inString = true;
      quoteChar = "'''";
      i += 2;
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = true;
      quoteChar = ch;
      continue;
    }

    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return null;
}

// Custom DBML Folding Service for Table, Enum, TableGroup, Project, block comments, notes
export const dbmlFoldService = foldService.of((state, lineStart, lineEnd) => {
  const line = state.doc.lineAt(lineStart);
  const text = line.text;

  // 1. Fold curly brace blocks { ... } (Table, Enum, TableGroup, Project, indexes, Note)
  const braceIdx = text.indexOf('{');
  if (braceIdx !== -1) {
    const bracePos = line.from + braceIdx;
    const endPos = findMatchingBrace(state.doc, bracePos);
    if (endPos !== null) {
      const endLine = state.doc.lineAt(endPos);
      if (endLine.number > line.number) {
        return { from: line.to, to: endPos };
      }
    }
  }

  // 2. Fold multi-line block comments /* ... */
  const commentIdx = text.indexOf('/*');
  if (commentIdx !== -1 && !text.includes('*/', commentIdx + 2)) {
    const docStr = state.doc.toString();
    const closeIdx = docStr.indexOf('*/', line.from + commentIdx + 2);
    if (closeIdx !== -1) {
      return { from: line.to, to: closeIdx + 2 };
    }
  }

  // 3. Fold multi-line notes ''' ... '''
  const noteIdx = text.indexOf("'''");
  if (noteIdx !== -1 && !text.includes("'''", noteIdx + 3)) {
    const docStr = state.doc.toString();
    const closeIdx = docStr.indexOf("'''", line.from + noteIdx + 3);
    if (closeIdx !== -1) {
      return { from: line.to, to: closeIdx + 3 };
    }
  }

  // 4. Fold multi-line bracket settings [ ... ]
  const bracketIdx = text.indexOf('[');
  if (bracketIdx !== -1 && !text.includes(']', bracketIdx + 1)) {
    const docStr = state.doc.toString();
    const closeIdx = docStr.indexOf(']', line.from + bracketIdx + 1);
    if (closeIdx !== -1) {
      const endLine = state.doc.lineAt(closeIdx);
      if (endLine.number > line.number) {
        return { from: line.to, to: closeIdx + 1 };
      }
    }
  }

  return null;
});

// Define DBML Language Stream Parser
export const dbmlLanguage = StreamLanguage.define({
  name: 'dbml',
  startState() {
    return {
      inBlockComment: false,
      inString: false,
      stringQuote: null,
      inBracket: false,
    };
  },
  token(stream, state) {
    // Skip spaces
    if (stream.eatSpace()) return null;

    // Block Comments /* ... */
    if (state.inBlockComment) {
      while (!stream.eol()) {
        if (stream.match('*/')) {
          state.inBlockComment = false;
          break;
        }
        stream.next();
      }
      return 'blockComment';
    }

    if (stream.match('/*')) {
      state.inBlockComment = true;
      while (!stream.eol()) {
        if (stream.match('*/')) {
          state.inBlockComment = false;
          break;
        }
        stream.next();
      }
      return 'blockComment';
    }

    // Hex Color Literals (e.g. #10b981, #3b82f6, #fff)
    if (stream.match(/^#[0-9a-fA-F]{3,8}\b/)) {
      return 'number';
    }

    // Line Comments (// or # followed by whitespace/end-of-line)
    if (stream.match('//') || stream.match(/^#(?:\s|$)/)) {
      stream.skipToEnd();
      return 'lineComment';
    }

    // Triple single quote string / note: '''
    if (stream.match("'''")) {
      if (state.inString && state.stringQuote === "'''") {
        state.inString = false;
        state.stringQuote = null;
      } else if (!state.inString) {
        state.inString = true;
        state.stringQuote = "'''";
      }
      return 'string';
    }

    if (state.inString && state.stringQuote === "'''") {
      stream.next();
      return 'string';
    }

    // Single quote or Double quote string
    if (stream.match("'") || stream.match('"')) {
      const q = stream.current();
      if (state.inString && state.stringQuote === q) {
        state.inString = false;
        state.stringQuote = null;
      } else if (!state.inString) {
        state.inString = true;
        state.stringQuote = q;
      }
      return 'string';
    }

    if (state.inString) {
      stream.next();
      return 'string';
    }

    // DBML Core Keywords
    if (stream.match(/\b(Table|Ref|Enum|Project|TableGroup|indexes)\b/i)) {
      return 'keyword';
    }

    // Brackets [ ]
    if (stream.match('[') || stream.match(']')) {
      return 'squareBracket';
    }

    // Braces { }
    if (stream.match('{') || stream.match('}')) {
      return 'brace';
    }

    // Ref operators >, <, -, <>, and optional variants >?, ?>, <?, ?<, -?, ?-, <>?, ?<>
    if (stream.match(/^(?:\?<>|<>\?|<>|\?>|>\?|\?<|<\?|\?-|-\?|\?-\?|-|>|<)/)) {
      return 'operator';
    }

    // Attribute Keywords inside/outside brackets
    if (stream.match(/\b(note|ref|headercolor|color)\s*:/i)) {
      return 'definitionKeyword';
    }

    if (stream.match(/\b(pk|primary key|increment|unique|not null|null)\b/i)) {
      return 'attributeName';
    }

    // Multi-word data types (timestamp with time zone, double precision, etc)
    if (stream.match(/\b(timestamp\s+with\s+time\s+zone|timestamp\s+without\s+time\s+zone|time\s+with\s+time\s+zone|time\s+without\s+time\s+zone|double\s+precision|character\s+varying)\b/i)) {
      return 'typeName';
    }

    // Data Types (timestamptz, bigint, varchar, json, timestamp, etc)
    if (stream.match(/\b(timestamptz|timestampz|timestamp|timetz|time|datetime|date|bigint|int|integer|smallint|varchar|text|char|character|boolean|bool|uuid|decimal|numeric|float|double|real|serial|bigserial|smallserial|json|jsonb|blob|bytea|interval|citext|money|inet|cidr|macaddr|point|polygon|geometry|geography)\b/i)) {
      return 'typeName';
    }

    // Numbers
    if (stream.match(/\b\d+\b/)) {
      return 'number';
    }

    // Identifiers (Column / Table names)
    if (stream.match(/[a-zA-Z_][a-zA-Z0-9_.]*/)) {
      return 'variableName';
    }

    stream.next();
    return null;
  }
});

// ChartDB-like Syntax Color Highlight Styles
export const dbmlHighlightStyleLight = HighlightStyle.define([
  { tag: t.keyword, color: '#1d4ed8', fontWeight: '700' }, // Bold Blue (Table, Ref, Enum)
  { tag: t.typeName, color: '#0284c7', fontWeight: '600' }, // Cyan / Teal (bigint, varchar, json)
  { tag: t.squareBracket, color: '#16a34a', fontWeight: '700' }, // Green [ ]
  { tag: t.attributeName, color: '#15803d', fontWeight: '600' }, // Dark Green (pk, increment, not null)
  { tag: t.definitionKeyword, color: '#1d4ed8', fontWeight: '600' }, // Blue (note:, ref:)
  { tag: t.string, color: '#b91c1c' }, // Dark Red / Brown (''' Note content ''')
  { tag: [t.lineComment, t.blockComment], color: '#64748b', fontStyle: 'italic' }, // Slate comment
  { tag: t.brace, color: '#1d4ed8', fontWeight: '700' }, // Blue braces { }
  { tag: t.operator, color: '#16a34a', fontWeight: '700' }, // Green relationship operators >
  { tag: t.variableName, color: '#0f172a', fontWeight: '500' }, // Navy / Slate table and field names
  { tag: t.number, color: '#0284c7' }
]);

export const dbmlHighlightStyleDark = HighlightStyle.define([
  { tag: t.keyword, color: '#60a5fa', fontWeight: '700' }, // Bright Blue (Table, Ref, Enum)
  { tag: t.typeName, color: '#38bdf8', fontWeight: '600' }, // Sky Cyan (bigint, varchar, json)
  { tag: t.squareBracket, color: '#4ade80', fontWeight: '700' }, // Bright Green [ ]
  { tag: t.attributeName, color: '#4ade80', fontWeight: '600' }, // Bright Green (pk, increment, not null)
  { tag: t.definitionKeyword, color: '#818cf8', fontWeight: '600' }, // Indigo / Blue (note:, ref:)
  { tag: t.string, color: '#f87171' }, // Red / Coral (''' Note content ''')
  { tag: [t.lineComment, t.blockComment], color: '#94a3b8', fontStyle: 'italic' }, // Comment
  { tag: t.brace, color: '#60a5fa', fontWeight: '700' }, // Braces { }
  { tag: t.operator, color: '#4ade80', fontWeight: '700' }, // Green relationship operators >
  { tag: t.variableName, color: '#f8fafc', fontWeight: '500' }, // Slate-50 field names
  { tag: t.number, color: '#38bdf8' }
]);

// Theme Base Editor Styles
export function createEditorTheme(isDark = true) {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '13px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      backgroundColor: isDark ? '#090d16' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    '.cm-scroller': { fontFamily: 'inherit' },
    '.cm-content': {
      caretColor: isDark ? '#38bdf8' : '#2563eb',
      paddingTop: '12px',
      paddingBottom: '12px',
      lineHeight: '1.625',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: isDark ? '#38bdf8' : '#2563eb',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(147, 197, 253, 0.4)',
    },
    '.cm-gutters': {
      backgroundColor: isDark ? '#040711' : '#f8fafc',
      color: isDark ? '#475569' : '#94a3b8',
      borderRight: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
      paddingRight: '4px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
      color: isDark ? '#cbd5e1' : '#334155',
      fontWeight: 'bold',
    },
    '.cm-foldGutter': {
      width: '18px',
      color: isDark ? '#64748b' : '#94a3b8',
      cursor: 'pointer',
    },
    '.cm-foldGutter .cm-gutterElement': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.15s ease',
      fontSize: '11px',
    },
    '.cm-foldGutter .cm-gutterElement:hover': {
      color: isDark ? '#38bdf8' : '#2563eb',
    },
    '.cm-foldPlaceholder': {
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
      border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
      color: isDark ? '#94a3b8' : '#64748b',
      borderRadius: '4px',
      padding: '0 6px',
      margin: '0 4px',
      fontSize: '11px',
      cursor: 'pointer',
    },
    '.cm-activeLine': {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.9)',
    },
    '.cm-line': {
      paddingLeft: '12px',
      paddingRight: '12px',
    },
    '&.cm-table-ctrl-active': {
      cursor: 'pointer !important',
    },
    '&.cm-table-ctrl-active .cm-scroller': {
      cursor: 'pointer !important',
    },
    '&.cm-table-ctrl-active .cm-content': {
      cursor: 'pointer !important',
    },
    '&.cm-table-ctrl-active .cm-line': {
      cursor: 'pointer !important',
    },
    '&.cm-table-ctrl-active .cm-line *': {
      cursor: 'pointer !important',
    },
    '&.cm-table-ctrl-active .cm-gutter': {
      cursor: 'pointer !important',
    },
    '&.cm-table-ctrl-active .cm-gutterElement': {
      cursor: 'pointer !important',
    },
    '.cm-table-line-highlight': {
      backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(99, 102, 241, 0.12)',
      borderRadius: '4px',
    },
    '.cm-searchMatch': {
      backgroundColor: isDark ? 'rgba(234, 179, 8, 0.42)' : 'rgba(254, 240, 138, 0.95)',
      outline: isDark ? '1px solid rgba(250, 204, 21, 0.7)' : '1px solid rgba(234, 179, 8, 0.8)',
      borderRadius: '2px',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: isDark ? '#ea580c !important' : '#ea580c !important',
      color: '#ffffff !important',
      outline: isDark ? '2px solid #fbbf24' : '2px solid #c2410c',
      fontWeight: '700',
      borderRadius: '2px',
      zIndex: '2',
    }
  }, { dark: isDark });
}

export const dbmlCompletions = [
  // Attributes & Constraints
  { label: 'pk', type: 'keyword', detail: 'Primary key constraint' },
  { label: 'increment', type: 'keyword', detail: 'Auto-increment column' },
  { label: 'unique', type: 'keyword', detail: 'Unique column constraint' },
  { label: 'not null', type: 'keyword', detail: 'NOT NULL constraint' },
  { label: 'null', type: 'keyword', detail: 'Nullable column' },
  { label: 'default: ', type: 'keyword', detail: 'Default column value' },
  { label: 'note: \'\'', type: 'keyword', detail: 'Column or table note' },
  { label: 'headercolor: \'#3b82f6\'', type: 'keyword', detail: 'Table header color' },

  // Relationship Operators
  { label: 'ref: >? ', type: 'keyword', detail: 'Optional Many-to-One FK (>? to parent.col)' },
  { label: 'ref: > ', type: 'keyword', detail: 'Many-to-One FK (> to parent.col)' },
  { label: 'ref: ?> ', type: 'keyword', detail: 'Optional Many-to-One FK (?> to parent.col)' },
  { label: 'ref: < ', type: 'keyword', detail: 'One-to-Many relationship (<)' },
  { label: 'ref: <? ', type: 'keyword', detail: 'Optional One-to-Many relationship (<?)' },
  { label: 'ref: - ', type: 'keyword', detail: 'One-to-One relationship (-)' },
  { label: 'ref: -? ', type: 'keyword', detail: 'Optional One-to-One relationship (-?)' },
  { label: 'ref: <> ', type: 'keyword', detail: 'Many-to-Many relationship (<>)' },
  { label: 'ref: <>? ', type: 'keyword', detail: 'Optional Many-to-Many relationship (<>?)' },

  // Referential Actions
  { label: 'delete: cascade', type: 'keyword', detail: 'ON DELETE CASCADE' },
  { label: 'delete: set null', type: 'keyword', detail: 'ON DELETE SET NULL' },
  { label: 'delete: restrict', type: 'keyword', detail: 'ON DELETE RESTRICT' },
  { label: 'delete: no action', type: 'keyword', detail: 'ON DELETE NO ACTION' },
  { label: 'update: cascade', type: 'keyword', detail: 'ON UPDATE CASCADE' },
  { label: 'update: set null', type: 'keyword', detail: 'ON UPDATE SET NULL' },

  // Top level structures
  { label: 'Table ', type: 'keyword', detail: 'Define a table' },
  { label: 'Ref: ', type: 'keyword', detail: 'Standalone foreign key: Ref: child.col > parent.col' },
  { label: 'Ref {', type: 'keyword', detail: 'Multi-line Ref block' },
  { label: 'Enum ', type: 'keyword', detail: 'Define an Enum type' },
  { label: 'TableGroup ', type: 'keyword', detail: 'Group tables together' },
  { label: 'indexes {', type: 'keyword', detail: 'Define composite/unique indexes block' },
  { label: 'Project ', type: 'keyword', detail: 'Project metadata block' },

  // Data Types
  { label: 'bigint', type: 'type', detail: '64-bit integer' },
  { label: 'integer', type: 'type', detail: '32-bit integer' },
  { label: 'int', type: 'type', detail: 'Integer type' },
  { label: 'varchar(255)', type: 'type', detail: 'Variable-length string' },
  { label: 'text', type: 'type', detail: 'Text string' },
  { label: 'boolean', type: 'type', detail: 'Boolean true/false' },
  { label: 'timestamptz', type: 'type', detail: 'Timestamp with time zone' },
  { label: 'timestamp', type: 'type', detail: 'Timestamp without time zone' },
  { label: 'timetz', type: 'type', detail: 'Time with time zone' },
  { label: 'datetime', type: 'type', detail: 'Date & time' },
  { label: 'date', type: 'type', detail: 'Calendar date' },
  { label: 'time', type: 'type', detail: 'Time without date' },
  { label: 'uuid', type: 'type', detail: 'UUID identifier' },
  { label: 'serial', type: 'type', detail: 'Auto-incrementing 32-bit integer' },
  { label: 'bigserial', type: 'type', detail: 'Auto-incrementing 64-bit integer' },
  { label: 'json', type: 'type', detail: 'JSON payload' },
  { label: 'jsonb', type: 'type', detail: 'Binary JSON payload' },
  { label: 'decimal(10,2)', type: 'type', detail: 'Fixed-point decimal' },
  { label: 'numeric', type: 'type', detail: 'Arbitrary precision numeric' },
  { label: 'float', type: 'type', detail: 'Floating-point number' },
  { label: 'bytea', type: 'type', detail: 'Binary string' },
  { label: 'interval', type: 'type', detail: 'Time interval' }
];

export function dbmlCompletionSource(context) {
  const word = context.matchBefore(/[\w:.>-?]+/);
  if (!word && !context.explicit) return null;

  return {
    from: word ? word.from : context.pos,
    options: dbmlCompletions,
    validFor: /^[\w:.>-?]*$/
  };
}

export const dbmlAutocompleteExtension = autocompletion({
  override: [dbmlCompletionSource],
  icons: true,
  defaultKeymap: true
});
export { completionKeymap };

export const sqlLanguage = StreamLanguage.define({
  ...dbmlLanguage.streamParser,
  token(stream, context) {
    if (!context.inBlockComment && !context.inString) {
      if (stream.match('--')) {
        stream.skipToEnd();
        return 'lineComment';
      }
      if (stream.match(/^(CREATE|ALTER|DROP|TABLE|ADD|COLUMN|CONSTRAINT|REFERENCES|FOREIGN|KEY|PRIMARY|DEFAULT|CHECK|INDEX|UNIQUE|NOT|NULL|GO|USE|IF|EXISTS|ON|DELETE|CASCADE)\b/i)) return 'keyword';
    }
    return dbmlLanguage.streamParser.token(stream, context);
  }
});
