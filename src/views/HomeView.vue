<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchRealTimePrice, syncRealTimePrice } from '@/utils/priceapi'

interface MarketPrice {
  symbol: string
  coingecko_id: string
  price: number
  market_cap: number
  volume_24h: number
  change_24h: number
  last_updated: number
  vs_currency: string
}

const prices = ref<MarketPrice[]>([])
const loading = ref(false)
const syncing = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const loadPrices = async () => {
  loading.value = true
  try {
    const response = await fetchRealTimePrice()
    prices.value = response.data.data || []
  } catch (error) {
    ElMessage.error('加载市场价格失败')
  } finally {
    loading.value = false
  }
}

const handleSync = async () => {
  syncing.value = true
  try {
    const res = await syncRealTimePrice()
    ElMessage.success(res.data.message || '价格同步成功')
    loadPrices()
  } catch (error) {
    ElMessage.error('价格同步失败')
  } finally {
    syncing.value = false
  }
}

// 格式化价格
const formatPrice = (price: number) => {
  if (!price && price !== 0) return '-'
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  return `$${price.toFixed(8)}`
}

// 格式化市值/成交量
const formatLargeNumber = (value: number) => {
  if (!value) return '-'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}

// 格式化时间戳
const formatTimestamp = (ts: number) => {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString('zh-CN')
}

onMounted(() => {
  loadPrices()
  // 每60秒自动刷新
  refreshTimer = setInterval(loadPrices, 60000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="home-container">
    <div class="header-bar">
      <h2>实时市场价格</h2>
      <div class="header-actions">
        <el-button type="primary" @click="loadPrices" :loading="loading">刷新价格</el-button>
        <el-button type="success" @click="handleSync" :loading="syncing">同步到数据库</el-button>
      </div>
    </div>

    <el-table :data="prices" v-loading="loading" style="width: 100%" border stripe>
      <el-table-column label="币种" width="120">
        <template #default="{ row }">
          <span style="font-weight: bold;">{{ row.symbol }}</span>
        </template>
      </el-table-column>
      <el-table-column label="当前价格" width="160">
        <template #default="{ row }">
          <span style="font-weight: bold;">{{ formatPrice(row.price) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="24h涨跌" width="130">
        <template #default="{ row }">
          <span :style="{ color: row.change_24h >= 0 ? '#67C23A' : '#F56C6C', fontWeight: 'bold' }">
            {{ row.change_24h != null ? (row.change_24h >= 0 ? '+' : '') + row.change_24h.toFixed(2) + '%' : '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="市值">
        <template #default="{ row }">{{ formatLargeNumber(row.market_cap) }}</template>
      </el-table-column>
      <el-table-column label="24h成交量">
        <template #default="{ row }">{{ formatLargeNumber(row.volume_24h) }}</template>
      </el-table-column>
      <el-table-column label="更新时间" width="180">
        <template #default="{ row }">{{ formatTimestamp(row.last_updated) }}</template>
      </el-table-column>
    </el-table>

    <p style="margin-top: 12px; color: #909399; font-size: 12px;">
      数据来源: CoinGecko 免费 API | 每60秒自动刷新
    </p>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.header-actions {
  display: flex;
  gap: 10px;
}
h2 {
  margin: 0;
}
</style>
