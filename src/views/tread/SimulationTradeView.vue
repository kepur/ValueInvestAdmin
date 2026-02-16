<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchWalletBalance, updateWallet, executeTrade, fetchTradeRecords, fetchUserAssets, fetchLimitOrders, createLimitOrder, cancelLimitOrder } from '@/utils/tradapi'
import { fetchCurrentMarketPrice } from '@/utils/priceapi'
import { fetchAllCoins } from '@/utils/coinapi'

const TRADE_TYPE = 'simulation'

// 钱包
const walletBalance = ref(0)
const walletDialogVisible = ref(false)
const walletAction = ref<'deposit' | 'withdraw'>('deposit')
const walletAmount = ref(100)

// 实时价格 + 币种列表
const marketPrices = ref<any[]>([])
const coins = ref<any[]>([])

// 交易模式: market(市价) / limit(限价)
const tradeMode = ref<'market' | 'limit'>('market')
// 数量模式: quantity(按数量) / amount(按金额)
const amountMode = ref<'quantity' | 'amount'>('quantity')

// 交易表单
const selectedCoinId = ref<number | null>(null)
const tradeAmount = ref(0) // 交易数量 (Coin)
const tradeTotal = ref(0)  // 交易金额 (USDT)
const limitPrice = ref(0)
const trading = ref(false)

// 持仓
const userAssets = ref<any[]>([])
const totalAssetValue = ref(0)

// 委托单
const limitOrders = ref<any[]>([])
const orderPage = ref(1)
const orderPageSize = ref(10)
const orderTotal = ref(0)

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
  if (tradeMode.value === 'limit') {
    return tradeAmount.value * limitPrice.value
  }
  // 市价模式下，如果按金额交易，直接返回 tradeTotal
  if (amountMode.value === 'amount') {
    return tradeTotal.value
  }
  return tradeAmount.value * selectedCoinPrice.value
})

// 监听输入变化，自动计算另一方
const onAmountChange = () => {
  if (selectedCoinPrice.value > 0) {
    if (amountMode.value === 'quantity') {
      tradeTotal.value = Number((tradeAmount.value * selectedCoinPrice.value).toFixed(2))
    } else {
      tradeAmount.value = Number((tradeTotal.value / selectedCoinPrice.value).toFixed(6))
    }
  }
}

const onTotalChange = () => {
    if (selectedCoinPrice.value > 0 && amountMode.value === 'amount') {
         tradeAmount.value = Number((tradeTotal.value / selectedCoinPrice.value).toFixed(6))
    }
}

// 加载钱包余额
const loadWallet = async () => {
  try {
    const res = await fetchWalletBalance()
    walletBalance.value = res.data.simulation_balance || 0
  } catch (e) {
    console.error('加载钱包余额失败', e)
  }
}

