<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
    fetchAutoTradeConfigs,
    createAutoTradeConfig,
    fetchAutoTradeConfigDetail,
    updateAutoTradeConfig,
    deleteAutoTradeConfig,
    toggleAutoTradeConfig,
    resumeAutoTradeConfig,
    fetchAutoTradeBindings,
    addAutoTradeBinding,
    updateAutoTradeBinding,
    deleteAutoTradeBinding,
    fetchStrategyTemplates,
    fetchRiskStatus,
    fetchCircuitEvents,
} from '@/utils/investapi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// ── 常量 ──
const tradeTypes = [
    { value: 1, label: '模拟盘' },
    { value: 2, label: '实盘' },
]

// ── 配置列表 ──
const configs = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalItems = ref(0)
const filterTradeType = ref<number | ''>('')

// ── 编辑器 ──
const editorVisible = ref(false)
const editorTitle = ref('新建自动交易配置')
const editingId = ref<number | null>(null)
const saving = ref(false)

const defaultForm = () => ({
    name: '',
    description: '',
    trade_type_id: 1,
    capital_limit: 0,
    max_drawdown_pct: 20.0,
    daily_loss_limit: 500.0,
    consecutive_loss_limit: 5,
    max_position_pct: 30.0,
    total_position_limit: 80.0,
    auto_resume_minutes: 0,
    cooldown_capital_pct: 50.0,
    cooldown_minutes: 30,
})
const formData = ref<any>(defaultForm())

// ── 策略绑定 ──
const bindingVisible = ref(false)
const bindingConfigId = ref<number | null>(null)
const bindingConfigName = ref('')
const bindings = ref<any[]>([])
const allTemplates = ref<any[]>([])
const templateMap = ref<Record<number, string>>({})
const newBinding = ref({ template_id: null as number | null, weight: 1.0, priority: 100 })

// ── T-0513: 风控指标弹窗 ──
const riskDialogVisible = ref(false)
const riskData = ref<any>(null)
const riskLoading = ref(false)

// ── T-0513: 熔断事件弹窗 ──
const eventsDialogVisible = ref(false)
const eventsConfigId = ref<number | null>(null)
const events = ref<any[]>([])
const eventsTotal = ref(0)
const eventsPage = ref(1)
const eventsLoading = ref(false)

// ── 辅助 ──
const tradeTypeLabel = (id: number) => {
    const t = tradeTypes.find(x => x.value === id)
    return t?.label || String(id)
}

const riskStatusTag = (row: any) => {
    if (row.paused_reason) return { label: '已暂停', type: 'danger' }
    if (row.enabled) return { label: '正常', type: 'success' }
    return { label: '未启用', type: 'info' }
}

const bindingCount = (row: any) => {
    return row.strategy_bindings?.length || 0
}

const progressColor = (pct: number) => {
    if (pct >= 80) return '#F56C6C'
    if (pct >= 50) return '#E6A23C'
    return '#67C23A'
}

const eventTypeTag = (type: string) => {
    const map: Record<string, { label: string; type: string }> = {
        pause: { label: '暂停', type: 'danger' },
        resume: { label: '恢复', type: 'success' },
        auto_resume: { label: '自动恢复', type: 'warning' },
        warning: { label: '预警', type: 'info' },
    }
    return map[type] || { label: type, type: 'info' }
}

// ── 加载列表 ──
const loadConfigs = async () => {
    try {
        const params: any = { page: currentPage.value, pageSize: pageSize.value }
        if (filterTradeType.value !== '') params.trade_type_id = filterTradeType.value
        const res = await fetchAutoTradeConfigs(params)
        configs.value = res.data.data || []
        totalItems.value = res.data.total || 0
    } catch {
        ElMessage.error('加载自动交易配置失败')
    }
}

// ── 搜索 ──
const handleSearch = () => {
    currentPage.value = 1
    loadConfigs()
}

// ── 创建 ──
const openCreate = () => {
    editingId.value = null
    editorTitle.value = '新建自动交易配置'
    formData.value = defaultForm()
    editorVisible.value = true
}

