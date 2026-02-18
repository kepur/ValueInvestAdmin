<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchPortfolioAnalysis } from '@/utils/investapi'
import { resetSimulation } from '@/utils/tradapi'
import { ElMessage, ElMessageBox } from 'element-plus'

const portfolioData = ref<any>(null)
const loading = ref(false)
const tradeType = ref('simulation')

const loadPortfolio = async () => {
  loading.value = true
  try {
    const res = await fetchPortfolioAnalysis({ trade_type: tradeType.value })
    portfolioData.value = res.data
  } catch (e) {
    ElMessage.error('获取投资组合数据失败')
  } finally {
    loading.value = false
  }
}

const handleReset = async () => {
  try {
    await ElMessageBox.confirm('确定要清空模拟盘所有数据吗？此操作不可恢复！', '模拟盘清零', { type: 'warning' })
    await resetSimulation()
    ElMessage.success('模拟盘已清零')
    loadPortfolio()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('清零失败')
  }
}

const formatUSD = (value: number) => {
  return '$ ' + (value || 0).toFixed(2)
}

onMounted(() => {
  loadPortfolio()
})
</script>

<template>
  <div class="portfolio-container">
    <h1>投资组合分析</h1>

    <div class="toolbar">
      <el-radio-group v-model="tradeType" @change="loadPortfolio">
        <el-radio-button value="simulation">模拟盘</el-radio-button>
        <el-radio-button value="real">实盘</el-radio-button>
      </el-radio-group>
      <el-button type="primary" @click="loadPortfolio">刷新</el-button>
      <el-button v-if="tradeType === 'simulation'" type="danger" @click="handleReset">清零模拟盘</el-button>
    </div>

    <div v-if="portfolioData" v-loading="loading">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <el-card class="overview-card">
          <div class="card-label">总资产价值</div>
          <div class="card-value">{{ formatUSD(portfolioData.total_asset_value) }}</div>
        </el-card>
        <el-card class="overview-card">
          <div class="card-label">钱包余额</div>
          <div class="card-value">{{ formatUSD(portfolioData.wallet_balance) }}</div>
        </el-card>
        <el-card class="overview-card highlight">
          <div class="card-label">投资组合总价值</div>
          <div class="card-value">{{ formatUSD(portfolioData.total_portfolio_value) }}</div>
        </el-card>
        <el-card class="overview-card" v-if="portfolioData.target_amount">
          <div class="card-label">目标金额</div>
          <div class="card-value">{{ formatUSD(portfolioData.target_amount) }}</div>
        </el-card>
      </div>

      <!-- 分配占比 -->
      <h2 style="margin: 20px 0 10px">资产分配</h2>
      <el-table :data="portfolioData.allocation" style="width: 100%" border>
        <el-table-column prop="type_name" label="类型" width="200" />
        <el-table-column label="价值 (USD)" width="200">
          <template #default="{ row }">
            {{ formatUSD(row.value) }}
          </template>
        </el-table-column>
        <el-table-column label="占比" width="200">
          <template #default="{ row }">
            <el-progress :percentage="row.percentage" :stroke-width="16" :text-inside="true" />
          </template>
        </el-table-column>
      </el-table>

      <!-- 持仓详情 -->
      <h2 style="margin: 20px 0 10px">持仓详情</h2>
      <el-table :data="portfolioData.assets" style="width: 100%" border>
        <el-table-column prop="coin_symbol" label="代号" width="100" />
        <el-table-column prop="coin_name" label="币种" width="150" />
        <el-table-column prop="amount" label="数量" width="120" />
        <el-table-column label="当前价格" width="150">
          <template #default="{ row }">
            {{ formatUSD(row.current_price) }}
          </template>
        </el-table-column>
        <el-table-column label="资产价值" width="150">
          <template #default="{ row }">
            {{ formatUSD(row.asset_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="trade_coin_type" label="分类" width="120" />
        <el-table-column label="投资比例" width="120">
          <template #default="{ row }">
            {{ row.investment_ratio ? row.investment_ratio.toFixed(1) + '%' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="preference_level" label="偏好等级" width="100" />
      </el-table>
    </div>

    <el-empty v-else-if="!loading" description="暂无投资组合数据" />
  </div>
</template>

<style scoped>
.portfolio-container {
  padding: 20px;
}
h1 {
  margin-bottom: 20px;
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}
.overview-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.overview-card {
  flex: 1;
  min-width: 200px;
  text-align: center;
}
.overview-card.highlight {
  border: 2px solid #409eff;
}
.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.card-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}
</style>
