<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchStrategyExecutionLogs } from '@/utils/investapi'

const logs = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const filters = ref({
    coin_symbol: '',
    trigger_type: '',
    status: '',
    page: 1,
    page_size: 20,
})

const loadLogs = async () => {
    loading.value = true
    try {
        const res = await fetchStrategyExecutionLogs(filters.value)
        logs.value = res.data.data || []
        total.value = res.data.total || 0
    } catch { logs.value = [] }
    finally { loading.value = false }
}

const handleSearch = () => { filters.value.page = 1; loadLogs() }
const handlePageChange = (page: number) => { filters.value.page = page; loadLogs() }

onMounted(loadLogs)
</script>

<template>
    <div style="padding: 16px;">
        <el-card shadow="never" style="margin-bottom: 12px;">
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <el-input v-model="filters.coin_symbol" placeholder="币种" clearable style="width: 120px;" />
                <el-select v-model="filters.trigger_type" placeholder="触发类型" clearable style="width: 120px;">
                    <el-option label="买入" value="buy" />
                    <el-option label="卖出" value="sell" />
                    <el-option label="跳过" value="skip" />
                </el-select>
                <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;">
                    <el-option label="成功" value="success" />
                    <el-option label="失败" value="failed" />
                    <el-option label="跳过" value="skipped" />
                </el-select>
                <el-button type="primary" @click="handleSearch">搜索</el-button>
            </div>
        </el-card>

        <el-card shadow="never" class="log-table-card">
            <div class="table-wrap">
            <el-table :data="logs" v-loading="loading" border stripe size="small">
                <el-table-column prop="executed_at" label="时间" width="160" />
                <el-table-column prop="template_name" label="策略模板" width="140" />
                <el-table-column prop="cycle_name" label="周期" width="80" />
                <el-table-column prop="coin_symbol" label="币种" width="80" />
                <el-table-column prop="trigger_type" label="触发" width="70">
                    <template #default="{ row }">
                        <el-tag :type="row.trigger_type === 'buy' ? 'success' : row.trigger_type === 'sell' ? 'danger' : 'info'" size="small">
                            {{ row.trigger_type }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="trigger_condition" label="触发条件" min-width="150" />
                <el-table-column prop="input_price" label="输入价格" width="100">
                    <template #default="{ row }">{{ row.input_price ? `$${row.input_price.toFixed(2)}` : '-' }}</template>
                </el-table-column>
                <el-table-column prop="action" label="动作" width="70" />
                <el-table-column prop="quantity" label="数量" width="90" />
                <el-table-column prop="status" label="状态" width="80">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
                            {{ row.status }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="error_message" label="错误信息" min-width="150" show-overflow-tooltip />
            </el-table>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
                <el-pagination background layout="total, prev, pager, next" :total="total"
                    v-model:current-page="filters.page" :page-size="filters.page_size"
                    @current-change="handlePageChange" />
            </div>
        </el-card>
    </div>
</template>

<style scoped>
/* T-0414 全站自适应：表格横向滚动 */
.log-table-card .table-wrap {
  overflow-x: auto;
  min-width: 0;
}
</style>
