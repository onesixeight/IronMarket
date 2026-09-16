<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.plus" />
  </svg>
</template>

<script setup>
defineProps({ name: { type: String, default: 'plus' } })
const paths = {
  plus: 'M12 5v14M5 12h14',
  undo: 'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6v3',
  redo: 'm15 5 5 5-5 5M20 10H10a6 6 0 0 0-6 6v3',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  copy: 'M9 9h12v12H9zM15 9V3H3v12h6',
  rotate: 'M20 11a8 8 0 1 0-2 7M20 4v7h-7',
  flip: 'M12 3v2m0 4v2m0 4v2m0 4v1M8 6 2 18h6V6Zm8 0 6 12h-6V6Z',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  grid: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18',
  center: 'M12 2v5m0 10v5M2 12h5m10 0h5M8 8h8v8H8z',
  space: 'M3 4v16M21 4v16M7 7h3v10H7zM14 7h3v10h-3z',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  check: 'm5 12 4 4L19 6',
  gates: 'M3 21V5l9-2 9 2v16M3 7h18M12 3v18M6 10v8m3-8v8m6-8v8m3-8v8M3 21h18',
  wicket: 'M6 21V4h12v17H6ZM6 8h12M9 11v7m6-7v7m0-4h1',
  fence: 'M2 21V3m20 18V3M2 7h20M2 18h20M6 7V4m4 3V4m4 3V4m4 3V4M6 7v11m4-11v11m4-11v11m4-11v11',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
}
</script>
