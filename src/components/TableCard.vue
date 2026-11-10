<template>
  <div
    :id="'table-card-' + table.name"
    class="absolute shadow-lg rounded-xl border bg-white dark:bg-slate-800 transition-shadow duration-150 select-none group"
    :class="[
      isSelected ? 'ring-2 ring-blue-500 border-blue-500 shadow-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:shadow-xl',
      isDragging ? 'opacity-90 cursor-grabbing shadow-2xl scale-[1.01]' : 'cursor-grab'
    ]"
    :style="{
      left: table.x + 'px',
      top: table.y + 'px',
      width: dimensions.width + 'px'
    }"
    @mousedown="onMouseDown"
  >
    <!-- Table Header -->
    <div
      class="relative px-3.5 py-2.5 rounded-t-xl text-white font-semibold flex items-start justify-between gap-2 text-sm"
      :style="{ backgroundColor: `color-mix(in srgb, ${table.headerColor || '#3b82f6'} 45%, #101315)` }"
    >
      <!-- Table Name & Identity (Full name display, wraps naturally without truncation) -->
      <div class="flex items-start gap-2 font-mono flex-1 min-w-0">
        <TableIcon class="w-4 h-4 opacity-90 shrink-0 mt-0.5" />
        <div class="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
          <span
            class="font-mono font-bold text-sm leading-snug break-words [overflow-wrap:anywhere] select-text text-white drop-shadow-xs"
            :title="table.name"
          >
            {{ table.name }}
          </span>
          <!-- Note Indicator Badge -->
          <span
            v-if="table.note"
            @click.stop="showTableNotePopover = !showTableNotePopover"
            title="Has Table Note (Click to view/edit)"
            class="px-1.5 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-[10px] flex items-center gap-1 cursor-pointer transition shrink-0"
          >
            <FileText class="w-3 h-3" />
          </span>
        </div>
      </div>

      <!-- Quick Action Toolbar -->
      <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 bg-black/20 backdrop-blur-xs rounded-lg p-0.5 -mr-1 -mt-0.5">
        <!-- Table Note Button -->
        <button
          @click.stop="showTableNotePopover = !showTableNotePopover"
          :title="table.note ? 'Edit Table Note' : 'Add Table Note'"
          class="p-1 hover:bg-white/20 rounded transition text-white"
          :class="{ 'bg-white/20': showTableNotePopover }"
        >
          <FileText class="w-3.5 h-3.5" />
        </button>

        <!-- Header Color Picker Button -->
        <button
          @click.stop="showColorPicker = !showColorPicker"
          title="Customize Table Header Color"
          class="p-1 hover:bg-white/20 rounded transition text-white"
          :class="{ 'bg-white/20': showColorPicker }"
        >
          <Palette class="w-3.5 h-3.5" />
        </button>

        <button
          @click.stop="$emit('add-column', table.id)"
          title="Add Column"
          class="p-1 hover:bg-white/20 rounded transition text-white"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
        <button
          @click.stop="$emit('delete-table', table.id)"
          title="Delete Table"
          class="p-1 hover:bg-red-500/40 rounded transition text-white"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Table Note Popover -->
      <div
        v-if="showTableNotePopover"
        @mousedown.stop
        class="absolute left-2 top-10 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-72 text-slate-800 dark:text-slate-100"
      >
        <div class="text-[11px] font-sans font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1.5"><FileText class="w-3.5 h-3.5 text-blue-500" /> Table Note</span>
          <button @click.stop="showTableNotePopover = false" class="hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <textarea
          :value="table.note || ''"
          @input="onTableNoteInput($event.target.value)"
          placeholder="Enter table note / description... (Supports multiline DBML note: ''')"
          class="w-full h-24 text-xs font-mono p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-none"
        ></textarea>
        <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between">
          <span>Formatted as DBML Note</span>
          <button @click.stop="showTableNotePopover = false" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Done</button>
        </div>
      </div>

      <!-- Header Color Picker Popover -->
      <div
        v-if="showColorPicker"
        ref="colorPickerRef"
        @mousedown.stop
        class="absolute right-2 top-10 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2.5 w-52 text-slate-800 dark:text-slate-100"
      >
        <div class="text-[11px] font-sans font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center justify-between">
          <span>Header Color</span>
          <button @click.stop="showColorPicker = false" class="hover:text-slate-700 dark:hover:text-slate-200 p-0.5">
            <X class="w-3 h-3" />
          </button>
        </div>
        
        <!-- Preset Swatches Grid -->
        <div class="grid grid-cols-5 gap-1.5 mb-2.5">
          <button
            v-for="color in presetColors"
            :key="color"
            @click.stop="setColor(color)"
            class="w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center border border-black/10 shadow-xs cursor-pointer"
            :style="{ backgroundColor: color }"
          >
            <Check v-if="(table.headerColor || '#3b82f6').toLowerCase() === color.toLowerCase()" class="w-3.5 h-3.5 text-white stroke-[3]" />
          </button>
        </div>

        <!-- Custom Color Selector -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span class="text-[11px] text-slate-500 dark:text-slate-400">Custom Color:</span>
          <div class="flex items-center gap-1.5">
            <input
              type="color"
              :value="table.headerColor || '#3b82f6'"
              @input="onCustomColorInput($event.target.value)"
              @change="onCustomColorCommit($event.target.value)"
              class="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">{{ table.headerColor || '#3b82f6' }}</span>
          </div>
        </div>

        <!-- Reset / Default Color Button -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            @click.stop="setColor(null)"
            class="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer flex items-center gap-1"
            title="Reset to default theme color and remove from DBML"
          >
            <RotateCcw class="w-3 h-3" />
            <span>Reset to default</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Table Columns List (Filtered based on state.tableDisplayMode) -->
    <div v-if="state.tableDisplayMode !== 'tables'" class="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
      <!-- Empty Key Indicator if in 'keys' mode and table has no PK/FK -->
      <div
        v-if="state.tableDisplayMode === 'keys' && visibleColumnsWithIdx.length === 0"
        class="px-3.5 py-2.5 text-center text-slate-400 dark:text-slate-500 italic text-[11px] bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-center gap-1.5"
      >
        <Key class="w-3 h-3 text-slate-400 opacity-60" />
        <span>No key fields (PK/FK)</span>
      </div>

      <div
        v-for="item in visibleColumnsWithIdx"
        :key="item.originalIdx"
        :id="`col-${table.name}-${item.col.name}`"
        class="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/40 transition group/col"
      >
        <!-- Left Column Info: PK/FK Badge + Name + Note Indicator -->
        <div class="flex items-center gap-1.5 truncate pr-2 relative">
          <!-- PK Badge -->
          <span
            v-if="item.col.isPk || item.col.pk"
            class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-mono shrink-0 flex items-center gap-0.5"
            title="Primary Key"
          >
            <Key class="w-2.5 h-2.5" /> PK
          </span>
          <!-- FK Badge -->
          <span
            v-if="item.col.isFk || item.col.fk"
            class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-mono shrink-0 flex items-center gap-0.5"
            title="Foreign Key"
          >
            <Link class="w-2.5 h-2.5" /> FK
          </span>
          <span
            v-else-if="(item.col.isUnique || item.col.unique) && !(item.col.isPk || item.col.pk)"
            class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-mono shrink-0 flex items-center gap-0.5"
            title="Unique Key"
          >
            UQ
          </span>

          <span
            class="font-mono font-medium text-slate-800 dark:text-slate-200 truncate"
            :class="{ 'font-bold': item.col.isPk || item.col.pk }"
            :title="item.col.name"
          >
            {{ item.col.name }}
          </span>

          <!-- Column Note Indicator Icon / Button -->
          <button
            @click.stop="toggleColumnNotePopover(item.originalIdx)"
            :title="item.col.note ? `Note: ${item.col.note}` : 'Add Field Note'"
            class="p-0.5 rounded text-slate-400 hover:text-blue-500 transition shrink-0"
            :class="[
              item.col.note ? 'text-amber-500 dark:text-amber-400 opacity-100' : 'opacity-0 group-hover/col:opacity-100'
            ]"
          >
            <MessageSquare class="w-3 h-3" />
          </button>

          <!-- Column Note Popover Editor -->
          <div
            v-if="activeColNoteIdx === item.originalIdx"
            @mousedown.stop
            class="absolute left-0 top-7 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2.5 w-64 text-slate-800 dark:text-slate-100 font-sans"
          >
            <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span class="flex items-center gap-1"><MessageSquare class="w-3 h-3 text-amber-500" /> Note: <code class="text-blue-500 lowercase">{{ item.col.name }}</code></span>
              <button @click.stop="activeColNoteIdx = null" class="hover:text-slate-700 dark:hover:text-slate-200">
                <X class="w-3 h-3" />
              </button>
            </div>
            <textarea
              :value="item.col.note || ''"
              @input="onColumnNoteInput(item.originalIdx, $event.target.value)"
              placeholder="Enter field note [note: '...']"
              class="w-full h-18 text-xs font-mono p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-none"
            ></textarea>
            <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex justify-between">
              <span>DBML Field Note</span>
              <button @click.stop="activeColNoteIdx = null" class="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Save</button>
            </div>
          </div>
        </div>

        <!-- Right Column Info: Data Type + Attributes -->
        <div class="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
          <span class="column-data-type font-normal">
            {{ item.col.type }}
          </span>
          
          <span
            v-if="(item.col.isNull === false || item.col.notNull === true) && !(item.col.isPk || item.col.pk)"
            class="text-[10px] text-red-500 dark:text-red-400 font-semibold"
            title="NOT NULL"
          >
            NN
          </span>
          <span
            v-if="(item.col.isUnique || item.col.unique) && !(item.col.isPk || item.col.pk)"
            class="text-[10px] text-purple-600 dark:text-purple-400 font-semibold"
            title="UNIQUE"
          >
            UQ
          </span>

          <!-- Delete Column button -->
          <button
            @click.stop="$emit('delete-column', table.id, item.originalIdx)"
            title="Remove Column"
            class="opacity-0 group-hover/col:opacity-100 p-0.5 hover:text-red-500 transition text-slate-400"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Footer Action -->
    <div class="p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-b-xl border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 px-3 font-mono">
      <span v-if="state.tableDisplayMode === 'keys'">
        {{ visibleColumnsWithIdx.length }} of {{ table.columns.length }} keys
      </span>
      <span v-else>
        {{ table.columns.length }} fields
      </span>
      <button
        @click.stop="$emit('select-table', table.id)"
        class="hover:text-blue-500 transition font-sans flex items-center gap-1"
      >
        Edit Schema <ChevronRight class="w-3 h-3" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { getTableDimensions } from '../utils/diagramGeometry.js';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Table as TableIcon, Plus, Trash2, Key, Link, X, ChevronRight, Palette, Check, FileText, MessageSquare, RotateCcw } from 'lucide-vue-next';
