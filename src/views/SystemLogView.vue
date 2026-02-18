<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { baseURL } from '@/config/baseConfig'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { token } = storeToRefs(authStore)

interface SystemLog {
  id: number
  module: string
  level: string
  message: string
  extra_data: string
  timestamp: string
}

const logs = ref<SystemLog[]>([])
const loading = ref(false)
const filterLevel = ref('')
const filterModule = ref('')
const searchKeyword = ref('')
const limit = ref(100)

const modules = [
  { label: '全部模块', value: '' },
  { label: '价格同步', value: 'price_sync' },
  { label: 'K线聚合', value: 'kline_aggregate' },
  { label: '新闻采集', value: 'news_collect' },
  { label: '情绪计算', value: 'sentiment_calc' }
]

const levels = [
  { label: '全部级别', value: '' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' }
]

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${baseURL}system_log`, {
      params: {
        level: filterLevel.value,
        module: filterModule.value,
        keyword: searchKeyword.value,
        limit: limit.value
      },
      headers: {
        Authorization: `Bearer ${token.value}`
      }
    })
    logs.value = res.data.logs || []
  } catch (error: any) {
    ElMessage.error('加载系统日志失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const levelTagType = (level: string) => {
  const map: any = { INFO: 'info', WARN: 'warning', ERROR: 'danger' }
  return map[level] || 'info'
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadLogs()
})
</script>

<template>
  <div class="system-log-container">
    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <el-select v-model="filterModule" placeholder="选择模块" style="width: 150px">
          <el-option v-for="m in modules" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
        <el-select v-model="filterLevel" placeholder="选择级别" style="width: 150px">
          <el-option v-for="l in levels" :key="l.value" :label="l.label" :value="l.value" />
        </el-select>
        <el-input v-model="searchKeyword" placeholder="内容搜索" style="width: 200px" clearable @keyup.enter="loadLogs" />
        <el-input-number v-model="limit" :min="10" :max="500" label="条数" style="width: 130px" />
        <el-button type="primary" @click="loadLogs" :loading="loading">查询日志</el-button>
      </div>
    </el-card>

    <el-table :data="logs" v-loading="loading" style="width: 100%; margin-top: 12px" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="timestamp" label="时间" width="180">
        <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
      </el-table-column>
      <el-table-column prop="level" label="级别" width="100">
        <template #default="{ row }">
          <el-tag :type="levelTagType(row.level)">{{ row.level }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="module" label="模块" width="150" />
      <el-table-column prop="message" label="日志内容" />
      <el-table-column label="详情" width="100">
        <template #default="{ row }">
          <el-popover v-if="row.extra_data" placement="left" title="额外数据" :width="400" trigger="click">
            <pre class="extra-pre">{{ JSON.parse(row.extra_data) }}</pre>
            <template #reference>
              <el-button size="small" type="info" link>查看详情</el-button>
            </template>
          </el-popover>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.system-log-container {
  padding: 20px;
}
.filter-card {
  margin-bottom: 0;
}
.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}
.extra-pre {
  background: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  max-height: 400px;
  overflow: auto;
  font-size: 12px;
}
</style>
