<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
    fetchTaskStatus,
    fetchTaskLogs,
    triggerNewsCollection,
    triggerSentimentCalc,
    triggerCoinInfoFetch,
    triggerKlineAggregate,
    connectTaskLogWS,
    type TaskLogMessage,
} from '@/utils/tasklogapi'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import { baseURL } from '@/config/baseConfig'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { token } = storeToRefs(authStore)

// ── Tab 切换 ──
const activeTab = ref('task')

// ── 计划任务日志状态 ──
const tasks = ref<any[]>([])
const selectedTaskId = ref<string>('')
const logs = ref<any[]>([])
const wsConnected = ref(false)
const wsInstance = ref<WebSocket | null>(null)
const logContainer = ref<HTMLElement | null>(null)
const triggering = ref<string>('')

// ── 系统日志状态 ──
const systemLogs = ref<any[]>([])
const sysLoading = ref(false)
const sysFilter = ref({ level: '', module: '', keyword: '', limit: 100 })
const sysModules = [
    { label: '全部模块', value: '' },
    { label: '价格同步', value: 'price_sync' },
    { label: 'K线聚合', value: 'kline_aggregate' },
    { label: '新闻采集', value: 'news_collect' },
    { label: '情绪计算', value: 'sentiment_calc' },
    { label: '自动交易', value: 'auto_trade' },
]
const sysLevels = [
    { label: '全部级别', value: '' },
    { label: 'INFO', value: 'INFO' },
    { label: 'WARN', value: 'WARN' },
    { label: 'ERROR', value: 'ERROR' },
]

// ── 加载系统日志 ──
const loadSystemLogs = async () => {
    sysLoading.value = true
    try {
        const res = await axios.get(`${baseURL}system_log`, {
            params: sysFilter.value,
            headers: { Authorization: `Bearer ${token.value}` },
        })
        systemLogs.value = res.data.logs || []
    } catch { systemLogs.value = [] }
    finally { sysLoading.value = false }
}

// ── 加载任务列表 ──
const loadTasks = async () => {
    try {
        const res = await fetchTaskStatus()
        tasks.value = res.data.tasks || []
    } catch (e) {
        console.error('加载任务状态失败', e)
    }
}

// ── 选择任务查看日志 ──
const selectTask = async (taskId: string) => {
    selectedTaskId.value = taskId
    logs.value = []
    try {
        const res = await fetchTaskLogs(taskId)
        if (res.data?.data?.logs) {
            logs.value = res.data.data.logs
            scrollToBottom()
        }
    } catch (e) {
        console.error('加载任务日志失败', e)
    }
}

// ── WebSocket 连接 ──
const connectWS = () => {
    if (wsInstance.value) {
        wsInstance.value.close()
    }
    wsInstance.value = connectTaskLogWS(
        null,
        (msg: TaskLogMessage) => {
            // 刷新任务列表（新任务或任务完成）
            if (msg.type === 'task_started' || msg.type === 'task_finished') {
                loadTasks()
            }
            // 如果是当前选中任务的日志，追加显示
            if (msg.task_id === selectedTaskId.value && msg.type === 'task_log') {
                logs.value.push(msg)
                scrollToBottom()
            }
            // 任务完成通知
            if (msg.type === 'task_finished') {
                const label = msg.status === 'completed' ? '完成' : '失败'
                ElMessage({
                    type: msg.status === 'completed' ? 'success' : 'error',
                    message: `任务 ${msg.task_id} ${label}`,
                    duration: 3000,
                })
            }
        },
        () => {
            wsConnected.value = false
        },
    )
    wsInstance.value.onopen = () => {
        wsConnected.value = true
    }
}

