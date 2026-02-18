<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
    fetchTaskStatus,
    triggerNewsCollection,
    triggerSentimentCalc,
    connectTaskLogWS,
    type TaskLogMessage,
} from '@/utils/tasklogapi'
import { fetchHotspotSentiment } from '@/utils/hotspotapi'
import { ElMessage, ElMessageBox } from 'element-plus'

// ── 左侧: 实时日志 ──
const wsLogs = ref<any[]>([])
const wsConnected = ref(false)
const wsInstance = ref<WebSocket | null>(null)
const logBox = ref<HTMLElement | null>(null)
const triggering = ref('')
const recentTasks = ref<any[]>([])

const connectWS = () => {
    if (wsInstance.value) wsInstance.value.close()
    wsInstance.value = connectTaskLogWS(null, (msg: TaskLogMessage) => {
        // 只显示新闻采集和情绪计算相关的日志
        if (['news_collect', 'sentiment_calc'].includes(msg.task_type || '')) {
            wsLogs.value.push(msg)
            if (wsLogs.value.length > 200) wsLogs.value.shift()
            scrollLogToBottom()
        }
        if (msg.type === 'task_started' || msg.type === 'task_finished') {
            loadRecentTasks()
        }
    }, () => { wsConnected.value = false })
    wsInstance.value!.onopen = () => { wsConnected.value = true }
}

const scrollLogToBottom = () => {
    nextTick(() => {
        if (logBox.value) logBox.value.scrollTop = logBox.value.scrollHeight
    })
}

const handleTrigger = async (type: 'news' | 'sentiment') => {
    const name = type === 'news' ? '新闻采集' : '情绪计算'
    try {
        await ElMessageBox.confirm(`确定触发「${name}」？`, '触发任务', {
            confirmButtonText: '确定', cancelButtonText: '取消', type: 'info'
        })
    } catch { return }
    triggering.value = type
    try {
        const res = type === 'news' ? await triggerNewsCollection() : await triggerSentimentCalc()
        ElMessage.success(res.data.message || `${name}已触发`)
    } catch (e: any) {
        ElMessage.error(`触发失败: ${e.message}`)
    } finally {
        triggering.value = ''
    }
}

const loadRecentTasks = async () => {
    try {
        const res = await fetchTaskStatus()
        recentTasks.value = (res.data.tasks || [])
            .filter((t: any) => ['news_collect', 'sentiment_calc'].includes(t.task_type))
            .slice(0, 5)
    } catch {}
}

// ── 右侧: 情绪热度数据 ──
const sentimentData = ref<any>(null)
const loading = ref(false)
const days = ref(7)

const loadSentiment = async () => {
    loading.value = true
    try {
        const res = await fetchHotspotSentiment({ days: days.value, top_n: 10 })
        sentimentData.value = res.data.data || res.data
    } catch (e: any) {
        ElMessage.error('加载情绪数据失败')
    } finally {
        loading.value = false
    }
}

const moodColor = (mood: string) => {
    if (mood === '看涨' || mood === 'bullish') return '#67c23a'
    if (mood === '看跌' || mood === 'bearish') return '#f56c6c'
    return '#e6a23c'
}

const levelColor = (level: string) => {
    const map: any = { info: '#409eff', warn: '#e6a23c', error: '#f56c6c' }
    return map[level] || '#909399'
}

const formatTime = (ts: string) => {
    if (!ts) return ''
    try { return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false }) } catch { return ts }
}

const statusType = (s: string) => {
    const m: any = { running: 'primary', completed: 'success', failed: 'danger' }
    return m[s] || 'info'
}

onMounted(() => {
    connectWS()
    loadRecentTasks()
    loadSentiment()
})

onBeforeUnmount(() => {
    wsInstance.value?.close()
})
</script>

