<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchSystemProcessStatus } from '@/utils/commonapi'

type ServiceItem = {
  name: string
  status: string
  details: Record<string, string | number | null>
}

type ProcessStatus = {
  status: string
  checked_at: string
  services: ServiceItem[]
}

const loading = ref(false)
const statusData = ref<ProcessStatus | null>(null)
const timerId = ref<number | null>(null)

const tagTypeByStatus = (status: string) => {
  if (status === 'up') return 'success'
  if (status === 'degraded') return 'warning'
  return 'danger'
}

const loadProcessStatus = async () => {
  loading.value = true
  try {
    const response = await fetchSystemProcessStatus()
    statusData.value = response.data
  } catch (error) {
    ElMessage.error('获取系统状态失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadProcessStatus()
  timerId.value = window.setInterval(loadProcessStatus, 30000)
})

onBeforeUnmount(() => {
  if (timerId.value !== null) {
    window.clearInterval(timerId.value)
    timerId.value = null
  }
})
</script>

<template>
  <div class="process-page">
    <div class="page-header">
      <h1>系统后台任务</h1>
      <div class="actions">
        <el-button type="primary" :loading="loading" @click="loadProcessStatus">刷新状态</el-button>
      </div>
    </div>

    <el-alert
      v-if="statusData"
      :type="statusData.status === 'up' ? 'success' : 'warning'"
      :title="statusData.status === 'up' ? '系统运行正常' : '系统部分异常，请检查下方服务状态'"
      show-icon
      :closable="false"
    />

    <p class="checked-time" v-if="statusData">最近检查时间: {{ statusData.checked_at }}</p>

    <el-row :gutter="16" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" v-for="service in statusData?.services || []" :key="service.name">
        <el-card class="service-card">
          <div class="service-title">
            <span>{{ service.name }}</span>
            <el-tag size="small" :type="tagTypeByStatus(service.status)">{{ service.status }}</el-tag>
          </div>
          <div class="detail-row" v-for="(value, key) in service.details" :key="`${service.name}-${key}`">
            <span class="detail-key">{{ key }}</span>
            <span class="detail-value">{{ value || '-' }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.process-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
}

.checked-time {
  margin: 12px 0 16px;
  color: #666;
}

.service-card {
  margin-bottom: 16px;
}

.service-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 600;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 0;
  font-size: 13px;
  border-bottom: 1px dashed #f0f0f0;
}

.detail-key {
  color: #666;
}

.detail-value {
  text-align: right;
  word-break: break-word;
}
</style>
