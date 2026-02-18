<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchRealTimePrice, syncRealTimePrice, fetchKlineData } from '@/utils/priceapi'
import { fetchCoins } from '@/utils/coinapi'
import KlineChart from '@/components/KlineChart.vue'

interface MarketPrice {
  symbol: string
  coingecko_id: string
  price: number
  market_cap: number
  volume_24h: number
  change_24h: number
  last_updated: number
  vs_currency: string
  coin_id?: number
}

const prices = ref<MarketPrice[]>([])
const coins = ref<any[]>([])
const loading = ref(false)
const syncing = ref(false)
const searchKeyword = ref('')
const selectedCoinId = ref<number | null>(null)
const klineData = ref<any[]>([])
const klineLoading = ref(false)
const klineInterval = ref('1d')
const klineIntervals = [
  { value: '1m', label: '1分钟' },
  { value: '1h', label: '1小时' },
  { value: '4h', label: '4小时' },
  { value: '1d', label: '1天' },
]
let refreshTimer: ReturnType<typeof setInterval> | null = null

const filteredPrices = computed(() => {
  if (!searchKeyword.value) return prices.value
  const kw = searchKeyword.value.toLowerCase()
  return prices.value.filter(p => p.symbol.toLowerCase().includes(kw))
})

const loadPrices = async () => {
  loading.value = true
  try {
    const [priceRes, coinRes] = await Promise.all([
      fetchRealTimePrice(),
      fetchCoins({ page: 1, pageSize: 200 })
    ])
    prices.value = priceRes.data.data || []
    coins.value = coinRes.data.data || []
    // 关联 coin_id
    prices.value.forEach(p => {
      const c = coins.value.find((c: any) => c.symbol?.toLowerCase() === p.symbol.toLowerCase())
      if (c) p.coin_id = c.id
    })
  } catch (error) {
    ElMessage.error('加载市场价格失败')
  } finally {
    loading.value = false
  }
}

const showKline = async (row: MarketPrice) => {
  if (!row.coin_id) return ElMessage.warning('该币种无K线数据')
  selectedCoinId.value = row.coin_id
  await loadKlineData()
}

const loadKlineData = async () => {
  if (!selectedCoinId.value) return
  klineLoading.value = true
  try {
    const limit = klineInterval.value === '1m' ? 360 : klineInterval.value === '1h' ? 168 : 90
    const res = await fetchKlineData({ coin_id: selectedCoinId.value, interval: klineInterval.value, limit })
    klineData.value = res.data.data || []
  } catch { klineData.value = [] }
  finally { klineLoading.value = false }
}

const handleSync = async () => {
  syncing.value = true
  try {
    const res = await syncRealTimePrice({})
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
        <el-input v-model="searchKeyword" placeholder="搜索币种" clearable style="width: 160px; margin-right: 10px;" />
        <el-button type="primary" @click="loadPrices" :loading="loading">刷新价格</el-button>
        <el-button type="success" @click="handleSync" :loading="syncing">同步到数据库</el-button>
      </div>
    </div>

    <el-table :data="filteredPrices" v-loading="loading" style="width: 100%" border stripe @row-click="showKline">
      <el-table-column label="币种" width="120">
        <template #default="{ row }">
          <span style="font-weight: bold; cursor: pointer;">{{ row.symbol }}</span>
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

    <!-- K线图区域 -->
    <el-card v-if="selectedCoinId" style="margin-top: 16px;" shadow="never">
      <template #header>
        <div class="kline-header">
          <span>K线走势图</span>
          <div class="kline-actions">
            <el-select v-model="klineInterval" size="small" style="width: 100px;" @change="loadKlineData">
              <el-option v-for="opt in klineIntervals" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-button size="small" @click="loadKlineData" :loading="klineLoading">刷新</el-button>
            <el-button size="small" @click="selectedCoinId = null">关闭</el-button>
          </div>
        </div>
      </template>
      <div v-loading="klineLoading">
        <KlineChart v-if="klineData.length" :data="klineData" height="400px" />
        <el-empty v-else description="暂无K线数据" />
      </div>
    </el-card>

    <p style="margin-top: 12px; color: #909399; font-size: 12px;">
      数据来源: CoinGecko 免费 API | 每60秒自动刷新 | 点击行查看K线
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
.kline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.kline-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
h2 {
  margin: 0;
}
</style>
