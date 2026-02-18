<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
    fetchStrategyTemplates,
    fetchStrategyTemplateDetail,
    createStrategyTemplate,
    updateStrategyTemplate,
    deleteStrategyTemplate,
    validateStrategyTemplate,
    fetchStrategyTemplateVersions,
    rollbackStrategyTemplate,
} from '@/utils/investapi'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()

const goBacktest = (id: number) => {
    router.push({ path: '/index/backtest', query: { template_id: id } })
}

// ── 模板列表 ──
const templates = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const searchKeyword = ref('')

// ── 编辑器 ──
const editorVisible = ref(false)
const editorTitle = ref('新建策略模板')
const editingId = ref<number | null>(null)
const saving = ref(false)
const validationErrors = ref<any[]>([])

const formData = ref<any>({
    name: '',
    description: '',
    is_global: false,
    is_active: true,
    cycles: [],
})

// 默认规则模板
const defaultRule = () => ({
    coin_bucket: '',
    buy_levels: [5, 8, 12],
    stop_loss_pct: 15,
    watch_range_min_pct: 15,
    watch_range_max_pct: 20,
    rebound_targets: [2, 5, 8],
    volatility_factor: 1.0,
    priority: 1,
})

// 默认周期模板
const defaultCycle = () => ({
    name: '',
    days_min: 3,
    days_max: 7,
    sort_order: 0,
    rules: [defaultRule()],
})

// 预设周期
const presetCycles = [
    { name: '短期波动', days_min: 3, days_max: 5 },
    { name: '小波浪', days_min: 5, days_max: 15 },
    { name: '大波浪', days_min: 15, days_max: 60 },
    { name: '史前巨浪', days_min: 60, days_max: 365 },
]

// 预设币种类别
const coinBuckets = ['BTC', 'ETH', '一等山寨', '二等山寨']

// ── 加载模板列表 ──
const loadTemplates = async () => {
    try {
        const res = await fetchStrategyTemplates({
            page: currentPage.value,
            pageSize: pageSize.value,
            search: searchKeyword.value || undefined,
        })
        templates.value = res.data.data || []
        totalItems.value = res.data.total || 0
    } catch (e) {
        ElMessage.error('加载策略模板失败')
    }
}

// ── 打开编辑器 ──
const openCreate = () => {
    editingId.value = null
    editorTitle.value = '新建策略模板'
    validationErrors.value = []
    formData.value = {
        name: '',
        description: '',
        is_global: false,
        is_active: true,
        cycles: [],
    }
    editorVisible.value = true
}

const openEdit = async (id: number) => {
    try {
        const res = await fetchStrategyTemplateDetail(id)
        const data = res.data.data
        editingId.value = id
        editorTitle.value = `编辑: ${data.name}`
        validationErrors.value = []
        formData.value = {
            name: data.name,
            description: data.description || '',
            is_global: data.is_global,
            is_active: data.is_active,
            cycles: data.cycles || [],
        }
        editorVisible.value = true
    } catch (e) {
        ElMessage.error('加载模板详情失败')
    }
}

// ── 一键填充预设 ──
const fillPreset = () => {
    formData.value.cycles = presetCycles.map((p, idx) => ({
        name: p.name,
        days_min: p.days_min,
        days_max: p.days_max,
        sort_order: idx,
        rules: coinBuckets.map((bucket, bi) => ({
            ...defaultRule(),
            coin_bucket: bucket,
            priority: bi + 1,
        })),
    }))
}

// ── 添加/删除周期 ──
const addCycle = () => {
    formData.value.cycles.push({
        ...defaultCycle(),
        sort_order: formData.value.cycles.length,
    })
}

const removeCycle = (idx: number) => {
    formData.value.cycles.splice(idx, 1)
}

// ── 添加/删除规则 ──
const addRule = (cycleIdx: number) => {
    const cycle = formData.value.cycles[cycleIdx]
    cycle.rules.push({
        ...defaultRule(),
        priority: cycle.rules.length + 1,
    })
}

