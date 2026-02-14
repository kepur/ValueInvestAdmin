<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchWalletBalance, updateWallet, executeTrade, fetchTradeRecords, fetchUserAssets } from '@/utils/tradapi'
import { fetchRealTimePrice } from '@/utils/priceapi'
import { fetchAllCoins } from '@/utils/coinapi'

const TRADE_TYPE = 'real'

// 钱包
const walletBalance = ref(0)
const walletDialogVisible = ref(false)
const walletAction = ref<'deposit' | 'withdraw'>('deposit')
const walletAmount = ref(100)

// 实时价格 + 币种列表
const marketPrices = ref<any[]>([])
const coins = ref<any[]>([])

// 交易表单
const selectedCoinId = ref<number | null>(null)
const tradeAmount = ref(0)
const trading = ref(false)

// 持仓
const userAssets = ref<any[]>([])
const totalAssetValue = ref(0)

// 交易记录
const tradeRecords = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 当前选中币种的价格信息
const selectedCoinPrice = computed(() => {
  if (!selectedCoinId.value) return 0
  const coin = coins.value.find((c: any) => c.id === selectedCoinId.value)
  if (!coin) return 0
  const priceItem = marketPrices.value.find(
    (p: any) => p.symbol.toLowerCase() === (coin.symbol || '').toLowerCase()
  )
  return priceItem ? priceItem.price : 0
})

const totalCost = computed(() => {
  return tradeAmount.value * selectedCoinPrice.value
})

// 加载钱包余额
const loadWallet = async () => {
  try {
    const res = await fetchWalletBalance()
    walletBalance.value = res.data.real_balance || 0
  } catch (e) {
    console.error('加载钱包余额失败', e)
  }
}

// 加载实时价格
const loadPrices = async () => {
  try {
    const res = await fetchRealTimePrice()
    marketPrices.value = res.data.data || []
  } catch (e) {
    console.error('加载实时价格失败', e)
  }
}

// 加载币种列表
const loadCoins = async () => {
  try {
    const res = await fetchAllCoins()
    coins.value = res.data || []
  } catch (e) {
    console.error('加载币种失败', e)
  }
}

// 加载持仓
const loadAssets = async () => {
  try {
    const res = await fetchUserAssets({ trade_type: TRADE_TYPE })
    userAssets.value = res.data.data || []
    totalAssetValue.value = res.data.total_value || 0
  } catch (e) {
    console.error('加载持仓失败', e)
  }
}

// 加载交易记录
const loadRecords = async () => {
  try {
    const res = await fetchTradeRecords({
      trade_type: TRADE_TYPE,
      page: currentPage.value,
      pageSize: pageSize.value,
    })
    tradeRecords.value = res.data.data || []
    totalItems.value = res.data.total || 0
  } catch (e) {
    console.error('加载交易记录失败', e)
  }
}

// 刷新所有数据
const refreshAll = () => {
  loadWallet()
  loadAssets()
  loadRecords()
}

// 充值/提现弹窗
const openWalletDialog = (action: 'deposit' | 'withdraw') => {
  walletAction.value = action
  walletAmount.value = 100
  walletDialogVisible.value = true
}

