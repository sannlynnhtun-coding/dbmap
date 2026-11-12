<template>
  <img src="/favicon.svg" alt="dbmaps" :class="className" class="shrink-0 select-none object-contain" draggable="false" />
</template>

<script setup>
defineProps({
  className: { type: String, default: 'w-8 h-8' }
});
</script>
