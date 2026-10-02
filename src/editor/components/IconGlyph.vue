<script lang="ts">
import { defineComponent } from 'vue'
import { renderIcon } from '@/editor/widgets/icons'

export default defineComponent({
  name: 'IconGlyph',
  props: {
    name: { type: String, required: true },
    color: { type: String, default: undefined },
    size: { type: String, default: '18px' }
  },
  setup(props) {
    return () => renderIcon(props.name, props.color, props.size)
  }
})
</script>