import { state, updateTableHeaderColor, updateTableNote, updateColumnNote } from '../stores/schemaStore';

const props = defineProps({
  table: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  zoom: { type: Number, default: 1 }
});

// Dynamic responsive dimensions based on table name and columns
const dimensions = computed(() => {
  return getTableDimensions(props.table);
});

// Filter columns based on tableDisplayMode ('all' | 'tables' | 'keys')
const visibleColumnsWithIdx = computed(() => {
  const all = props.table.columns || [];
  if (state.tableDisplayMode === 'tables') {
    return [];
  }
  if (state.tableDisplayMode === 'keys') {
    return all
      .map((col, originalIdx) => ({ col, originalIdx }))
      .filter(item => item.col.isPk || item.col.pk || item.col.isFk || item.col.fk || item.col.isUnique || item.col.unique);
  }
  return all.map((col, originalIdx) => ({ col, originalIdx }));
});

const emit = defineEmits(['update-position', 'select-table', 'add-column', 'delete-column', 'delete-table']);

const showColorPicker = ref(false);
const colorPickerRef = ref(null);
const showTableNotePopover = ref(false);
const activeColNoteIdx = ref(null);

const presetColors = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#ef4444', // Red
  '#475569'  // Slate
];

let customColorTimer = null;

function setColor(color) {
  if (customColorTimer) {
    clearTimeout(customColorTimer);
    customColorTimer = null;
  }
  updateTableHeaderColor(props.table.id, color);
}