const removeRule = (cycleIdx: number, ruleIdx: number) => {
    formData.value.cycles[cycleIdx].rules.splice(ruleIdx, 1)
}

// ── 数组输入辅助 ──
const arrayToStr = (arr: number[]) => (arr || []).join(', ')
const strToArray = (str: string): number[] => {
    return str.split(/[,，\s]+/).filter(s => s.trim()).map(Number).filter(n => !isNaN(n))
}

// ── 校验 ──
const doValidate = async () => {
    try {
        const res = await validateStrategyTemplate(formData.value)
        validationErrors.value = res.data.errors || []
        if (res.data.valid) {
            ElMessage.success('校验通过')
        }
        return res.data.valid
    } catch (e) {
        ElMessage.error('校验请求失败')
        return false
    }
}

// ── 获取字段错误 ──
const fieldError = (field: string) => {
    const err = validationErrors.value.find((e: any) => e.field === field)
    return err?.message || ''
}

// ── 保存 ──
const handleSave = async () => {
    const valid = await doValidate()
    if (!valid) return

    saving.value = true
    try {
        if (editingId.value) {
            await updateStrategyTemplate(editingId.value, formData.value)
            ElMessage.success('策略模板已更新')
        } else {
            await createStrategyTemplate(formData.value)
            ElMessage.success('策略模板已创建')
        }
        editorVisible.value = false
        loadTemplates()
    } catch (e: any) {
        const detail = e.response?.data?.details || e.response?.data?.error || '保存失败'
        if (Array.isArray(detail)) {
            validationErrors.value = detail
        } else {
            ElMessage.error(String(detail))
        }
    } finally {
        saving.value = false
    }
}

// ── 删除 ──
const handleDelete = async (id: number) => {
    try {
        await ElMessageBox.confirm('确定删除此策略模板？', '删除确认', { type: 'warning' })
        await deleteStrategyTemplate(id)
        ElMessage.success('已删除')
        loadTemplates()
    } catch {}
}

// ── T-0108 历史版本与回滚 ──
const versionsVisible = ref(false)
const versionsTemplateId = ref<number | null>(null)
const versionsList = ref<{ id: number; template_id: number; version: number; created_at: string }[]>([])
const versionsLoading = ref(false)
const rollbackLoading = ref(false)

const openVersions = async (id: number) => {
    versionsTemplateId.value = id
    versionsVisible.value = true
    versionsLoading.value = true
    try {
        const res = await fetchStrategyTemplateVersions(id)
        versionsList.value = res.data.data || []
    } catch {
        ElMessage.error('加载版本列表失败')
    } finally {
        versionsLoading.value = false
    }
}

const currentVersion = computed(() => {
    const row = templates.value.find((t: any) => t.id === versionsTemplateId.value)
    return row?.version ?? null
})

const handleRollback = async (version: number) => {
    if (versionsTemplateId.value == null) return
    try {
        await ElMessageBox.confirm(`确定回滚到版本 v${version}？当前内容将被该版本快照覆盖。`, '回滚确认', { type: 'warning' })
        rollbackLoading.value = true
        await rollbackStrategyTemplate(versionsTemplateId.value, version)
        ElMessage.success('回滚成功')
        versionsVisible.value = false
        loadTemplates()
        if (editingId.value === versionsTemplateId.value) {
            openEdit(versionsTemplateId.value)
        }
    } catch (e: any) {
        ElMessage.error(e.response?.data?.error || '回滚失败')
    } finally {
        rollbackLoading.value = false
    }
}

onMounted(loadTemplates)
</script>

