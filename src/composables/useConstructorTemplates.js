import { computed, shallowRef, watch } from 'vue'
import { buildPreset, constructorPresets } from '../constructor/presets.js'
import { getLayoutSignature } from '../constructor/layoutSignature.js'

export function useConstructorTemplates(project, products, editorRevision) {
  // Rebuild candidate layouts only when frame dimensions change, not on each
  // pointer move. Recognition still follows edited items and undo/redo exactly.
  const frame = computed((previous) => {
    const next = {
      version: 1,
      type: project.value.type,
      width: project.value.width,
      height: project.value.height,
      sections: project.value.sections,
      items: [],
    }
    return previous && ['type', 'width', 'height', 'sections'].every((key) => previous[key] === next[key])
      ? previous
      : next
  })
  const candidates = computed(() => {
    return constructorPresets
      .filter((preset) => preset.id !== 'empty')
      .map((preset) => {
        const result = buildPreset(frame.value, products, preset.id)
        return { preset, available: result.available, signature: getLayoutSignature(result.items) }
      })
  })
  function readLayout() {
    const items = project.value.items
    // Grouping and locks express an edited motif even if its silhouette still
    // matches a recipe. Rebuilding that recipe would discard those decisions.
    if (!items.length || items.some((item) => item.groupId || item.locked)) return null
    return getLayoutSignature(items)
  }
  // Watch callbacks do not subscribe to the coordinates they read. Recognition
  // updates synchronously at commit/undo/redo, never during pointer previews.
  // The two-argument form remains useful for independent reactive projects.
  const layout = editorRevision ? shallowRef(readLayout()) : computed(readLayout)
  if (editorRevision)
    watch(
      editorRevision,
      () => {
        layout.value = readLayout()
      },
      { flush: 'sync' }
    )
  const activeTemplate = computed(() => {
    if (layout.value === null) return null
    return (
      candidates.value.find((candidate) => candidate.available && candidate.signature === layout.value)?.preset || null
    )
  })
  return { activeTemplate, templateCount: computed(() => candidates.value.length) }
}