function onCustomColorInput(val) {
  if (customColorTimer) clearTimeout(customColorTimer);
  customColorTimer = setTimeout(() => {
    updateTableHeaderColor(props.table.id, val);
  }, 50);
}

function onCustomColorCommit(val) {
  if (customColorTimer) {
    clearTimeout(customColorTimer);
    customColorTimer = null;
  }
  updateTableHeaderColor(props.table.id, val);
}

function handleClickOutside(e) {
  if (showColorPicker.value && colorPickerRef.value && !colorPickerRef.value.contains(e.target)) {
    // If the click is not on the color button itself
    showColorPicker.value = false;
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    showColorPicker.value = false;
    showTableNotePopover.value = false;
    activeColNoteIdx.value = null;
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside);
  window.removeEventListener('keydown', handleKeyDown);
  if (customColorTimer) clearTimeout(customColorTimer);
});

function onTableNoteInput(val) {
  updateTableNote(props.table.id, val);
}

function toggleColumnNotePopover(idx) {
  if (activeColNoteIdx.value === idx) {
    activeColNoteIdx.value = null;
  } else {
    activeColNoteIdx.value = idx;
  }
}

function onColumnNoteInput(colIndex, val) {
  updateColumnNote(props.table.id, colIndex, val);
}

const isDragging = ref(false);
let startX = 0;
let startY = 0;
let initialTableX = 0;
let initialTableY = 0;

function onMouseDown(e) {
  // Prevent dragging if clicking input or action buttons
  if (['BUTTON', 'INPUT', 'SELECT', 'A', 'SVG', 'PATH'].includes(e.target.tagName)) return;

  e.stopPropagation();

  isDragging.value = true;
  emit('select-table', props.table.id);

  startX = e.clientX;
  startY = e.clientY;
  initialTableX = props.table.x;
  initialTableY = props.table.y;

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
  if (!isDragging.value) return;
  const dx = (e.clientX - startX) / props.zoom;
  const dy = (e.clientY - startY) / props.zoom;

  // Boundary constraint: prevent dragging table off into negative canvas margins
  const newX = Math.max(16, Math.round(initialTableX + dx));
  const newY = Math.max(16, Math.round(initialTableY + dy));

  emit('update-position', props.table.id, newX, newY);
}

function onMouseUp() {
  isDragging.value = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}
</script>