// ── 编辑 ──
const openEdit = async (row: any) => {
    try {
        const res = await fetchAutoTradeConfigDetail(row.id)
        const d = res.data
        editingId.value = d.id
        editorTitle.value = `编辑: ${d.name}`
        formData.value = {
            name: d.name,
            description: d.description || '',
            trade_type_id: d.trade_type_id,
            capital_limit: d.capital_limit ?? 0,
            max_drawdown_pct: d.max_drawdown_pct ?? 20,
            daily_loss_limit: d.daily_loss_limit ?? 500,
            consecutive_loss_limit: d.consecutive_loss_limit ?? 5,
            max_position_pct: d.max_position_pct ?? 30,
            total_position_limit: d.total_position_limit ?? 80,
            auto_resume_minutes: d.auto_resume_minutes ?? 0,
            cooldown_capital_pct: d.cooldown_capital_pct ?? 50,
            cooldown_minutes: d.cooldown_minutes ?? 30,
        }
        editorVisible.value = true
    } catch {
        ElMessage.error('加载配置详情失败')
    }
}

// ── 保存 ──
const handleSave = async () => {
    if (!formData.value.name) {
        ElMessage.warning('请输入配置名称')
        return
    }
    saving.value = true
    try {
        if (editingId.value) {
            const { trade_type_id, ...payload } = formData.value
            await updateAutoTradeConfig(editingId.value, payload)
            ElMessage.success('配置已更新')
        } else {
            await createAutoTradeConfig(formData.value)
            ElMessage.success('配置已创建')
        }
        editorVisible.value = false
        loadConfigs()
    } catch (e: any) {
        ElMessage.error(e.response?.data?.error || '保存失败')
    } finally {
        saving.value = false
    }
}

// ── 删除 ──
const handleDelete = async (id: number) => {
    try {
        await ElMessageBox.confirm('确定删除此自动交易配置？关联的策略绑定将一并删除。', '删除确认', { type: 'warning' })
        await deleteAutoTradeConfig(id)
        ElMessage.success('已删除')
        loadConfigs()
    } catch {}
}

// ── 启停切换 ──
const handleToggle = async (row: any) => {
    try {
        await toggleAutoTradeConfig(row.id, row.enabled)
        ElMessage.success(row.enabled ? '已启用' : '已停用')
    } catch (e: any) {
        row.enabled = !row.enabled
        ElMessage.error(e.response?.data?.error || '切换失败')
    }
}

// ── 恢复风控暂停 ──
const handleResume = async (row: any) => {
    try {
        await ElMessageBox.confirm(`确定恢复配置「${row.name}」？将清除风控暂停状态。`, '恢复确认', { type: 'warning' })
        await resumeAutoTradeConfig(row.id)
        ElMessage.success('风控暂停已清除')
        loadConfigs()
    } catch {}
}

// ── 策略绑定弹窗 ──
const openBindings = async (row: any) => {
    bindingConfigId.value = row.id
    bindingConfigName.value = row.name
    newBinding.value = { template_id: null, weight: 1.0, priority: 100 }
    try {
        const [bRes, tRes] = await Promise.all([
            fetchAutoTradeBindings(row.id),
            fetchStrategyTemplates({ page: 1, pageSize: 200 }),
        ])
        bindings.value = bRes.data.data || []
        allTemplates.value = tRes.data.data || []
        const map: Record<number, string> = {}
        for (const t of allTemplates.value) map[t.id] = t.name
        templateMap.value = map
        bindingVisible.value = true
    } catch {
        ElMessage.error('加载绑定数据失败')
    }
}

const templateName = (id: number) => templateMap.value[id] || `模板#${id}`

const handleBind = async () => {
    if (!newBinding.value.template_id || !bindingConfigId.value) return
    try {
        await addAutoTradeBinding(bindingConfigId.value, {
            template_id: newBinding.value.template_id,
            weight: newBinding.value.weight,
            priority: newBinding.value.priority,
        })
        ElMessage.success('绑定成功')
        newBinding.value = { template_id: null, weight: 1.0, priority: 100 }
        const res = await fetchAutoTradeBindings(bindingConfigId.value)
        bindings.value = res.data.data || []
        loadConfigs()
    } catch (e: any) {
        ElMessage.error(e.response?.data?.error || '绑定失败')
    }
}

const handleUpdateBinding = async (row: any) => {
    if (!bindingConfigId.value) return
    try {
        await updateAutoTradeBinding(bindingConfigId.value, row.id, {
            weight: row.weight,
            enabled: row.enabled,
            priority: row.priority,
        })
        ElMessage.success('绑定已更新')
    } catch (e: any) {
        ElMessage.error(e.response?.data?.error || '更新失败')
    }
}