<template>
    <div class="strategy-template-view" style="padding: 12px;">
        <!-- 工具栏 -->
        <el-card shadow="never" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; gap: 8px; align-items: center;">
                    <el-input v-model="searchKeyword" placeholder="搜索策略名称" clearable style="width: 200px;"
                        @keyup.enter="() => { currentPage = 1; loadTemplates() }" />
                    <el-button type="primary" @click="() => { currentPage = 1; loadTemplates() }">搜索</el-button>
                </div>
                <el-button type="success" @click="openCreate">新建策略模板</el-button>
            </div>
        </el-card>

        <!-- 模板列表 -->
        <el-card shadow="never">
            <el-table :data="templates" stripe border>
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="name" label="名称" min-width="200" show-overflow-tooltip />
                <el-table-column label="状态" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
                            {{ row.is_active ? '生效' : '停用' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="范围" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.is_global ? 'warning' : ''" size="small">
                            {{ row.is_global ? '全局' : '个人' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="version" label="版本" width="70" align="center">
                    <template #default="{ row }">v{{ row.version }}</template>
                </el-table-column>
                <el-table-column prop="updated_at" label="更新时间" width="160" />
                <el-table-column label="操作" width="350" align="center" fixed="right">
                    <template #default="{ row }">
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">
                            <el-button size="small" type="primary" @click="openEdit(row.id)">编辑</el-button>
                            <el-button size="small" @click="openVersions(row.id)">历史版本</el-button>
                            <el-button size="small" type="warning" :icon="DataAnalysis" @click="goBacktest(row.id)">回测</el-button>
                            <el-button size="small" type="danger" @click="handleDelete(row.id)">删除</el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
                <el-pagination background layout="total, prev, pager, next" :total="totalItems"
                    v-model:current-page="currentPage" v-model:page-size="pageSize"
                    @current-change="loadTemplates" />
            </div>
        </el-card>

        <!-- 编辑器弹窗 -->
        <el-dialog v-model="editorVisible" :title="editorTitle" width="90%" top="3vh" destroy-on-close>
            <!-- 基本信息 -->
            <el-form label-width="100px" size="default">
                <el-row :gutter="16">
                    <el-col :span="8">
                        <el-form-item label="策略名称" :error="fieldError('name')">
                            <el-input v-model="formData.name" placeholder="例: 多周期波动框架" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="10">
                        <el-form-item label="描述">
                            <el-input v-model="formData.description" placeholder="策略说明(可选)" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item label="全局">
                            <el-switch v-model="formData.is_global" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item label="生效">
                            <el-switch v-model="formData.is_active" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>

            <!-- 快捷操作 -->
            <div style="margin-bottom: 12px; display: flex; gap: 8px;">
                <el-button @click="fillPreset" type="warning" size="small">一键填充预设(4周期x4类别)</el-button>
                <el-button @click="addCycle" type="primary" size="small" :icon="Plus">添加周期</el-button>
                <el-button @click="doValidate" size="small">校验参数</el-button>
            </div>

            <!-- 校验错误汇总 -->
            <el-alert v-if="validationErrors.length" type="error" :closable="false" style="margin-bottom: 12px;">
                <template #title>
                    <span>校验错误 ({{ validationErrors.length }} 项)</span>
                </template>
                <div style="font-size: 12px; max-height: 100px; overflow-y: auto;">
                    <div v-for="(err, i) in validationErrors" :key="i">
                        <b>{{ err.field }}</b>: {{ err.message }}
                    </div>
                </div>
            </el-alert>

            <!-- 周期矩阵 -->
            <div v-for="(cycle, ci) in formData.cycles" :key="ci"
                style="border: 1px solid #dcdfe6; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <el-input v-model="cycle.name" placeholder="周期名称" style="width: 140px;" size="small" />
                        <span style="font-size: 13px; color: #999;">天数:</span>
                        <el-input-number v-model="cycle.days_min" :min="0" size="small" style="width: 90px;" />
                        <span style="color: #999;">~</span>
                        <el-input-number v-model="cycle.days_max" :min="0" size="small" style="width: 90px;" />
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <el-button size="small" @click="addRule(Number(ci))" :icon="Plus">添加类别</el-button>
                        <el-button size="small" type="danger" @click="removeCycle(Number(ci))" :icon="Delete" />
                    </div>
                </div>

                <!-- 规则表格 -->
                <el-table :data="cycle.rules" border size="small" style="width: 100%;">
                    <el-table-column label="币种类别" min-width="120">
                        <template #default="{ row }">
                            <el-select v-model="row.coin_bucket" size="small" filterable allow-create placeholder="类别" style="width: 100%;">
                                <el-option v-for="b in coinBuckets" :key="b" :label="b" :value="b" />
                            </el-select>
                        </template>
                    </el-table-column>
                    <el-table-column label="买入区间(%)" min-width="100" align="center" header-align="center">
                        <template #default="{ row }">
                            <el-input size="small" :model-value="arrayToStr(row.buy_levels)"
                                @change="(v: string) => row.buy_levels = strToArray(v)"
                                placeholder="4.5, 6, 8" />
                        </template>
                    </el-table-column>
                    <el-table-column label="止损(%)" min-width="90" align="center" header-align="center">
                        <template #default="{ row }">
                            <el-input-number v-model="row.stop_loss_pct" :min="0" :precision="1" size="small"
                                controls-position="right" style="width: 100%; max-width: 80px;" />
                        </template>
                    </el-table-column>
                    <el-table-column label="观望区间(%)" min-width="280" align="center" header-align="center">
                        <template #default="{ row }">
                            <div style="display: flex; gap: 8px; align-items: center; justify-content: center;">
                                <el-input-number v-model="row.watch_range_min_pct" :min="0" :precision="1"
                                    size="small" style="width: 110px; flex-shrink: 0;" />
                                <span>~</span>
                                <el-input-number v-model="row.watch_range_max_pct" :min="0" :precision="1"
                                    size="small" style="width: 110px; flex-shrink: 0;" />
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column label="反弹目标(%)" min-width="100" align="center" header-align="center">
                        <template #default="{ row }">
                            <el-input size="small" :model-value="arrayToStr(row.rebound_targets)"
                                @change="(v: string) => row.rebound_targets = strToArray(v)"
                                placeholder="1.5, 3, 5" />
                        </template>
                    </el-table-column>
                    <el-table-column label="波动系数" min-width="90" align="center" header-align="center">
                        <template #default="{ row }">
                            <el-input-number v-model="row.volatility_factor" :min="0.1" :step="0.1" :precision="1"
                                size="small" controls-position="right" style="width: 100%; max-width: 80px;" />
                        </template>
                    </el-table-column>
                    <el-table-column label="优先级" min-width="80" align="center" header-align="center">
                        <template #default="{ row }">
                            <el-input-number v-model="row.priority" :min="1" size="small"
                                controls-position="right" style="width: 100%; max-width: 65px;" />
                        </template>
                    </el-table-column>
                    <el-table-column label="" width="60" align="center">
                        <template #default="{ $index }">
                            <el-button size="small" type="danger" :icon="Delete" circle
                                @click="removeRule(Number(ci), $index)" />
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div v-if="!formData.cycles.length" style="text-align: center; color: #ccc; padding: 40px;">
                点击「一键填充预设」或「添加周期」开始编辑
            </div>

            <template #footer>
                <el-button @click="editorVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
            </template>
        </el-dialog>

        <!-- 历史版本弹窗 T-0108 -->
        <el-dialog v-model="versionsVisible" title="历史版本" width="520px" destroy-on-close>
            <div v-if="currentVersion != null" style="margin-bottom: 12px; color: #666;">当前版本: v{{ currentVersion }}</div>
            <el-table :data="versionsList" v-loading="versionsLoading" border size="small" max-height="320">
                <el-table-column prop="version" label="版本" width="80">
                    <template #default="{ row }">v{{ row.version }}</template>
                </el-table-column>
                <el-table-column prop="created_at" label="保存时间" />
                <el-table-column label="操作" width="90" align="center">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" :loading="rollbackLoading"
                            :disabled="row.version === currentVersion"
                            @click="handleRollback(row.version)">
                            回滚
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>
            <template #footer>
                <el-button @click="versionsVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>