const submitWallet = async () => {
  if (walletAmount.value <= 0) {
    ElMessage.warning('金额必须大于0')
    return
  }
  try {
    await updateWallet({
      amount: walletAmount.value,
      transaction_type: walletAction.value,
      trade_type: TRADE_TYPE,
    })
    ElMessage.success(walletAction.value === 'deposit' ? '充值成功' : '提现成功')
    walletDialogVisible.value = false
    refreshAll()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

// 交易执行
const handleTrade = async (action: 'buy' | 'sell') => {
  if (!selectedCoinId.value) {
    ElMessage.warning('请选择币种')
    return
  }
  if (tradeAmount.value <= 0) {
    ElMessage.warning('交易数量必须大于0')
    return
  }
  if (selectedCoinPrice.value <= 0) {
    ElMessage.warning('无法获取当前价格，请先同步价格数据')
    return
  }

  trading.value = true
  try {
    const res = await executeTrade({
      coin_id: selectedCoinId.value,
      action,
      amount: tradeAmount.value,
      trade_type: TRADE_TYPE,
    })
    ElMessage.success(res.data.message || '交易成功')
    tradeAmount.value = 0
    refreshAll()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '交易失败')
  } finally {
    trading.value = false
  }
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

onMounted(async () => {
  await Promise.all([loadCoins(), loadPrices()])
  loadWallet()
  loadAssets()
  loadRecords()
})
</script>

<template>
  <div class="trade-container">
    <!-- 风险提示 -->
    <el-alert
      title="实盘交易提示：实盘交易使用真实资金，请谨慎操作。"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 20px;"
    />

    <!-- 钱包区域 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>实盘钱包</span>
          <div>
            <el-button type="success" size="small" @click="openWalletDialog('deposit')">充值</el-button>
            <el-button type="warning" size="small" @click="openWalletDialog('withdraw')">提现</el-button>
          </div>
        </div>
      </template>
      <div class="wallet-info">
        <div class="wallet-item">
          <span class="wallet-label">现金余额</span>
          <span class="wallet-value">${{ walletBalance.toFixed(2) }}</span>
        </div>
        <div class="wallet-item">
          <span class="wallet-label">持仓价值</span>
          <span class="wallet-value">${{ totalAssetValue.toFixed(2) }}</span>
        </div>
        <div class="wallet-item">
          <span class="wallet-label">总资产</span>
          <span class="wallet-value total">${{ (walletBalance + totalAssetValue).toFixed(2) }}</span>
        </div>
      </div>
    </el-card>

    <!-- 交易表单 -->
    <el-card class="section-card">
      <template #header><span>实盘交易</span></template>
      <el-form label-width="100px" class="trade-form">
        <el-form-item label="选择币种">
          <el-select v-model="selectedCoinId" filterable placeholder="请选择币种" style="width: 250px;">
            <el-option
              v-for="coin in coins"
              :key="coin.id"
              :label="`${coin.name} (${coin.symbol || ''})`"
              :value="coin.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前价格">
          <span style="font-size: 18px; font-weight: bold; color: #e6a23c;">
            {{ selectedCoinPrice > 0 ? formatPrice(selectedCoinPrice) : '请选择币种' }}
          </span>
        </el-form-item>
        <el-form-item label="交易数量">
          <el-input-number v-model="tradeAmount" :min="0" :precision="6" :step="0.1" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="交易总额">
          <span style="font-size: 16px; font-weight: bold;">
            ${{ totalCost.toFixed(2) }}
          </span>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="handleTrade('buy')" :loading="trading" :disabled="!selectedCoinId">
            买入
          </el-button>
          <el-button type="danger" @click="handleTrade('sell')" :loading="trading" :disabled="!selectedCoinId">
            卖出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 当前持仓 -->
    <el-card class="section-card">
      <template #header><span>当前持仓</span></template>
      <el-table :data="userAssets" style="width: 100%" border stripe empty-text="暂无持仓">
        <el-table-column prop="coin_name" label="币种" width="150" />
        <el-table-column prop="coin_symbol" label="代码" width="100" />
        <el-table-column label="持有数量" width="150">
          <template #default="{ row }">{{ row.amount.toFixed(6) }}</template>
        </el-table-column>
        <el-table-column label="当前价格" width="150">
          <template #default="{ row }">{{ formatPrice(row.current_price) }}</template>
        </el-table-column>
        <el-table-column label="当前价值">
          <template #default="{ row }">
            <span style="font-weight: bold;">${{ row.current_value.toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 交易记录 -->
    <el-card class="section-card">
      <template #header><span>最近交易记录</span></template>
      <el-table :data="tradeRecords" style="width: 100%" border stripe empty-text="暂无交易记录">
        <el-table-column prop="coin_symbol" label="币种" width="100" />
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-tag :type="row.action === 'buy' ? 'success' : 'danger'" size="small">
              {{ row.action === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="数量" width="120" />
        <el-table-column label="成交价" width="150">
          <template #default="{ row }">{{ formatPrice(row.price_at_transaction) }}</template>
        </el-table-column>
        <el-table-column label="总额" width="130">
          <template #default="{ row }">${{ row.total_value }}</template>
        </el-table-column>
        <el-table-column prop="timestamp" label="时间" />
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, sizes, prev, pager, next"
        style="margin-top: 16px;"
      />
    </el-card>

    <!-- 充值/提现弹窗 -->
    <el-dialog
      :title="walletAction === 'deposit' ? '实盘充值' : '实盘提现'"
      v-model="walletDialogVisible"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="金额 ($)">
          <el-input-number v-model="walletAmount" :min="0.01" :precision="2" :step="100" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="walletDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWallet">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.trade-container {
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
.wallet-info {
  display: flex;
  gap: 40px;
}
.wallet-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.wallet-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}
.wallet-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.wallet-value.total {
  color: #e6a23c;
}
.trade-form {
  max-width: 600px;
}
</style>