const handleUnbind = async (bindingId: number) => {
    if (!bindingConfigId.value) return
    try {
        await ElMessageBox.confirm('确定解绑此策略？', '解绑确认', { type: 'warning' })
        await deleteAutoTradeBinding(bindingConfigId.value, bindingId)
        ElMessage.success('已解绑')
        const res = await fetchAutoTradeBindings(bindingConfigId.value)
        bindings.value = res.data.data || []
        loadConfigs()
    } catch {}
}

// ── T-0513: 风控指标 ──
const openRiskStatus = async (row: any) => {
    riskLoading.value = true
    riskData.value = null
    riskDialogVisible.value = true
    try {
        const res = await fetchRiskStatus(row.id)
        riskData.value = res.data
    } catch {
        ElMessage.error('加载风控指标失败')
    } finally {
        riskLoading.value = false
    }
}

// ── T-0513: 熔断事件 ──
const openCircuitEvents = async (row: any) => {
    eventsConfigId.value = row.id
    eventsPage.value = 1
    eventsDialogVisible.value = true
    await loadEvents()
}

const loadEvents = async () => {
    if (!eventsConfigId.value) return
    eventsLoading.value = true
    try {
        const res = await fetchCircuitEvents(eventsConfigId.value, {
            page: eventsPage.value,
            pageSize: 10,
        })
        events.value = res.data.data || []
        eventsTotal.value = res.data.total || 0
    } catch {
        ElMessage.error('加载熔断事件失败')
    } finally {
        eventsLoading.value = false
    }
}

onMounted(() => {
    loadConfigs()
})
</script>

