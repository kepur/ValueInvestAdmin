<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import {
    fetchTradeWindows,
    createTradeWindow,
    fetchTradeWindowDetail,
    updateTradeWindow,
    deleteTradeWindow,
    checkTradeWindowConflict,
    fetchRouteDecision,
    fetchWindowBindings,
    bindTemplateToWindow,
    unbindTemplateFromWindow,
    fetchStrategyTemplates,
} from '@/utils/investapi'
import { connectTaskLogWS, triggerWindowSchedule, type TaskLogMessage } from '@/utils/tasklogapi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Timer, VideoPlay, VideoPause } from '@element-plus/icons-vue'

// ── 常量 ──
const windowTypes = [
    { value: 'high_frequency', label: '高频交易', type: 'danger' },
    { value: 'watch', label: '观望监控', type: 'warning' },
    { value: 'no_trade', label: '禁止交易', type: 'info' },
]
const behaviors = [
    { value: 'aggressive', label: '激进' },
    { value: 'normal', label: '标准' },
    { value: 'conservative', label: '保守' },
    { value: 'pause', label: '暂停' },
]
const weekdayLabels: Record<number, string> = {
    1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '日'
}

// ── 窗口列表 ──
const windows = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalItems = ref(0)
const searchKeyword = ref('')
const filterType = ref('')

// ── 路由决策 ──
const routeDecision = ref<any>(null)

// ── 编辑器 ──
const editorVisible = ref(false)
const editorTitle = ref('新建交易窗口')
const editingId = ref<number | null>(null)
const saving = ref(false)
const conflictList = ref<any[]>([])

const formData = ref<any>({
    name: '',
    description: '',
    timezone: 'Asia/Shanghai',
    time_start: '09:00',
    time_end: '18:00',
    window_type: 'watch',
    priority: 100,
    enabled: true,
    weekdays: [1, 2, 3, 4, 5],
    start_date: null,
    end_date: null,
    cycle_strategy_id: null,
    strategy_template_id: null,
    event_id: null,
    stages: [],
})

// ── 策略绑定 ──
const bindingVisible = ref(false)
const bindingWindowId = ref<number | null>(null)
const bindingWindowName = ref('')
const bindings = ref<any[]>([])
const allTemplates = ref<any[]>([])
const newBindingTemplateId = ref<number | null>(null)
const newBindingPriority = ref<number | undefined>(undefined)

// ── 辅助方法 ──
const windowTypeTag = (type: string) => {
    const t = windowTypes.find(w => w.value === type)
    return t || { label: type, type: '' }
}

const behaviorLabel = (b: string) => {
    const item = behaviors.find(x => x.value === b)
    return item?.label || b
}

const weekdaysText = (days: number[] | null) => {
    if (!days || !days.length) return '每天'
    return days.map(d => '周' + (weekdayLabels[d] || d)).join(' ')
}

const defaultStage = () => ({
    name: '',
    time_start: '09:00',
    time_end: '10:00',
    behavior: 'normal',
    intensity_factor: 1.0,
    sort_order: 0,
})

// ── 加载列表 ──
const loadWindows = async () => {
    try {
        const res = await fetchTradeWindows({
            page: currentPage.value,
            pageSize: pageSize.value,
            search: searchKeyword.value || undefined,
            window_type: filterType.value || undefined,
        })
        windows.value = res.data.data || []
        totalItems.value = res.data.total || 0
    } catch (e) {
        ElMessage.error('加载交易窗口失败')
    }
}

// ── 加载路由决策 ──
const loadRouteDecision = async () => {
    try {
        const res = await fetchRouteDecision('top')
        routeDecision.value = res.data.data
    } catch {}
}

// ── 搜索 ──
const handleSearch = () => {
    currentPage.value = 1
    loadWindows()
}

// ── 编辑器操作 ──
const openCreate = () => {
    editingId.value = null
    editorTitle.value = '新建交易窗口'
    conflictList.value = []
    formData.value = {
        name: '',
        description: '',
        timezone: 'Asia/Shanghai',
        time_start: '09:00',
        time_end: '18:00',
        window_type: 'watch',
        priority: 100,
        enabled: true,
        weekdays: [1, 2, 3, 4, 5],
        start_date: null,
        end_date: null,
        cycle_strategy_id: null,
        strategy_template_id: null,
        event_id: null,
        stages: [],
    }
    editorVisible.value = true
}

