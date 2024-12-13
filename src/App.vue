<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
authStore.loadStoredToken()
</script>

<template>
  <RouterView></RouterView>
</template>
<style scoped lang="scss"></style>
