<script setup lang="ts">
import { useAuthStore } from '@/src/stores/auth'
const authStore = useAuthStore()
authStore.loadStoredToken()
</script>

<template>
  <RouterView></RouterView>
</template>
<style scoped lang="scss"></style>
