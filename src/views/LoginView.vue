<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '@/api/auth'

const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(username.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <form class="auth-card" @submit.prevent="submit">
      <h1>PM Canvas</h1>
      <p class="auth-subtitle">无限画布原型工具</p>

      <label class="auth-field">
        <span>账号</span>
        <input v-model="username" type="text" autocomplete="username" placeholder="请输入账号" />
      </label>

      <label class="auth-field">
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入密码" />
      </label>

      <p v-if="error" class="auth-error">{{ error }}</p>

      <button class="auth-submit" type="submit" :disabled="loading">
        {{ loading ? '登录中...' : '登 录' }}
      </button>
    </form>
  </div>
</template>
