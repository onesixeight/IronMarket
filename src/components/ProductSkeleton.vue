<template>
  <div class="group relative bg-white rounded-xl overflow-hidden flex flex-col border border-iron-100/60" :class="dark && 'bg-iron-800/50 border-iron-700/40'">
    <div class="p-5 aspect-[4/3]" :class="dark ? 'bg-iron-700/30' : 'bg-cream-50/80'">
      <div class="w-full h-full rounded-lg animate-pulse" :class="dark ? 'bg-iron-600/30' : 'bg-iron-100/60'"></div>
    </div>
    <div class="p-4 flex flex-col flex-1 gap-2.5">
      <div class="h-3 rounded-full animate-pulse w-3/4" :class="dark ? 'bg-iron-600/40' : 'bg-iron-100/70'"></div>
      <div class="h-3 rounded-full animate-pulse w-1/2" :class="dark ? 'bg-iron-600/30' : 'bg-iron-100/50'"></div>
      <div class="mt-auto pt-2 border-t flex justify-between items-center" :class="dark ? 'border-iron-700/30' : 'border-iron-100/40'">
        <div class="h-5 rounded-full animate-pulse w-20" :class="dark ? 'bg-iron-600/40' : 'bg-iron-100/60'"></div>
        <div class="w-9 h-9 rounded-lg animate-pulse" :class="dark ? 'bg-iron-600/40' : 'bg-iron-100/60'"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ dark: Boolean })
</script>
