<template>
  <div class="group relative bg-obsidian-800 rounded-xl overflow-hidden flex flex-col border border-obsidian-600/40">
    <div class="p-5 aspect-[4/3] bg-obsidian-700/30">
      <div class="w-full h-full rounded-lg animate-pulse bg-obsidian-600/30"></div>
    </div>
    <div class="p-4 flex flex-col flex-1 gap-2.5">
      <div class="h-3 rounded-full animate-pulse w-3/4 bg-obsidian-600/40"></div>
      <div class="h-3 rounded-full animate-pulse w-1/2 bg-obsidian-600/30"></div>
      <div class="mt-auto pt-2 border-t flex justify-between items-center border-obsidian-600/30">
        <div class="h-5 rounded-full animate-pulse w-20 bg-obsidian-600/40"></div>
        <div class="w-9 h-9 rounded-lg animate-pulse bg-obsidian-600/40"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ dark: Boolean })
</script>
