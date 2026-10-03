<script setup lang="ts">
import SessionExpiredDialog from '@/components/SessionExpiredDialog.vue'
</script>

<template>
  <router-view />
  <session-expired-dialog />
</template>
