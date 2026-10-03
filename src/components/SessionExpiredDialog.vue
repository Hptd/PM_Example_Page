<script setup lang="ts">
import { useRouter } from 'vue-router'
import { clearToken, sessionExpired } from '@/api/http'

const router = useRouter()

function confirm(): void {
  sessionExpired.value = false
  clearToken()
  void router.replace({ name: 'login' })
}
</script>

<template>
  <div v-if="sessionExpired" class="session-expired-mask">
    <div class="dialog session-expired-dialog">
      <h3>登录状态已失效</h3>
      <p class="session-expired-dialog__text">您长时间未操作，登录状态已失效</p>
      <div class="dialog__actions">
        <button class="btn-primary" @click="confirm">确认</button>
      </div>
    </div>
  </div>
</template>