const openEdit = async (id: number) => {
    try {
        const res = await fetchTradeWindowDetail(id)
        const data = res.data.data
        editingId.value = id
        editorTitle.value = `编辑: ${data.name}`
        conflictList.value = []
        formData.value = {
            name: data.name,
            description: data.description || '',
            timezone: data.timezone,
            time_start: data.time_start,
            time_end: data.time_end,
            window_type: data.window_type,
            priority: data.priority,
            enabled: data.enabled,
            weekdays: data.weekdays || [],
            start_date: data.start_date,
            end_date: data.end_date,
            cycle_strategy_id: data.cycle_strategy_id,
            strategy_template_id: data.strategy_template_id,
            event_id: data.event_id,
            stages: data.stages || [],
        }
        editorVisible.value = true
    } catch (e) {
        ElMessage.error('加载窗口详情失败')
    }
}

// ── 阶段操作 ──
const addStage = () => {
    formData.value.stages.push({
        ...defaultStage(),
        sort_order: formData.value.stages.length,
    })
}

const removeStage = (idx: number) => {
    formData.value.stages.splice(idx, 1)
}

// ── 冲突检测 ──
const doConflictCheck = async () => {
    try {
        const res = await checkTradeWindowConflict({
            time_start: formData.value.time_start,
            time_end: formData.value.time_end,
            weekdays: formData.value.weekdays?.length ? formData.value.weekdays : undefined,
            exclude_id: editingId.value || undefined,
        })
        conflictList.value = res.data.conflicts || []
        if (!conflictList.value.length) {
            ElMessage.success('无时间冲突')
        }
        return !conflictList.value.length
    } catch (e) {
        ElMessage.error('冲突检测失败')
        return false
    }
}

// ── 保存 ──
const handleSave = async () => {
    if (!formData.value.name) {
        ElMessage.warning('请输入窗口名称')
        return
    }

    saving.value = true
    try {
        if (editingId.value) {
            await updateTradeWindow(editingId.value, formData.value)
            ElMessage.success('交易窗口已更新')
        } else {
            await createTradeWindow(formData.value)
            ElMessage.success('交易窗口已创建')
        }
        editorVisible.value = false
        loadWindows()
        loadRouteDecision()
    } catch (e: any) {
        const resp = e.response?.data
        if (resp?.conflicts) {
            conflictList.value = resp.conflicts
            ElMessage.warning('检测到时间窗口冲突')
        } else {
            const detail = resp?.details || resp?.error || '保存失败'
            ElMessage.error(Array.isArray(detail) ? detail.join('; ') : String(detail))
        }
    } finally {
        saving.value = false
    }
}

// ── 删除 ──
const handleDelete = async (id: number) => {
    try {
        await ElMessageBox.confirm('确定删除此交易窗口？关联的阶段和策略绑定将一并删除。', '删除确认', { type: 'warning' })
        await deleteTradeWindow(id)
        ElMessage.success('已删除')
        loadWindows()
        loadRouteDecision()
    } catch {}
}

// ── 切换启用 ──
const toggleEnabled = async (row: any) => {
    try {
        await updateTradeWindow(row.id, { enabled: row.enabled })
        ElMessage.success(row.enabled ? '已启用' : '已停用')
        loadRouteDecision()
    } catch (e) {
        row.enabled = !row.enabled
        ElMessage.error('更新失败')
    }
}

// ── 策略绑定 ──
const openBindings = async (row: any) => {
    bindingWindowId.value = row.id
    bindingWindowName.value = row.name
    newBindingTemplateId.value = null
    newBindingPriority.value = undefined
    try {
        const [bRes, tRes] = await Promise.all([
            fetchWindowBindings(row.id),
            fetchStrategyTemplates({ page: 1, pageSize: 100 }),
        ])
        bindings.value = bRes.data.data || []
        allTemplates.value = tRes.data.data || []
        bindingVisible.value = true
    } catch (e) {
        ElMessage.error('加载绑定数据失败')
    }
}

