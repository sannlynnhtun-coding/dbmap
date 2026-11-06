import { computed, ref } from 'vue';

export function useTemplateFilters(templates) {
  const searchQuery = ref('');
  const selectedSource = ref('all');
  const selectedCategory = ref('all');
  const selectedDialect = ref('all');

  const filteredTemplates = computed(() => {
    const query = searchQuery.value.trim().toLowerCase();

    return templates.value.filter(template => {
      if (selectedSource.value === 'system' && !template.isSystem) return false;
      if (selectedCategory.value !== 'all' && template.category !== selectedCategory.value) return false;
      if (selectedDialect.value !== 'all' && template.dialect !== selectedDialect.value) return false;

      const searchFields = [
        template.name,
        template.description,
        template.category,
        template.author?.name,
        ...(template.tables || []).map(table => table.name)
      ];
      return searchFields.some(field => field?.toLowerCase().includes(query));
    });
  });

  function resetFilters() {
    searchQuery.value = '';
    selectedSource.value = 'all';
    selectedCategory.value = 'all';
    selectedDialect.value = 'all';
  }

  return { searchQuery, selectedSource, selectedCategory, selectedDialect, filteredTemplates, resetFilters };
}
