import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useBreadcrumbs(items) {
  const jsonLd = computed(() => {
    const list = items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      ...(item.to ? { item: `https://kovka.ru${item.to}` } : {}),
    }))
    return JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: list,
    })
  })
  return { jsonLd }
}
