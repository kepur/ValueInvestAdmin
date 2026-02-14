<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchTransactionHistory } from '@/utils/tradapi'
import { fetchAllCoins } from '@/utils/coinapi'

// 币种列表（用于筛选）
const coins = ref<any[]>([])

// 筛选条件
const filterCoinId = ref<number | null>(null)

// 交易历史
const records = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const loading = ref(false)

// 加载币种列表
const loadCoins = async () => {
  try {
    const res = await fetchAllCoins()
    coins.value = res.data || []
  } catch (e) {
    console.error('加载币种失败', e)
  }
}

// 加载交易历史
const loadRecords = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    if (filterCoinId.value) {
      params.coin_id = filterCoinId.value
    }
    const res = await fetchTransactionHistory(params)
    records.value = res.data.data || []
    totalItems.value = res.data.total || 0
  } catch (e) {
    ElMessage.error('加载交易历史失败')
    console.error('加载交易历史失败', e)
  } finally {
    loading.value = false
  }
}

// 筛选变化
const handleFilter = () => {
  currentPage.value = 1
  loadRecords()
}

// 重置筛选
const handleReset = () => {
  filterCoinId.value = null
  currentPage.value = 1
  loadRecords()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadRecords()
}
const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadRecords()
}

// 格式化价格
const formatPrice = (price: number) => {
  if (!price && price !== 0) return '-'
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${price.toFixed(6)}`
}

// 格式化金额
const formatAmount = (amount: number) => {
  if (!amount && amount !== 0) return '-'
  return amount.toFixed(6)
}

// 格式化交易类型
const formatTransactionType = (type: string) => {
  const map: Record<string, string> = {
    buy: '买入',
    sell: '卖出',
    deposit: '充值',
    withdraw: '提现',
  }
  return map[type] || type
}

// 交易类型对应 tag 颜色
const transactionTypeTag = (type: string) => {
  const map: Record<string, string> = {
    buy: 'success',
    sell: 'danger',
    deposit: 'primary',
    withdraw: 'warning',
  }
  return map[type] || 'info'
}

onMounted(async () => {
  await loadCoins()
  loadRecords()
})
</script>

<template>
  <div class="history-container">
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>交易历史记录</span>
          <div class="filter-bar">
            <el-select
              v-model="filterCoinId"
              filterable
              clearable
              placeholder="按币种筛选"
              style="width: 220px;"
              @change="handleFilter"
            >
              <el-option
                v-for="coin in coins"
                :key="coin.id"
                :label="`${coin.name} (${coin.symbol || ''})`"
                :value="coin.id"
              />
            </el-select>
            <el-button type="primary" size="small" @click="handleFilter">查询</el-button>
            <el-button size="small" @click="handleReset">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="records" v-loading="loading" style="width: 100%" border stripe empty-text="暂无交易历史">
        <el-table-column prop="coin_name" label="币种" width="150">
          <template #default="{ row }">
            <span style="font-weight: bold;">{{ row.coin_name }}</span>
            <span style="color: #909399; margin-left: 4px;">({{ row.coin_symbol }})</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="transactionTypeTag(row.transaction_type)" size="small">
              {{ formatTransactionType(row.transaction_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投资金额" width="150">
          <template #default="{ row }">
            <span style="font-weight: bold;">{{ formatPrice(row.amount_invested) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成交价格" width="160">
          <template #default="{ row }">{{ formatPrice(row.price_at_transaction) }}</template>
        </el-table-column>
        <el-table-column prop="transaction_date" label="交易时间" />
      </el-table>

      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px;"
      />
    </el-card>
  </div>
</template>

<style scoped>
.history-container {
  padding: 20px;
}
.section-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
