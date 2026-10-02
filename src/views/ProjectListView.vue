<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteProject, listProjects, saveProject } from '@/api/project'
import { logout } from '@/api/auth'
import { getStoredUser } from '@/api/http'
import { createProject, serializeProject } from '@/editor/core/schema'
import type { ProjectRecord } from '@/api/types'
import IconGlyph from '@/editor/components/IconGlyph.vue'

const router = useRouter()
const projects = ref<ProjectRecord[]>([])
const keyword = ref('')
const loading = ref(false)
const error = ref('')
const showDialog = ref(false)
const newName = ref('')
const userName = computed(() => getStoredUser() || 'wangzhe')

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    projects.value = (await listProjects(keyword.value)).rows
  } catch (err) {
    projects.value = []
    error.value = err instanceof Error ? err.message : '项目列表加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

async function create() {
  const name = newName.value.trim()
  if (!name) return
  const record = await saveProject({ id: '', name, content: serializeProject(createProject(name)) })
  showDialog.value = false
  newName.value = ''
  await router.push(`/editor/${record.id}`)
}

function open(record: ProjectRecord) {
  void router.push(`/editor/${record.id}`)
}

async function remove(record: ProjectRecord) {
  if (!window.confirm(`确认删除项目「${record.name}」？该操作不可恢复。`)) return
  await deleteProject(record.id)
  await refresh()
}

async function doLogout() {
  await logout()
  await router.replace('/login')
}

function formatTime(value?: string): string {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : ''
}
</script>

<template>
  <div class="project-page">
    <header class="project-header">
      <div class="project-header__brand">
        <icon-glyph name="tabler:vector-triangle" size="22px" />
        <h1>PM Canvas</h1>
      </div>
      <div class="project-header__actions">
        <span class="project-user">{{ userName }}</span>
        <button @click="doLogout">退出</button>
      </div>
    </header>

    <div class="project-toolbar">
      <input v-model="keyword" class="project-search" placeholder="搜索项目名称" @keyup.enter="refresh" />
      <button class="btn-ghost" @click="refresh">搜索</button>
      <button class="btn-primary" @click="showDialog = true">新建项目</button>
    </div>

    <p v-if="loading" class="project-empty">加载中...</p>
    <div v-else-if="error" class="project-empty">
      <p>{{ error }}</p>
      <button class="btn-ghost" @click="refresh">重试</button>
    </div>
    <p v-else-if="!projects.length" class="project-empty">还没有项目，点击「新建项目」开始</p>

    <div v-else class="project-grid">
      <article v-for="record in projects" :key="record.id" class="project-card" @click="open(record)">
        <div class="project-card__preview">
          <icon-glyph name="tabler:stack-2" size="34px" />
        </div>
        <div class="project-card__body">
          <h3>{{ record.name }}</h3>
          <p>更新于 {{ formatTime(record.updateTime) }}</p>
        </div>
        <button class="project-card__delete" title="删除" @click.stop="remove(record)">
          <icon-glyph name="tabler:trash" size="16px" />
        </button>
      </article>
    </div>

    <div v-if="showDialog" class="modal-mask" @click.self="showDialog = false">
      <div class="dialog">
        <h3>新建项目</h3>
        <input v-model="newName" placeholder="请输入项目名称" @keyup.enter="create" />
        <div class="dialog__actions">
          <button @click="showDialog = false">取消</button>
          <button class="btn-primary" @click="create">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>
