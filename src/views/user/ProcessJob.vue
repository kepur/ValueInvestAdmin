<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchSystemProcessStatus, fetchAuditLogs } from '@/utils/commonapi'
import { fetchTaskStatus } from '@/utils/tasklogapi'

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

const activeTab = ref('status')
const loading = ref(false)
const statusData = ref<ProcessStatus | null>(null)
const timerId = ref<number | null>(null)

// T-0410 计划任务列表
const taskList = ref<any[]>([])
const taskLoading = ref(false)
const loadTasks = async () => {
  taskLoading.value = true
  try {
    const res = await fetchTaskStatus()
    taskList.value = res.data?.tasks || []
  } catch {
    taskList.value = []
  } finally {
    taskLoading.value = false
  }
}

// T-0410 操作日志（审计日志）
const auditLogs = ref<any[]>([])
const auditLoading = ref(false)
const loadAuditLogs = async () => {
  auditLoading.value = true
  try {
    const res = await fetchAuditLogs()
    const data = res.data
    auditLogs.value = Array.isArray(data) ? data : (data?.auditlogs || [])
  } catch {
    auditLogs.value = []
  } finally {
    auditLoading.value = false
  }
}

const tagTypeByStatus = (status: string) => {
  if (status === 'up') return 'success'
  if (status === 'degraded') return 'warning'
  return 'danger'
}

const taskStatusType = (s: string) => {
  const m: Record<string, string> = { running: 'primary', completed: 'success', failed: 'danger' }
  return m[s] || 'info'
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

watch(activeTab, (name) => {
  if (name === 'tasks') loadTasks()
  if (name === 'audit') loadAuditLogs()
})

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

    <el-tabs v-model="activeTab">
      <el-tab-pane label="服务状态" name="status">
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
      </el-tab-pane>

      <el-tab-pane label="计划任务" name="tasks">
        <div class="tab-actions">
          <el-button size="small" @click="loadTasks" :loading="taskLoading">刷新</el-button>
        </div>
        <el-table :data="taskList" v-loading="taskLoading" border stripe size="small" style="width: 100%;">
          <el-table-column prop="task_id" label="任务ID" width="220" show-overflow-tooltip />
          <el-table-column prop="task_name" label="任务名称" min-width="140" />
          <el-table-column prop="task_type" label="类型" width="120" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="taskStatusType(row.status)" size="small">
                {{ row.status === 'running' ? '运行中' : row.status === 'completed' ? '完成' : row.status === 'failed' ? '失败' : row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="80" />
          <el-table-column prop="started_at" label="开始时间" width="180" show-overflow-tooltip />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="操作日志" name="audit">
        <div class="tab-actions">
          <el-button size="small" @click="loadAuditLogs" :loading="auditLoading">刷新</el-button>
        </div>
        <el-table :data="auditLogs" v-loading="auditLoading" border stripe size="small" style="width: 100%;">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="user_name" label="用户" width="120" />
          <el-table-column prop="action" label="操作/描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="optime" label="时间" width="180" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
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

.tab-actions {
  margin-bottom: 12px;
}
</style>