const handleBind = async () => {
    if (!newBindingTemplateId.value || !bindingWindowId.value) return
    try {
        await bindTemplateToWindow(bindingWindowId.value, {
            template_id: newBindingTemplateId.value,
            priority_override: newBindingPriority.value,
        })
        ElMessage.success('绑定成功')
        newBindingTemplateId.value = null
        newBindingPriority.value = undefined
        const res = await fetchWindowBindings(bindingWindowId.value)
        bindings.value = res.data.data || []
    } catch (e: any) {
        ElMessage.error(e.response?.data?.error || '绑定失败')
    }
}

const handleUnbind = async (templateId: number) => {
    if (!bindingWindowId.value) return
    try {
        await ElMessageBox.confirm('确定解绑此策略？', '解绑确认', { type: 'warning' })
        await unbindTemplateFromWindow(bindingWindowId.value, templateId)
        ElMessage.success('已解绑')
        const res = await fetchWindowBindings(bindingWindowId.value)
        bindings.value = res.data.data || []
    } catch {}
}

// ── 时序分段执行实时日志 (T-0421) ──
const wsConnected = ref(false)
const wsInstance = ref<WebSocket | null>(null)
const segmentLogs = ref<TaskLogMessage[]>([])
const segmentLogContainer = ref<HTMLElement | null>(null)
const triggeringWindow = ref(false)

const currentWindowTaskId = ref<string | null>(null)

const connectSegmentWS = () => {
    if (wsInstance.value) wsInstance.value.close()
    wsInstance.value = connectTaskLogWS(
        null,
        (msg: TaskLogMessage) => {
            if (msg.type === 'task_started' && msg.task_type === 'window_schedule') {
                currentWindowTaskId.value = msg.task_id || null
                segmentLogs.value = []
            }
            const isOurTask = msg.task_id && msg.task_id === currentWindowTaskId.value
            if (isOurTask && (msg.type === 'task_log' || msg.type === 'task_finished')) {
                segmentLogs.value.push(msg)
                scrollSegmentLogToBottom()
            }
        },
        () => { wsConnected.value = false },
    )
    wsInstance.value.onopen = () => { wsConnected.value = true }
}

const scrollSegmentLogToBottom = () => {
    nextTick(() => {
        if (segmentLogContainer.value) segmentLogContainer.value.scrollTop = segmentLogContainer.value.scrollHeight
    })
}

const levelColor = (level: string) => {
    const map: Record<string, string> = { info: '#409eff', warning: '#e6a23c', error: '#f56c6c', debug: '#909399' }
    return map[level || 'info'] || '#606266'
}

const formatLogTime = (ts: string) => {
    if (!ts) return ''
    try {
        return new Date(ts).toLocaleTimeString('zh-CN', { hour12: false })
    } catch { return ts }
}

const handleTriggerWindowCheck = async () => {
    try {
        await ElMessageBox.confirm('确定手动触发一次窗口调度检查？', '触发窗口检查', { type: 'info' })
        triggeringWindow.value = true
        const res = await triggerWindowSchedule()
        ElMessage.success(res.data?.message || '窗口调度检查已触发')
    } catch (e: any) {
        if (e !== 'cancel') ElMessage.error(e.response?.data?.detail || '触发失败')
    } finally {
        triggeringWindow.value = false
    }
}

// ── 跨日判断 ──
const isCrossDay = computed(() => formData.value.time_start > formData.value.time_end)

// ── 决策状态颜色 ──
const directiveColor = (d: string) => {
    const map: Record<string, string> = { trade: '#67c23a', watch: '#e6a23c', no_trade: '#f56c6c', idle: '#909399' }
    return map[d] || '#909399'
}
const directiveLabel = (d: string) => {
    const map: Record<string, string> = { trade: '可交易', watch: '观望中', no_trade: '禁交易', idle: '空闲' }
    return map[d] || d
}

onMounted(() => {
    loadWindows()
    loadRouteDecision()
    connectSegmentWS()
})

onBeforeUnmount(() => {
    wsInstance.value?.close()
})
</script>

