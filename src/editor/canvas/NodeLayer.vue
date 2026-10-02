<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { PMNode } from '../core/schema'
import { renderNode } from '../render/renderNode'

export default defineComponent({
  name: 'NodeLayer',
  props: {
    nodes: {
      type: Array as PropType<PMNode[]>,
      required: true
    }
  },
  setup(props) {
    return () => props.nodes.map((node) => renderNode(node))
  }
})
</script>
