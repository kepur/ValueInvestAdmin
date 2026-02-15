<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchInvestmentScores, triggerRiskScore } from '@/utils/scoreapi'
import { ElMessage, ElMessageBox } from 'element-plus'

const tableData = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const totalItems = ref(0)

// 批量操作
const showSelection = ref(false)
const modelOptions = [
    { label: 'DeepSeek', value: 'deepseek' },
    { label: 'xAI (Grok)', value: 'xai' },
    { label: 'Qwen (通义)', value: 'qwen' },
]
const selectedBatchModel = ref('')
const selectedTokens = ref<any[]>([])
const evaluating = ref(false)

// 加载评分数据
const loadData = async () => {
    loading.value = true
    try {
        const res = await fetchInvestmentScores({
            page: currentPage.value,
            pageSize: pageSize.value,
        })
        const body = res.data
        tableData.value = (body.data || []).map((item: any) => ({
            ...item,
            selectedModel: '',
        }))
        totalItems.value = body.total || 0
    } catch (e: any) {
        ElMessage.error('加载评分数据失败: ' + e.message)
    } finally {
        loading.value = false
    }
}

const handleSizeChange = (size: number) => {
    pageSize.value = size
    loadData()
}

const handleCurrentChange = (page: number) => {
    currentPage.value = page
    loadData()
}

// 单个代币打分评估
const handleEvaluate = async (row: any, model: string) => {
    if (!model) {
        ElMessage.warning('请先选择模型')
        return
    }
    const providerLabel = modelOptions.find(m => m.value === model)?.label || model
    try {
        await ElMessageBox.confirm(
            `确定使用「${providerLabel}」对 ${row.crypto_symbol} 进行风险评估？`,
            '打分评估', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
        )
    } catch { return }

    evaluating.value = true
    try {
        const res = await triggerRiskScore({
            coin_symbols: [row.crypto_symbol],
            provider: model,
        })
        ElMessage.success(res.data.message || '评估任务已启动')
    } catch (e: any) {
        ElMessage.error('触发评估失败: ' + e.message)
    } finally {
        evaluating.value = false
    }
}

// 批量打分评估
const handleBatchEvaluate = async () => {
    if (selectedTokens.value.length === 0) {
        ElMessage.warning('请先选择代币')
        return
    }
    if (!selectedBatchModel.value) {
        ElMessage.warning('请先选择模型')
        return
    }
    const symbols = selectedTokens.value.map((r: any) => r.crypto_symbol)
    const providerLabel = modelOptions.find(m => m.value === selectedBatchModel.value)?.label || selectedBatchModel.value
    try {
        await ElMessageBox.confirm(
            `确定使用「${providerLabel}」对 ${symbols.length} 个代币批量评估？`,
            '批量评估', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
        )
    } catch { return }

    evaluating.value = true
    try {
        const res = await triggerRiskScore({
            coin_symbols: symbols,
            provider: selectedBatchModel.value,
        })
        ElMessage.success(res.data.message || '批量评估已启动')
    } catch (e: any) {
        ElMessage.error('触发批量评估失败: ' + e.message)
    } finally {
        evaluating.value = false
    }
}

// 评分颜色
const scoreColor = (score: number) => {
    if (score >= 70) return '#67c23a'
    if (score >= 40) return '#e6a23c'
    return '#f56c6c'
}

onMounted(() => loadData())
</script>

