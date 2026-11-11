<template><div ref="host" class="min-h-0 flex-1 overflow-auto select-text" /></template>
<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { EditorView, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting } from '@codemirror/language';
import { dbmlLanguage, sqlLanguage, dbmlHighlightStyleDark } from '../utils/dbmlCodeMirror.js';
const props = defineProps({ code: String, language: String });
const host = ref(null);
let editor;
watch([host, () => props.code, () => props.language], () => {
  editor?.destroy();
  if (!host.value) return;
  editor = new EditorView({ parent: host.value, state: EditorState.create({
    doc: props.code || '',
    extensions: [lineNumbers(), EditorState.readOnly.of(true), EditorView.editable.of(false),
      props.language === 'dbml' ? dbmlLanguage : sqlLanguage,
      syntaxHighlighting(dbmlHighlightStyleDark),
      EditorView.contentAttributes.of({ 'aria-label': 'Schema code preview', tabindex: '0' }),
      EditorView.theme({ '&': { backgroundColor: '#0f172a', color: '#e2e8f0', minHeight: '260px' },
        '.cm-scroller': { fontFamily: 'monospace', fontSize: '12px' },
        '.cm-gutters': { backgroundColor: '#0f172a', color: '#64748b', border: 'none' },
        '.cm-content': { padding: '16px 0' } }, { dark: true })]
  }) });
}, { flush: 'post' });
onBeforeUnmount(() => editor?.destroy());
</script>