<template>
    <div style="padding: 12px;">
        <!-- 工具栏 -->
        <el-card shadow="never" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <el-select v-model="filterTradeType" placeholder="交易类型" clearable style="width: 140px;"
                               @change="handleSearch">
                        <el-option v-for="t in tradeTypes" :key="t.value" :label="t.label" :value="t.value" />
                    </el-select>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                </div>
                <el-button type="success" @click="openCreate" :icon="Plus">新建配置</el-button>
            </div>
        </el-card>

        <!-- 配置列表 -->
        <el-card shadow="never">
            <el-table :data="configs" stripe border size="default">
                <el-table-column prop="name" label="名称" min-width="130" />
                <el-table-column label="类型" width="85" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.trade_type_id === 1 ? 'warning' : 'danger'" size="small">
                            {{ tradeTypeLabel(row.trade_type_id) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="资金上限" width="100" align="right">
                    <template #default="{ row }">
                        {{ row.capital_limit?.toLocaleString() || '0' }}
                    </template>
                </el-table-column>
                <el-table-column label="单币仓位%" width="95" align="center">
                    <template #default="{ row }">{{ row.max_position_pct }}%</template>
                </el-table-column>
                <el-table-column label="总仓位%" width="85" align="center">
                    <template #default="{ row }">{{ row.total_position_limit }}%</template>
                </el-table-column>
                <el-table-column label="最大回撤%" width="95" align="center">
                    <template #default="{ row }">{{ row.max_drawdown_pct }}%</template>
                </el-table-column>
                <el-table-column label="日亏上限" width="90" align="right">
                    <template #default="{ row }">{{ row.daily_loss_limit }}</template>
                </el-table-column>
                <el-table-column label="启用" width="70" align="center">
                    <template #default="{ row }">
                        <el-switch v-model="row.enabled" size="small" @change="handleToggle(row)" />
                    </template>
                </el-table-column>
                <el-table-column label="风控状态" width="90" align="center">
                    <template #default="{ row }">
                        <el-tag :type="riskStatusTag(row).type" size="small">
                            {{ riskStatusTag(row).label }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="策略数" width="70" align="center">
                    <template #default="{ row }">{{ bindingCount(row) }}</template>
                </el-table-column>
                <el-table-column prop="updated_at" label="更新时间" width="155" />
                <el-table-column label="操作" width="330" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
                        <el-button size="small" @click="openBindings(row)">策略</el-button>
                        <el-button size="small" type="info" @click="openRiskStatus(row)">风控</el-button>
                        <el-button size="small" @click="openCircuitEvents(row)">事件</el-button>
                        <el-button v-if="row.paused_reason" size="small" type="warning" @click="handleResume(row)">恢复</el-button>
                        <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
                <el-pagination background layout="total, prev, pager, next" :total="totalItems"
                    v-model:current-page="currentPage" v-model:page-size="pageSize"
                    @current-change="loadConfigs" />
            </div>
        </el-card>

        <!-- ======== 编辑弹窗 ======== -->
        <el-dialog v-model="editorVisible" :title="editorTitle" width="700px" top="5vh" destroy-on-close>
            <el-form label-width="120px" size="default">
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="配置名称" required>
                            <el-input v-model="formData.name" placeholder="如: 模拟盘自动交易" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="交易类型">
                            <el-select v-model="formData.trade_type_id" style="width: 100%;" :disabled="!!editingId">
                                <el-option v-for="t in tradeTypes" :key="t.value" :label="t.label" :value="t.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="描述">
                    <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="配置说明（可选）" />
                </el-form-item>

                <el-divider content-position="left">风控参数</el-divider>

                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="资金上限">
                            <el-input-number v-model="formData.capital_limit" :min="0" :step="1000" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="最大回撤%">
                            <el-input-number v-model="formData.max_drawdown_pct" :min="0.1" :max="100" :step="1" :precision="1" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="日亏损上限">
                            <el-input-number v-model="formData.daily_loss_limit" :min="0" :max="1000000" :step="100" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="连亏次数上限">
                            <el-input-number v-model="formData.consecutive_loss_limit" :min="1" :max="100" :step="1" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item label="单币仓位上限%">
                            <el-input-number v-model="formData.max_position_pct" :min="1" :max="100" :step="5" :precision="1" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="总仓位上限%">
                            <el-input-number v-model="formData.total_position_limit" :min="1" :max="100" :step="5" :precision="1" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-divider content-position="left">自动恢复</el-divider>

                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-form-item label="自动恢复(分钟)">
                            <el-input-number v-model="formData.auto_resume_minutes"
                                :min="0" :max="1440" :step="15" style="width: 100%;" />
                            <div style="font-size: 11px; color: #999;">0=仅手动恢复</div>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="冷却资金%">
                            <el-input-number v-model="formData.cooldown_capital_pct"
                                :min="10" :max="100" :step="10" :precision="0" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="冷却时间(分钟)">
                            <el-input-number v-model="formData.cooldown_minutes"
                                :min="0" :max="1440" :step="15" style="width: 100%;" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <template #footer>
                <el-button @click="editorVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
            </template>
        </el-dialog>

        <!-- ======== 策略绑定弹窗 ======== -->
        <el-dialog v-model="bindingVisible" :title="'策略绑定 - ' + bindingConfigName" width="650px" destroy-on-close>
            <el-table :data="bindings" border size="small" style="margin-bottom: 16px;">
                <el-table-column label="策略模板" min-width="130">
                    <template #default="{ row }">{{ templateName(row.template_id) }}</template>
                </el-table-column>
                <el-table-column label="权重" width="100" align="center">
                    <template #default="{ row }">
                        <el-input-number v-model="row.weight" :min="0" :max="10" :step="0.1" :precision="1"
                                         size="small" controls-position="right" style="width: 80px;"
                                         @change="handleUpdateBinding(row)" />
                    </template>
                </el-table-column>
                <el-table-column label="优先级" width="100" align="center">
                    <template #default="{ row }">
                        <el-input-number v-model="row.priority" :min="1" :max="999" :step="1"
                                         size="small" controls-position="right" style="width: 80px;"
                                         @change="handleUpdateBinding(row)" />
                    </template>
                </el-table-column>
                <el-table-column label="启用" width="65" align="center">
                    <template #default="{ row }">
                        <el-switch v-model="row.enabled" size="small" @change="handleUpdateBinding(row)" />
                    </template>
                </el-table-column>
                <el-table-column label="" width="70" align="center">
                    <template #default="{ row }">
                        <el-button size="small" type="danger" @click="handleUnbind(row.id)">解绑</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div style="display: flex; gap: 8px; align-items: center;">
                <el-select v-model="newBinding.template_id" placeholder="选择策略模板" filterable style="flex: 1;">
                    <el-option v-for="t in allTemplates" :key="t.id" :label="t.name" :value="t.id" />
                </el-select>
                <el-input-number v-model="newBinding.weight" :min="0" :max="10" :step="0.1" :precision="1"
                                 placeholder="权重" style="width: 90px;" size="default" />
                <el-input-number v-model="newBinding.priority" :min="1" :max="999" :step="1"
                                 placeholder="优先级" style="width: 90px;" size="default" />
                <el-button type="primary" @click="handleBind" :disabled="!newBinding.template_id">绑定</el-button>
            </div>
        </el-dialog>

        <!-- ======== T-0513: 风控指标弹窗 ======== -->
        <el-dialog v-model="riskDialogVisible" title="风控实时指标" width="600px" destroy-on-close>
            <div v-loading="riskLoading">
                <template v-if="riskData">
                    <el-descriptions :column="2" border size="small" style="margin-bottom: 16px;">
                        <el-descriptions-item label="权益">${{ riskData.metrics?.equity?.toLocaleString() }}</el-descriptions-item>
                        <el-descriptions-item label="状态">
                            <el-tag :type="riskData.paused ? 'danger' : 'success'" size="small">
                                {{ riskData.paused ? '已暂停' : '正常' }}
                            </el-tag>
                            <el-tag v-if="riskData.cooldown_active" type="warning" size="small" style="margin-left:4px">冷却中</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="现金">${{ riskData.metrics?.cash?.toLocaleString() }}</el-descriptions-item>
                        <el-descriptions-item label="持仓市值">${{ riskData.metrics?.position_value?.toLocaleString() }}</el-descriptions-item>
                    </el-descriptions>

                    <div v-for="item in [
                        { label: '总仓位', key: 'total_position', value: riskData.metrics?.total_position_pct + '%', limit: riskData.limits?.total_position_limit + '%' },
                        { label: '日亏损', key: 'daily_loss', value: '$' + riskData.metrics?.daily_loss, limit: '$' + riskData.limits?.daily_loss_limit },
                        { label: '回撤', key: 'drawdown', value: riskData.metrics?.drawdown_pct + '%', limit: riskData.limits?.max_drawdown_pct + '%' },
                        { label: '连亏', key: 'consecutive_losses', value: riskData.metrics?.consecutive_losses + '笔', limit: riskData.limits?.consecutive_loss_limit + '笔' },
                    ]" :key="item.key" style="margin-bottom: 12px;">
                        <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px;">
                            <span>{{ item.label }}: {{ item.value }}</span>
                            <span style="color:#999;">上限: {{ item.limit }} ({{ riskData.proximity?.[item.key] }}%)</span>
                        </div>
                        <el-progress
                            :percentage="riskData.proximity?.[item.key] || 0"
                            :color="progressColor(riskData.proximity?.[item.key] || 0)"
                            :stroke-width="10"
                        />
                    </div>

                    <el-divider content-position="left">持仓分布</el-divider>
                    <el-table :data="riskData.metrics?.coin_positions || []" border size="small" max-height="200">
                        <el-table-column prop="coin_id" label="Coin ID" width="80" />
                        <el-table-column label="市值" align="right">
                            <template #default="{ row }">{{ row.value?.toLocaleString() }}</template>
                        </el-table-column>
                        <el-table-column label="占比" width="80" align="center">
                            <template #default="{ row }">{{ row.pct }}%</template>
                        </el-table-column>
                    </el-table>
                </template>
                <el-empty v-else-if="!riskLoading" description="无数据" />
            </div>
        </el-dialog>

        <!-- ======== T-0513: 熔断事件弹窗 ======== -->
        <el-dialog v-model="eventsDialogVisible" title="熔断事件历史" width="750px" destroy-on-close>
            <el-table :data="events" border size="small" v-loading="eventsLoading">
                <el-table-column prop="created_at" label="时间" width="155" />
                <el-table-column label="类型" width="90" align="center">
                    <template #default="{ row }">
                        <el-tag :type="eventTypeTag(row.event_type).type" size="small">
                            {{ eventTypeTag(row.event_type).label }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="triggered_rule" label="触发规则" width="110" />
                <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
                <el-table-column label="权益" width="90" align="right">
                    <template #default="{ row }">{{ row.equity?.toLocaleString() || '-' }}</template>
                </el-table-column>
                <el-table-column label="回撤%" width="70" align="center">
                    <template #default="{ row }">{{ row.drawdown_pct ?? '-' }}</template>
                </el-table-column>
            </el-table>
            <div style="display:flex; justify-content:flex-end; margin-top:12px;">
                <el-pagination background layout="total, prev, pager, next"
                    :total="eventsTotal" v-model:current-page="eventsPage"
                    :page-size="10" @current-change="loadEvents" />
            </div>
        </el-dialog>
    </div>
</template>