// 加载实时价格
// 加载实时价格 (从数据库)
const loadPrices = async () => {
  try {
    const res = await fetchCurrentMarketPrice()
    // 转换数据格式适配
    marketPrices.value = (res.data || []).map((item: any) => ({
      symbol: item.symbol,
      price: item.prices && item.prices.length > 0 ? item.prices[0].price : 0
    }))
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

// 加载委托单
const loadOrders = async () => {
  try {
    const res = await fetchLimitOrders({
      trade_type: TRADE_TYPE,
      page: orderPage.value,
      pageSize: orderPageSize.value,
    })
    limitOrders.value = res.data.data || []
    orderTotal.value = res.data.total || 0
  } catch (e) {
    console.error('加载委托单失败', e)
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
  loadOrders()
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

// 市价交易
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

// 限价委托
const handleLimitOrder = async (orderType: 'buy' | 'sell') => {
  if (!selectedCoinId.value) {
    ElMessage.warning('请选择币种')
    return
  }
  if (tradeAmount.value <= 0) {
    ElMessage.warning('委托数量必须大于0')
    return
  }
  if (limitPrice.value <= 0) {
    ElMessage.warning('委托价格必须大于0')
    return
  }

  trading.value = true
  try {
    const res = await createLimitOrder({
      coin_id: selectedCoinId.value,
      order_type: orderType,
      quantity: tradeAmount.value,
      limit_price: limitPrice.value,
      trade_type: TRADE_TYPE,
    })
    ElMessage.success(res.data.message || '委托创建成功')
    tradeAmount.value = 0
    limitPrice.value = 0
    refreshAll()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '委托失败')
  } finally {
    trading.value = false
  }
}

// 撤销委托单
const handleCancelOrder = async (orderId: number) => {
  try {
    await ElMessageBox.confirm('确定撤销此委托单？', '撤单确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await cancelLimitOrder(orderId)
    ElMessage.success('委托单已撤销')
    refreshAll()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error || '撤单失败')
    }
  }
}

// 选择币种时自动填充限价为当前市价
const onCoinChange = () => {
  if (selectedCoinPrice.value > 0) {
    limitPrice.value = selectedCoinPrice.value
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
const handleOrderPageChange = (page: number) => {
  orderPage.value = page
  loadOrders()
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
  loadOrders()
})
</script>

<template>
  <div class="trade-container">
    <!-- 钱包区域 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>模拟钱包</span>
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
      <template #header>
        <div class="card-header">
          <span>模拟交易</span>
          <el-radio-group v-model="tradeMode" size="small">
            <el-radio-button value="market">市价交易</el-radio-button>
            <el-radio-button value="limit">限价委托</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <el-form label-width="100px" class="trade-form">
        <el-form-item label="选择币种">
          <el-select v-model="selectedCoinId" filterable placeholder="请选择币种" style="width: 250px;" @change="onCoinChange">
            <el-option
              v-for="coin in coins"
              :key="coin.id"
              :label="`${coin.name} (${coin.symbol || ''})`"
              :value="coin.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前市价">
          <span style="font-size: 18px; font-weight: bold; color: #409eff;">
            {{ selectedCoinPrice > 0 ? formatPrice(selectedCoinPrice) : '请选择币种' }}
          </span>
        </el-form-item>
        <el-form-item v-if="tradeMode === 'limit'" label="委托价格">
          <el-input-number v-model="limitPrice" :min="0" :precision="6" :step="0.01" style="width: 200px;" />
          <el-button link type="primary" style="margin-left: 8px;" @click="limitPrice = selectedCoinPrice" :disabled="selectedCoinPrice <= 0">
            使用市价
          </el-button>
        </el-form-item>
        <el-form-item label="交易方式" v-if="tradeMode === 'market'">
            <el-radio-group v-model="amountMode" size="small" @change="onAmountChange">
                <el-radio-button label="quantity">按数量 (Coin)</el-radio-button>
                <el-radio-button label="amount">按金额 (USDT)</el-radio-button>
            </el-radio-group>
        </el-form-item>
        
        <el-form-item label="交易数量" v-if="amountMode === 'quantity' || tradeMode === 'limit'">
          <el-input-number v-model="tradeAmount" :min="0" :precision="6" :step="0.1" style="width: 200px;" @change="onAmountChange" />
          <span style="margin-left: 10px; color: #909399;">{{ coins.find(c => c.id === selectedCoinId)?.symbol }}</span>
        </el-form-item>
        
        <el-form-item label="交易金额" v-if="amountMode === 'amount' && tradeMode === 'market'">
             <el-input-number v-model="tradeTotal" :min="0" :precision="2" :step="100" style="width: 200px;" @change="onTotalChange" />
             <span style="margin-left: 10px; color: #909399;">USDT</span>
        </el-form-item>

        <el-form-item label="预计价值">
          <span style="font-size: 16px; font-weight: bold;">
            ${{ totalCost.toFixed(2) }}
          </span>
          <span v-if="amountMode === 'amount'" style="margin-left: 10px; font-size: 12px; color: #909399;">
            (≈ {{ tradeAmount }} {{ coins.find(c => c.id === selectedCoinId)?.symbol }})
          </span>
        </el-form-item>
        <el-form-item>
          <template v-if="tradeMode === 'market'">
            <el-button type="success" @click="handleTrade('buy')" :loading="trading" :disabled="!selectedCoinId">
              买入
            </el-button>
            <el-button type="danger" @click="handleTrade('sell')" :loading="trading" :disabled="!selectedCoinId">
              卖出
            </el-button>
          </template>
          <template v-else>
            <el-button type="success" @click="handleLimitOrder('buy')" :loading="trading" :disabled="!selectedCoinId">
              委托买入
            </el-button>
            <el-button type="danger" @click="handleLimitOrder('sell')" :loading="trading" :disabled="!selectedCoinId">
              委托卖出
            </el-button>
          </template>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 委托单 -->
    <el-card class="section-card">
      <template #header><span>委托单</span></template>
      <el-table :data="limitOrders" style="width: 100%" border stripe empty-text="暂无委托单">
        <el-table-column prop="coin_symbol" label="币种" width="100" />
        <el-table-column label="方向" width="80">
          <template #default="{ row }">
            <el-tag :type="row.order_type === 'buy' ? 'success' : 'danger'" size="small">
              {{ row.order_type === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="委托数量" width="120">
          <template #default="{ row }">{{ row.quantity.toFixed(6) }}</template>
        </el-table-column>
        <el-table-column label="委托价格" width="150">
          <template #default="{ row }">{{ formatPrice(row.limit_price) }}</template>
        </el-table-column>
        <el-table-column label="委托总额" width="130">
          <template #default="{ row }">${{ row.total_value }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'pending' ? 'warning' : row.status === 'filled' ? 'success' : 'info'"
              size="small"
            >
              {{ row.status === 'pending' ? '待成交' : row.status === 'filled' ? '已成交' : '已撤销' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              link
              @click="handleCancelOrder(row.id)"
            >
              撤单
            </el-button>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="orderTotal > orderPageSize"
        @current-change="handleOrderPageChange"
        :current-page="orderPage"
        :page-size="orderPageSize"
        :total="orderTotal"
        layout="total, prev, pager, next"
        style="margin-top: 16px;"
      />
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
      :title="walletAction === 'deposit' ? '模拟充值' : '模拟提现'"
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
  color: #409eff;
}
.trade-form {
  max-width: 600px;
}
</style>