// ── 手动触发任务 ──
const handleTrigger = async (type: 'news' | 'sentiment' | 'coininfo' | 'kline') => {
    const nameMap: Record<string, string> = { news: '新闻采集', sentiment: '情绪计算', coininfo: '代币信息抓取', kline: 'K线聚合' }
    const name = nameMap[type] || type
    try {
        await ElMessageBox.confirm(`确定要手动触发「${name}」任务吗？`, '触发任务', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info',
        })
    } catch { return }

    triggering.value = type
    try {
        let res
        if (type === 'news') res = await triggerNewsCollection()
        else if (type === 'sentiment') res = await triggerSentimentCalc()
        else if (type === 'kline') res = await triggerKlineAggregate()
        else res = await triggerCoinInfoFetch()

        const data = res.data
        if (data.task_id) {
            selectedTaskId.value = data.task_id
        }
        ElMessage.success(data.message || `${name}已触发`)
        loadTasks()
    } catch (e: any) {
        ElMessage.error(`触发${name}失败: ${e.message}`)
    } finally {
        triggering.value = ''
    }
}

// ── 辅助 ──
const scrollToBottom = () => {
    nextTick(() => {
        if (logContainer.value) {
            logContainer.value.scrollTop = logContainer.value.scrollHeight
        }
    })
}

const statusType = (status: string) => {
    const map: any = { running: 'primary', completed: 'success', failed: 'danger' }
    return map[status] || 'info'
}

const statusLabel = (status: string) => {
    const map: any = { running: '运行中', completed: '已完成', failed: '失败' }
    return map[status] || status
}

const levelColor = (level: string) => {
    const map: any = { info: '#409eff', warning: '#e6a23c', error: '#f56c6c', debug: '#909399' }
    return map[level] || '#606266'
}

const formatTime = (ts: string) => {
    if (!ts) return ''
    try {
        const d = new Date(ts)
        return d.toLocaleTimeString('zh-CN', { hour12: false })
    } catch { return ts }
}

const sysLevelTagType = (level: string) => {
    const map: any = { INFO: 'info', WARN: 'warning', ERROR: 'danger' }
    return map[level] || 'info'
}

onMounted(() => {
    loadTasks()
    connectWS()
    loadSystemLogs()
})

onBeforeUnmount(() => {
    wsInstance.value?.close()
})
</script>