<template>
    <div class="metric-view">
        <!-- 左侧: 实时任务日志 -->
        <div class="left-panel">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <h3 style="margin:0;">计划任务日志</h3>
                <span :style="{ color: wsConnected ? '#67c23a' : '#f56c6c', fontSize: '14px' }">
                    {{ wsConnected ? 'WS 已连接' : 'WS 未连接' }}
                </span>
            </div>

            <!-- 触发按钮 -->
            <div style="display:flex; gap:8px; margin-bottom:12px;">
                <el-button type="primary" size="small" @click="handleTrigger('news')"
                    :loading="triggering === 'news'">新闻采集</el-button>
                <el-button type="warning" size="small" @click="handleTrigger('sentiment')"
                    :loading="triggering === 'sentiment'">情绪计算</el-button>
            </div>

            <!-- 最近任务状态 -->
            <div v-if="recentTasks.length" style="margin-bottom:12px;">
                <div v-for="task in recentTasks" :key="task.task_id" class="mini-task">
                    <span style="font-size:12px;">{{ task.task_name }}</span>
                    <el-tag :type="statusType(task.status)" size="small">
                        {{ task.status === 'running' ? '运行中' : task.status === 'completed' ? '完成' : task.status }}
                    </el-tag>
                </div>
            </div>

            <!-- 实时日志流 -->
            <div ref="logBox" class="log-box">
                <div v-if="!wsLogs.length" style="text-align:center; color:#666; padding:40px 0;">
                    等待任务日志...
                </div>
                <div v-for="(log, idx) in wsLogs" :key="idx" class="log-line">
                    <span class="log-time">{{ formatTime(log.timestamp) }}</span>
                    <span :style="{ color: levelColor(log.level), fontWeight: 'bold' }">
                        [{{ (log.level || 'info').toUpperCase() }}]
                    </span>
                    <span class="log-msg">{{ log.message }}</span>
                </div>
            </div>
        </div>

        <!-- 右侧: 情绪热度数据 -->
        <div class="right-panel" v-loading="loading">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                <h3 style="margin:0;">情绪热度概览</h3>
                <div style="display:flex; gap:8px; align-items:center;">
                    <el-select v-model="days" size="small" style="width:100px;" @change="loadSentiment">
                        <el-option :value="1" label="1天" />
                        <el-option :value="3" label="3天" />
                        <el-option :value="7" label="7天" />
                        <el-option :value="30" label="30天" />
                    </el-select>
                    <el-button size="small" @click="loadSentiment">刷新</el-button>
                </div>
            </div>

            <template v-if="sentimentData">
                <!-- 概览卡片 -->
                <el-row :gutter="12" style="margin-bottom:16px;">
                    <el-col :span="6">
                        <el-card shadow="never">
                            <div style="text-align:center;">
                                <div style="font-size:13px; color:#999;">市场情绪</div>
                                <div style="font-size:24px; font-weight:bold; margin-top:8px;"
                                    :style="{ color: moodColor(sentimentData.overview?.market_mood) }">
                                    {{ sentimentData.overview?.market_mood || '--' }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="never">
                            <div style="text-align:center;">
                                <div style="font-size:13px; color:#999;">平均情绪分</div>
                                <div style="font-size:24px; font-weight:bold; margin-top:8px;">
                                    {{ sentimentData.overview?.avg_sentiment?.toFixed(1) || '--' }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="never">
                            <div style="text-align:center;">
                                <div style="font-size:13px; color:#999;">平均热度</div>
                                <div style="font-size:24px; font-weight:bold; margin-top:8px;">
                                    {{ sentimentData.overview?.avg_heat?.toFixed(1) || '--' }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="never">
                            <div style="text-align:center;">
                                <div style="font-size:13px; color:#999;">事件总数</div>
                                <div style="font-size:24px; font-weight:bold; margin-top:8px;">
                                    {{ sentimentData.overview?.total_events || 0 }}
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>

                <!-- 情绪分布 -->
                <el-row :gutter="12" style="margin-bottom:16px;">
                    <el-col :span="12">
                        <el-card shadow="never">
                            <template #header><span>情绪分布</span></template>
                            <div v-if="sentimentData.sentiment_distribution" style="display:flex; gap:16px;">
                                <div style="flex:1; text-align:center;">
                                    <div style="color:#67c23a; font-size:28px; font-weight:bold;">
                                        {{ sentimentData.sentiment_distribution.bullish?.count || 0 }}
                                    </div>
                                    <div style="font-size:12px; color:#999;">
                                        看涨 ({{ sentimentData.sentiment_distribution.bullish?.pct || 0 }}%)
                                    </div>
                                </div>
                                <div style="flex:1; text-align:center;">
                                    <div style="color:#e6a23c; font-size:28px; font-weight:bold;">
                                        {{ sentimentData.sentiment_distribution.neutral?.count || 0 }}
                                    </div>
                                    <div style="font-size:12px; color:#999;">
                                        中性 ({{ sentimentData.sentiment_distribution.neutral?.pct || 0 }}%)
                                    </div>
                                </div>
                                <div style="flex:1; text-align:center;">
                                    <div style="color:#f56c6c; font-size:28px; font-weight:bold;">
                                        {{ sentimentData.sentiment_distribution.bearish?.count || 0 }}
                                    </div>
                                    <div style="font-size:12px; color:#999;">
                                        看跌 ({{ sentimentData.sentiment_distribution.bearish?.pct || 0 }}%)
                                    </div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="12">
                        <el-card shadow="never">
                            <template #header><span>趋势币种 TOP5</span></template>
                            <div v-for="(coin, idx) in (sentimentData.trending_coins || []).slice(0, 5)" :key="idx"
                                style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px solid #f0f0f0;">
                                <span>{{ coin.symbol || coin.coin_symbol }}</span>
                                <el-tag size="small">{{ coin.event_count || coin.count }} 条事件</el-tag>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>

                <!-- 热门事件表 -->
                <el-card shadow="never">
                    <template #header><span>热门事件 TOP10</span></template>
                    <el-table :data="sentimentData.trending || []" size="small" stripe>
                        <el-table-column prop="event_name" label="事件" min-width="200" show-overflow-tooltip />
                        <el-table-column label="情绪" width="80">
                            <template #default="{ row }">
                                <span :style="{ color: row.sentiment_score > 0 ? '#67c23a' : row.sentiment_score < 0 ? '#f56c6c' : '#e6a23c' }">
                                    {{ row.sentiment_score?.toFixed(0) }}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column label="热度" width="80">
                            <template #default="{ row }">{{ row.heat_index?.toFixed(0) }}</template>
                        </el-table-column>
                        <el-table-column label="来源数" width="70" prop="source_count" />
                    </el-table>
                </el-card>
            </template>

            <div v-else-if="!loading" style="text-align:center; color:#ccc; padding:60px;">暂无数据</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
/* T-0305 高密度页面自适应 */
.metric-view {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    height: auto;
    min-height: calc(100vh - 120px);
    padding: 4px;
}

@include respond-md {
    .metric-view {
        flex-direction: column;
    }
}

.left-panel {
    width: 340px;
    min-width: 280px;
    flex: 0 1 auto;
    display: flex;
    flex-direction: column;
    background: #fafafa;
    border-radius: 8px;
    padding: 12px;
    border: 1px solid #ebeef5;
}

@include respond-md {
    .left-panel {
        width: 100%;
        min-width: 0;
        max-height: 40vh;
    }
}

.right-panel {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    overflow-y: auto;
}

.right-panel :deep(.el-table) {
    min-width: 600px;
}

.mini-task {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: #fff;
    border-radius: 4px;
    margin-bottom: 4px;
    border: 1px solid #ebeef5;
}

.log-box {
    flex: 1;
    overflow-y: auto;
    background: #1e1e1e;
    border-radius: 6px;
    padding: 10px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.7;
    color: #d4d4d4;
    min-height: 200px;
}

.log-line {
    display: flex;
    gap: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.log-time {
    color: #6a9955;
    flex-shrink: 0;
}

.log-msg {
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
