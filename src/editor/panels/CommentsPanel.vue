<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/editor/core/store'
import { displayName, registry } from '@/editor/core/registry'
import IconGlyph from '@/editor/components/IconGlyph.vue'

const store = useEditorStore()
const draft = ref('')

const node = computed(() => store.selectedNode)
const nodeName = computed(() => (node.value ? displayName(node.value) : ''))
const comments = computed(() => (node.value ? store.project.annotations[node.value.id] ?? [] : []))

function formatTime(value: number): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function submit() {
  const current = node.value
  if (!current) return
  const created = store.mutate(() => store.addComment(current.id, draft.value))
  if (created) draft.value = ''
}

function remove(commentId: string) {
  const current = node.value
  if (!current) return
  store.mutate(() => store.removeComment(current.id, commentId))
}

function toggle(commentId: string) {
  const current = node.value
  if (!current) return
  store.mutate(() => store.toggleCommentResolved(current.id, commentId))
}
</script>

<template>
  <div class="panel comments">
    <p v-if="!node" class="panel-empty">选中组件后，可为其添加评论说明</p>

    <template v-else>
      <div class="comments-target">
        <icon-glyph :name="registry.get(node.type)?.icon ?? 'tabler:box'" size="16px" />
        <span>{{ nodeName }}</span>
        <em>#{{ node.id.slice(-6) }}</em>
      </div>

      <div class="comments-list">
        <p v-if="!comments.length" class="panel-empty">暂无评论</p>
        <div v-for="comment in comments" :key="comment.id" class="comment-item" :class="{ resolved: comment.resolved }">
          <div class="comment-item__head">
            <strong>{{ comment.author }}</strong>
            <span>{{ formatTime(comment.createdAt) }}</span>
          </div>
          <p class="comment-item__text">{{ comment.text }}</p>
          <div class="comment-item__actions">
            <button @click="toggle(comment.id)">{{ comment.resolved ? '取消解决' : '标记解决' }}</button>
            <button @click="remove(comment.id)">删除</button>
          </div>
        </div>
      </div>

      <div class="comments-editor">
        <textarea v-model="draft" rows="3" placeholder="输入对该组件的评论说明，导出 HTML 时会一并携带" />
        <button :disabled="!draft.trim()" @click="submit">添加评论</button>
      </div>
    </template>
  </div>
</template>