<template>
    <div class="time-segment-view" style="padding: 12px;">
        <!-- 路由决策状态卡片 -->
        <el-card shadow="never" style="margin-bottom: 12px;">
            <template #header>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <el-icon :size="18"><Timer /></el-icon>
                    <span style="font-weight: 600;">当前路由决策</span>
                    <el-button size="small" text @click="loadRouteDecision">刷新</el-button>
                </div>
            </template>
            <div v-if="routeDecision" style="display: flex; gap: 24px; align-items: center; flex-wrap: wrap;">
                <div>
                    <span style="color: #999; font-size: 12px;">交易指令</span>
                    <div style="font-size: 20px; font-weight: 700;"
                         :style="{ color: directiveColor(routeDecision.effective_directive) }">
                        {{ directiveLabel(routeDecision.effective_directive) }}
                    </div>
                </div>
                <div v-if="routeDecision.window">
                    <span style="color: #999; font-size: 12px;">活跃窗口</span>
                    <div style="font-size: 14px;">
                        {{ routeDecision.window.name }}
                        <el-tag size="small" :type="windowTypeTag(routeDecision.window.window_type).type" style="margin-left: 4px;">
                            {{ windowTypeTag(routeDecision.window.window_type).label }}
                        </el-tag>
                    </div>
                </div>
                <div v-if="routeDecision.stage">
                    <span style="color: #999; font-size: 12px;">当前阶段</span>
                    <div style="font-size: 14px;">
                        {{ routeDecision.stage.name }}
                        <span style="color: #999; margin-left: 4px;">
                            ({{ behaviorLabel(routeDecision.stage.behavior) }} x{{ routeDecision.stage.intensity_factor }})
                        </span>
                    </div>
                </div>
                <div v-if="routeDecision.strategies?.length">
                    <span style="color: #999; font-size: 12px;">绑定策略</span>
                    <div style="font-size: 14px;">
                        <el-tag v-for="s in routeDecision.strategies" :key="s.template_id"
                                size="small" style="margin-right: 4px;">
                            {{ s.template_name }}
                        </el-tag>
                    </div>
                </div>
            </div>
            <div v-else style="color: #ccc;">加载中...</div>
        </el-card>

        <!-- 时序分段执行实时日志 (T-0421) -->
        <el-card shadow="never" style="margin-bottom: 12px;">
            <template #header>
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 600;">时序分段执行实时日志</span>
                        <span :style="{ color: wsConnected ? '#67c23a' : '#f56c6c', fontSize: '12px' }">● {{ wsConnected ? 'WS已连接' : 'WS未连接' }}</span>
                        <el-button v-if="!wsConnected" size="small" @click="connectSegmentWS">重连</el-button>
                    </div>
                    <el-button size="small" type="primary" :loading="triggeringWindow" @click="handleTriggerWindowCheck">
                        手动触发窗口检查
                    </el-button>
                </div>
            </template>
            <div ref="segmentLogContainer" class="segment-log-container">
                <div v-for="(log, idx) in segmentLogs" :key="idx" class="segment-log-line">
                    <span class="log-time">{{ formatLogTime(log.timestamp) }}</span>
                    <span class="log-level" :style="{ color: levelColor(log.level || 'info') }">[{{ (log.level || 'info').toUpperCase() }}]</span>
                    <span v-if="log.stage" class="log-stage">{{ log.stage }}</span>
                    <span class="log-msg">{{ log.message || (log.type === 'task_finished' ? `任务${log.status || '完成'}` : '') }}</span>
                </div>
                <div v-if="!segmentLogs.length" style="text-align: center; color: #999; padding: 24px;">等待窗口调度日志… 可点击「手动触发窗口检查」或等待定时任务</div>
            </div>
        </el-card>

        <!-- 工具栏 -->
        <el-card shadow="never" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <el-input v-model="searchKeyword" placeholder="搜索窗口名称" clearable style="width: 180px;"
                              @keyup.enter="handleSearch" />
                    <el-select v-model="filterType" placeholder="窗口类型" clearable style="width: 140px;"
                               @change="handleSearch">
                        <el-option v-for="t in windowTypes" :key="t.value" :label="t.label" :value="t.value" />
                    </el-select>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                </div>
                <el-button type="success" @click="openCreate" :icon="Plus">新建窗口</el-button>
            </div>
        </el-card>

        <!-- 窗口列表 -->
        <el-card shadow="never">
            <el-table :data="windows" stripe border size="default">
                <el-table-column prop="priority" label="优先级" width="75" align="center" sortable />
                <el-table-column prop="name" label="窗口名称" min-width="150" />
                <el-table-column label="类型" width="100" align="center">
                    <template #default="{ row }">
                        <el-tag :type="windowTypeTag(row.window_type).type" size="small">
                            {{ windowTypeTag(row.window_type).label }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="时间段" width="130" align="center">
                    <template #default="{ row }">
                        {{ row.time_start }} - {{ row.time_end }}
                        <el-tag v-if="row.is_cross_day" size="small" type="warning" style="margin-left: 2px;">跨日</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="工作日" min-width="150">
                    <template #default="{ row }">
                        {{ weekdaysText(row.weekdays) }}
                    </template>
                </el-table-column>
                <el-table-column label="阶段数" width="75" align="center">
                    <template #default="{ row }">
                        {{ row.stages?.length || 0 }}
                    </template>
                </el-table-column>
                <el-table-column label="启用" width="70" align="center">
                    <template #default="{ row }">
                        <el-switch v-model="row.enabled" size="small" @change="toggleEnabled(row)" />
                    </template>
                </el-table-column>
                <el-table-column prop="updated_at" label="更新时间" width="155" />
                <el-table-column label="操作" width="210" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" @click="openEdit(row.id)">编辑</el-button>
                        <el-button size="small" @click="openBindings(row)">策略</el-button>
                        <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
                <el-pagination background layout="total, prev, pager, next" :total="totalItems"
                    v-model:current-page="currentPage" v-model:page-size="pageSize"
                    @current-change="loadWindows" />
            </div>
        </el-card>

        <!-- ======== 编辑器弹窗 ======== -->
        <el-dialog v-model="editorVisible" :title="editorTitle" width="800px" top="3vh" destroy-on-close>
            <el-form label-width="90px" size="default">
                <!-- 基本信息 -->
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="窗口名称" required>
                            <el-input v-model="formData.name" placeholder="如: 亚洲早盘高频" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="窗口类型">
                            <el-select v-model="formData.window_type" style="width: 100%;">
                                <el-option v-for="t in windowTypes" :key="t.value" :label="t.label" :value="t.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-form-item label="开始时间">
                            <el-input v-model="formData.time_start" placeholder="HH:MM" maxlength="5" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="结束时间">
                            <el-input v-model="formData.time_end" placeholder="HH:MM" maxlength="5" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="优先级">
                            <el-input-number v-model="formData.priority" :min="1" :max="999" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-alert v-if="isCrossDay" type="warning" :closable="false" style="margin-bottom: 12px;">
                    跨日窗口: {{ formData.time_start }} 至次日 {{ formData.time_end }}
                </el-alert>

                <el-row :gutter="16">
                    <el-col :span="16">
                        <el-form-item label="工作日">
                            <el-checkbox-group v-model="formData.weekdays">
                                <el-checkbox-button v-for="(lbl, day) in weekdayLabels" :key="day" :value="Number(day)">
                                    周{{ lbl }}
                                </el-checkbox-button>
                            </el-checkbox-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="启用">
                            <el-switch v-model="formData.enabled" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="描述">
                    <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="窗口用途描述（可选）" />
                </el-form-item>
            </el-form>

            <!-- 冲突提示 -->
            <el-alert v-if="conflictList.length" type="error" :closable="false" style="margin-bottom: 12px;">
                <template #title>
                    <span>检测到 {{ conflictList.length }} 个时间冲突</span>
                </template>
                <div style="font-size: 12px;">
                    <div v-for="c in conflictList" :key="c.id">
                        [{{ c.name }}] {{ c.time_start }}-{{ c.time_end }} {{ weekdaysText(c.weekdays) }}
                    </div>
                </div>
            </el-alert>

            <!-- 阶段编辑 -->
            <div style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">时间阶段</span>
                <div style="display: flex; gap: 8px;">
                    <el-button size="small" @click="doConflictCheck">冲突检测</el-button>
                    <el-button size="small" type="primary" :icon="Plus" @click="addStage">添加阶段</el-button>
                </div>
            </div>

            <el-table v-if="formData.stages.length" :data="formData.stages" border size="small" style="margin-bottom: 12px;">
                <el-table-column label="阶段名称" min-width="130">
                    <template #default="{ row }">
                        <el-input v-model="row.name" size="small" placeholder="如: 开盘冲击" />
                    </template>
                </el-table-column>
                <el-table-column label="开始" width="100">
                    <template #default="{ row }">
                        <el-input v-model="row.time_start" size="small" maxlength="5" placeholder="HH:MM" />
                    </template>
                </el-table-column>
                <el-table-column label="结束" width="100">
                    <template #default="{ row }">
                        <el-input v-model="row.time_end" size="small" maxlength="5" placeholder="HH:MM" />
                    </template>
                </el-table-column>
                <el-table-column label="行为" width="120">
                    <template #default="{ row }">
                        <el-select v-model="row.behavior" size="small" style="width: 100%;">
                            <el-option v-for="b in behaviors" :key="b.value" :label="b.label" :value="b.value" />
                        </el-select>
                    </template>
                </el-table-column>
                <el-table-column label="强度" width="100">
                    <template #default="{ row }">
                        <el-input-number v-model="row.intensity_factor" :min="0" :step="0.1" :precision="1"
                                         size="small" controls-position="right" style="width: 80px;" />
                    </template>
                </el-table-column>
                <el-table-column label="" width="50" align="center">
                    <template #default="{ $index }">
                        <el-button size="small" type="danger" :icon="Delete" circle @click="removeStage($index)" />
                    </template>
                </el-table-column>
            </el-table>
            <div v-else style="text-align: center; color: #ccc; padding: 20px; border: 1px dashed #dcdfe6; border-radius: 4px; margin-bottom: 12px;">
                暂无阶段，点击「添加阶段」开始配置
            </div>

            <template #footer>
                <el-button @click="editorVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
            </template>
        </el-dialog>

        <!-- ======== 策略绑定弹窗 ======== -->
        <el-dialog v-model="bindingVisible" :title="'策略绑定 - ' + bindingWindowName" width="600px" destroy-on-close>
            <!-- 已绑定列表 -->
            <el-table :data="bindings" border size="small" style="margin-bottom: 16px;">
                <el-table-column prop="template_name" label="策略模板" min-width="150" />
                <el-table-column prop="priority_override" label="优先级覆盖" width="110" align="center">
                    <template #default="{ row }">
                        {{ row.priority_override ?? '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="created_at" label="绑定时间" width="155" />
                <el-table-column label="" width="70" align="center">
                    <template #default="{ row }">
                        <el-button size="small" type="danger" @click="handleUnbind(row.template_id)">解绑</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 新增绑定 -->
            <div style="display: flex; gap: 8px; align-items: center;">
                <el-select v-model="newBindingTemplateId" placeholder="选择策略模板" filterable style="flex: 1;">
                    <el-option v-for="t in allTemplates" :key="t.id" :label="t.name" :value="t.id" />
                </el-select>
                <el-input-number v-model="newBindingPriority" :min="1" placeholder="优先级" style="width: 110px;" size="default" />
                <el-button type="primary" @click="handleBind" :disabled="!newBindingTemplateId">绑定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<style scoped>
.segment-log-container {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.8;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 12px;
    border-radius: 6px;
    max-height: 280px;
    overflow-y: auto;
}
.segment-log-line {
    display: flex;
    gap: 8px;
    flex-wrap: nowrap;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.segment-log-line .log-time { color: #6a9955; flex-shrink: 0; }
.segment-log-line .log-level { font-weight: bold; flex-shrink: 0; }
.segment-log-line .log-stage { color: #dcdcaa; flex-shrink: 0; }
.segment-log-line .log-msg { color: #d4d4d4; overflow: hidden; text-overflow: ellipsis; }
</style>