<template>
    <div class="task-log-view">
        <el-tabs v-model="activeTab" type="border-card">
            <!-- Tab 1: 计划任务日志 -->
            <el-tab-pane label="计划任务日志" name="task">
                <!-- 顶部操作栏 -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <el-button type="primary" size="small" @click="handleTrigger('news')" :loading="triggering === 'news'">新闻采集</el-button>
                        <el-button type="warning" size="small" @click="handleTrigger('sentiment')" :loading="triggering === 'sentiment'">情绪计算</el-button>
                        <el-button type="success" size="small" @click="handleTrigger('coininfo')" :loading="triggering === 'coininfo'">代币抓取</el-button>
                        <el-button type="info" size="small" @click="handleTrigger('kline')" :loading="triggering === 'kline'">K线聚合</el-button>
                        <el-button size="small" @click="loadTasks">刷新</el-button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span :style="{ color: wsConnected ? '#67c23a' : '#f56c6c', fontSize: '18px' }">●</span>
                        <span style="font-size: 12px; color: #999;">{{ wsConnected ? 'WS已连接' : 'WS未连接' }}</span>
                        <el-button v-if="!wsConnected" size="small" @click="connectWS">重连</el-button>
                    </div>
                </div>
                <!-- 主体：左侧任务列表 + 右侧日志流 -->
                <div style="display: flex; gap: 12px; height: calc(100vh - 240px);">
                    <el-card shadow="never" style="width: 320px; flex-shrink: 0; overflow-y: auto;">
                        <template #header><span>任务列表</span></template>
                        <div v-if="!tasks.length" style="text-align: center; color: #ccc; padding: 20px;">暂无任务记录</div>
                        <div v-for="task in tasks" :key="task.task_id"
                            :class="['task-item', { active: selectedTaskId === task.task_id }]"
                            @click="selectTask(task.task_id)">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: bold; font-size: 13px;">{{ task.task_name }}</span>
                                <el-tag :type="statusType(task.status)" size="small">{{ statusLabel(task.status) }}</el-tag>
                            </div>
                            <div style="font-size: 11px; color: #999; margin-top: 4px;">{{ task.task_id }}</div>
                            <el-progress v-if="task.status === 'running'" :percentage="task.progress || 0" :stroke-width="6" style="margin-top: 6px;" />
                        </div>
                    </el-card>
                    <el-card shadow="never" style="flex: 1; display: flex; flex-direction: column;">
                        <template #header>
                            <span>实时日志 {{ selectedTaskId ? `— ${selectedTaskId}` : '' }}</span>
                        </template>
                        <div v-if="!selectedTaskId" style="text-align: center; color: #ccc; padding: 60px 0;">← 点击左侧任务查看日志</div>
                        <div v-else ref="logContainer" class="log-container">
                            <div v-for="(log, idx) in logs" :key="idx" class="log-line">
                                <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                                <span class="log-level" :style="{ color: levelColor(log.level) }">[{{ (log.level || 'info').toUpperCase() }}]</span>
                                <span v-if="log.stage" class="log-stage">{{ log.stage }}</span>
                                <span class="log-msg">{{ log.message }}</span>
                            </div>
                            <div v-if="!logs.length" style="text-align: center; color: #ccc; padding: 40px;">等待日志...</div>
                        </div>
                    </el-card>
                </div>
            </el-tab-pane>

            <!-- Tab 2: 系统日志 -->
            <el-tab-pane label="系统日志" name="system">
                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                    <el-select v-model="sysFilter.module" placeholder="模块" style="width: 140px;" size="small">
                        <el-option v-for="m in sysModules" :key="m.value" :label="m.label" :value="m.value" />
                    </el-select>
                    <el-select v-model="sysFilter.level" placeholder="级别" style="width: 120px;" size="small">
                        <el-option v-for="l in sysLevels" :key="l.value" :label="l.label" :value="l.value" />
                    </el-select>
                    <el-input v-model="sysFilter.keyword" placeholder="内容搜索" style="width: 160px;" size="small" clearable @keyup.enter="loadSystemLogs" />
                    <el-input-number v-model="sysFilter.limit" :min="10" :max="500" size="small" style="width: 100px;" />
                    <el-button type="primary" size="small" @click="loadSystemLogs" :loading="sysLoading">查询</el-button>
                </div>
                <el-table :data="systemLogs" v-loading="sysLoading" border stripe size="small" style="width: 100%;">
                    <el-table-column prop="id" label="ID" width="60" />
                    <el-table-column prop="timestamp" label="时间" width="160">
                        <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
                    </el-table-column>
                    <el-table-column prop="level" label="级别" width="80">
                        <template #default="{ row }">
                            <el-tag :type="sysLevelTagType(row.level)" size="small">{{ row.level }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="module" label="模块" width="120" />
                    <el-table-column prop="message" label="消息" min-width="300" show-overflow-tooltip />
                </el-table>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<style scoped>
.task-log-view {
    padding: 12px;
}

.task-item {
    padding: 10px 12px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
}
.task-item:hover {
    border-color: #409eff;
    background: #f0f7ff;
}
.task-item.active {
    border-color: #409eff;
    background: #ecf5ff;
}

.log-container {
    flex: 1;
    overflow-y: auto;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.8;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 12px;
    border-radius: 6px;
    min-height: 300px;
}

.log-line {
    display: flex;
    gap: 8px;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.log-time {
    color: #6a9955;
    flex-shrink: 0;
}

.log-level {
    font-weight: bold;
    flex-shrink: 0;
}

.log-stage {
    color: #dcdcaa;
    flex-shrink: 0;
}
.log-stage::before { content: '<'; }
.log-stage::after { content: '>'; }

.log-msg {
    color: #d4d4d4;
    overflow: hidden;
    text-overflow: ellipsis;
}

.log-progress {
    color: #569cd6;
    flex-shrink: 0;
    margin-left: auto;
}
</style>