<template>
    <div class="risk-assessment">
        <h3 style="margin-bottom: 16px;">代币风险评估</h3>

        <!-- 工具栏 -->
        <div class="toolbar">
            <el-button type="primary" @click="showSelection = !showSelection">
                {{ showSelection ? '取消选择' : '批量操作' }}
            </el-button>
            <template v-if="showSelection">
                <el-select v-model="selectedBatchModel" placeholder="选择模型" style="width: 160px;">
                    <el-option v-for="opt in modelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
                <el-button type="warning" @click="handleBatchEvaluate" :loading="evaluating"
                    :disabled="!selectedBatchModel || selectedTokens.length === 0">
                    批量打分 ({{ selectedTokens.length }})
                </el-button>
            </template>
            <div style="flex:1"></div>
            <el-button @click="loadData" :loading="loading">刷新</el-button>
        </div>

        <!-- 数据表 -->
        <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%;"
            @selection-change="selectedTokens = $event" max-height="calc(100vh - 280px)">
            <el-table-column v-if="showSelection" type="selection" width="45" fixed />
            <el-table-column prop="crypto_symbol" label="代币" width="80" fixed sortable />
            <el-table-column prop="coin_name" label="名称" width="100" />
            <el-table-column prop="main_features" label="主要特点" min-width="200" show-overflow-tooltip />
            <el-table-column label="增长潜力(15%)" width="110" sortable sort-by="growth_potential_score">
                <template #default="{ row }">
                    <span :style="{ color: scoreColor(row.growth_potential_score), fontWeight: 'bold' }">
                        {{ row.growth_potential_score }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="名人推荐(5%)" width="110" sortable sort-by="notable_figures_score">
                <template #default="{ row }">
                    <span :style="{ color: scoreColor(row.notable_figures_score), fontWeight: 'bold' }">
                        {{ row.notable_figures_score }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="链上规模(10%)" width="110" sortable sort-by="chain_scale_score">
                <template #default="{ row }">{{ row.chain_scale_score }}</template>
            </el-table-column>
            <el-table-column label="锁仓计划(10%)" width="110" sortable sort-by="lockup_release_score">
                <template #default="{ row }">{{ row.lockup_release_score }}</template>
            </el-table-column>
            <el-table-column label="市值稀缺(15%)" width="110" sortable sort-by="market_cap_scarcity_score">
                <template #default="{ row }">{{ row.market_cap_scarcity_score }}</template>
            </el-table-column>
            <el-table-column label="历史表现(5%)" width="110" sortable sort-by="historical_performance_score">
                <template #default="{ row }">{{ row.historical_performance_score }}</template>
            </el-table-column>
            <el-table-column label="机构持仓(5%)" width="110" sortable sort-by="institutional_holdings_score">
                <template #default="{ row }">{{ row.institutional_holdings_score }}</template>
            </el-table-column>
            <el-table-column label="FDV比率(5%)" width="100" sortable sort-by="fdv_ratio_score">
                <template #default="{ row }">{{ row.fdv_ratio_score }}</template>
            </el-table-column>
            <el-table-column label="通胀(5%)" width="90" sortable sort-by="supply_inflation_score">
                <template #default="{ row }">{{ row.supply_inflation_score }}</template>
            </el-table-column>
            <el-table-column label="主链" width="65" sortable sort-by="has_main_chain">
                <template #default="{ row }">
                    <el-tag :type="row.has_main_chain ? 'success' : 'info'" size="small">
                        {{ row.has_main_chain ? '是' : '否' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="综合评分" width="100" sortable sort-by="overall_score" fixed="right">
                <template #default="{ row }">
                    <span style="font-size: 16px; font-weight: bold;"
                        :style="{ color: scoreColor(row.overall_score) }">
                        {{ row.overall_score?.toFixed(1) }}
                    </span>
                </template>
            </el-table-column>
            <el-table-column label="可信度" width="75" sortable sort-by="data_confidence_score">
                <template #default="{ row }">{{ row.data_confidence_score }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <el-select v-model="row.selectedModel" placeholder="模型" size="small" style="width: 100px;">
                            <el-option v-for="opt in modelOptions" :key="opt.value" :label="opt.label"
                                :value="opt.value" />
                        </el-select>
                        <el-button type="primary" size="small" :disabled="!row.selectedModel" :loading="evaluating"
                            @click="handleEvaluate(row, row.selectedModel)">
                            评估
                        </el-button>
                    </div>
                </template>
            </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination style="margin-top: 12px; justify-content: flex-end;" @size-change="handleSizeChange"
            @current-change="handleCurrentChange" :current-page="currentPage" :page-size="pageSize"
            :total="totalItems" layout="total, sizes, prev, pager, next" :page-sizes="[10, 20, 50]" />
    </div>
</template>

<style scoped>
.risk-assessment {
    padding: 12px;
}

.toolbar {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
    align-items: center;
}
</style>
