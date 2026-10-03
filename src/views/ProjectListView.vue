<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteProject, listProjects, saveProject } from '@/api/project'
import { changePassword, logout } from '@/api/auth'
import { ApiError, getStoredUser } from '@/api/http'
import { createProject, serializeProject } from '@/editor/core/schema'
import type { ProjectRecord } from '@/api/types'
import IconGlyph from '@/editor/components/IconGlyph.vue'

const logoUrl = `${import.meta.env.BASE_URL}logo.svg`
const router = useRouter()
const projects = ref<ProjectRecord[]>([])
const keyword = ref('')
const loading = ref(false)
const error = ref('')
const showDialog = ref(false)
const newName = ref('')
const userName = computed(() => getStoredUser() || '用户')
const userMenu = ref(false)
const showPwdDialog = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwdError = ref('')
const pwdSubmitting = ref(false)

function toggleUserMenu() {
  userMenu.value = !userMenu.value
}

function closeUserMenu() {
  userMenu.value = false
}

onMounted(() => window.addEventListener('click', closeUserMenu))
onBeforeUnmount(() => window.removeEventListener('click', closeUserMenu))

function openPwdDialog() {
  userMenu.value = false
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  pwdError.value = ''
  showPwdDialog.value = true
}

function closePwdDialog() {
  if (pwdSubmitting.value) return
  showPwdDialog.value = false
}

function validatePassword(): string {
  if (!oldPassword.value) return '请输入旧密码'
  if (!newPassword.value) return '请输入新密码'
  if (newPassword.value.length < 6 || newPassword.value.length > 20) return '新密码长度必须在6到20个字符之间'
  if (/["'<>\\|]/.test(newPassword.value)) return '新密码不能包含非法字符'
  if (newPassword.value !== confirmPassword.value) return '两次输入的新密码不一致'
  return ''
}

async function submitPassword() {
  const message = validatePassword()
  if (message) {
    pwdError.value = message
    return
  }
  pwdSubmitting.value = true
  pwdError.value = ''
  try {
    await changePassword(oldPassword.value, newPassword.value)
    window.alert('密码修改成功，请重新登录')
    await logout()
    await router.replace('/login')
  } catch (err) {
    if (err instanceof ApiError && err.code === 401) return
    pwdError.value = err instanceof Error ? err.message : '修改密码失败'
  } finally {
    pwdSubmitting.value = false
  }
}

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    projects.value = (await listProjects(keyword.value)).rows
  } catch (err) {
    if (err instanceof ApiError && err.code === 401) return
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
  try {
    await saveProject({ id: '', name, content: serializeProject(createProject(name)) })
    showDialog.value = false
    newName.value = ''
    await refresh()
  } catch (err) {
    if (err instanceof ApiError && err.code === 401) return
    error.value = err instanceof Error ? err.message : '创建失败'
  }
}

function open(record: ProjectRecord) {
  void router.push(`/editor/${record.id}`)
}

async function remove(record: ProjectRecord) {
  if (!window.confirm(`确认删除项目「${record.name}」？该操作不可恢复。`)) return
  try {
    await deleteProject(record.id)
    await refresh()
  } catch (err) {
    if (err instanceof ApiError && err.code === 401) return
    error.value = err instanceof Error ? err.message : '删除失败'
  }
}

async function doLogout() {
  userMenu.value = false
  try {
    await logout()
  } finally {
    await router.replace('/login')
  }
}

function formatTime(value?: string): string {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : ''
}
</script>

<template>
  <div class="project-page">
    <header class="project-header">
      <div class="project-header__brand">
        <img class="brand-logo" :src="logoUrl" alt="PM Canvas" />
        <h1>PM Canvas</h1>
      </div>
      <div class="project-header__actions">
        <div class="user-menu">
          <button class="project-user" :class="{ active: userMenu }" @click.stop="toggleUserMenu">
            {{ userName }} ▾
          </button>
          <div v-if="userMenu" class="user-menu__dropdown" @click.stop>
            <button class="user-menu__item" @click="openPwdDialog">修改密码</button>
            <button class="user-menu__item" @click="doLogout">退出</button>
          </div>
        </div>
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
          <button class="btn-primary" :disabled="!newName.trim()" @click="create">创建</button>
        </div>
      </div>
    </div>

    <div v-if="showPwdDialog" class="modal-mask" @click.self="closePwdDialog">
      <form class="dialog" @submit.prevent="submitPassword">
        <h3>修改密码</h3>
        <label class="auth-field">
          <span>旧密码</span>
          <input v-model="oldPassword" type="password" autocomplete="current-password" placeholder="请输入旧密码" />
        </label>
        <label class="auth-field">
          <span>新密码</span>
          <input v-model="newPassword" type="password" autocomplete="new-password" placeholder="6~20 个字符" />
        </label>
        <label class="auth-field">
          <span>确认新密码</span>
          <input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="请再次输入新密码" />
        </label>
        <p v-if="pwdError" class="auth-error">{{ pwdError }}</p>
        <div class="dialog__actions">
          <button type="button" :disabled="pwdSubmitting" @click="closePwdDialog">取消</button>
          <button class="btn-primary" type="submit" :disabled="pwdSubmitting">
            {{ pwdSubmitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
