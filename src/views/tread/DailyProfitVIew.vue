<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchDailyProfits, calculateDailyProfit, fetchProfitStatistics } from '@/utils/profitapi'
import { ElMessage } from 'element-plus'

const profitData = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(30)
const totalItems = ref(0)
const tradeType = ref('simulation')
const startDate = ref('')
const endDate = ref('')

// 多周期统计
const periods = ref<any[]>([])
const maxDrawdown = ref(0)
const totalDeposits = ref(0)
const currentValue = ref(0)
const curveData = ref<any[]>([])

const loadProfits = async () => {
  loading.value = true
  try {
    const res = await fetchDailyProfits({
      trade_type: tradeType.value,
      start_date: startDate.value,
      end_date: endDate.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    })
    profitData.value = res.data.data
    totalItems.value = res.data.total
  } catch (e) {
    ElMessage.error('获取收益数据失败')
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const res = await fetchProfitStatistics({ trade_type: tradeType.value })
    periods.value = res.data.periods || []
    maxDrawdown.value = res.data.max_drawdown || 0
    totalDeposits.value = res.data.total_deposits || 0
    currentValue.value = res.data.current_value || 0
    curveData.value = res.data.curve || []
  } catch (e) {
    console.error('获取统计数据失败', e)
  }
}

const handleCalculate = async () => {
  try {
    const res = await calculateDailyProfit({ trade_type: tradeType.value })
    ElMessage.success(res.data.message || '计算完成')
    loadProfits()
    loadStatistics()
  } catch (e) {
    ElMessage.error('计算日收益失败')
  }
}

const handleTradeTypeChange = () => {
  loadProfits()
  loadStatistics()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadProfits()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadProfits()
}

const profitColor = (val: number) => {
  if (val > 0) return '#67c23a'
  if (val < 0) return '#f56c6c'
  return '#909399'
}

const formatProfit = (val: number) => {
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val.toFixed(2)}`
}

onMounted(() => {
  loadProfits()
  loadStatistics()
})
</script>

<template>
  <div class="daily-profit-container">
    <h1>收益统计</h1>

    <!-- 过滤工具栏 -->
    <div class="toolbar">
      <el-radio-group v-model="tradeType" @change="handleTradeTypeChange">
        <el-radio-button value="simulation">模拟盘</el-radio-button>
        <el-radio-button value="real">实盘</el-radio-button>
      </el-radio-group>
      <el-button type="success" @click="handleCalculate">计算今日收益</el-button>
    </div>

    <!-- 资产概览 -->
    <div class="overview-row">
      <el-card class="overview-card">
        <div class="card-label">总充值</div>
        <div class="card-value">${{ totalDeposits.toFixed(2) }}</div>
      </el-card>
      <el-card class="overview-card">
        <div class="card-label">当前持仓价值</div>
        <div class="card-value">${{ currentValue.toFixed(2) }}</div>
      </el-card>
      <el-card class="overview-card">
        <div class="card-label">最大回撤</div>
        <div class="card-value" :style="{ color: maxDrawdown > 0 ? '#f56c6c' : '#909399' }">
          {{ maxDrawdown.toFixed(2) }}%
        </div>
      </el-card>
    </div>

    <!-- 多周期收益卡片 -->
    <div class="period-cards">
      <el-card v-for="p in periods" :key="p.key" class="period-card">
        <div class="card-label">{{ p.label }}</div>
        <div class="card-value" :style="{ color: profitColor(p.profit) }">
          {{ formatProfit(p.profit) }} USD
        </div>
        <div class="card-rate" :style="{ color: profitColor(p.profit_rate) }">
          {{ formatProfit(p.profit_rate) }}%
        </div>
      </el-card>
    </div>

    <!-- 收益曲线（简表形式） -->
    <el-card v-if="curveData.length > 0" class="section-card">
      <template #header><span>累计收益曲线（最近180天）</span></template>
      <el-table :data="curveData" style="width: 100%" border stripe max-height="400">
        <el-table-column prop="date" label="日期" width="150" />
        <el-table-column label="当日收益" width="150">
          <template #default="{ row }">
            <span :style="{ color: profitColor(row.daily_profit), fontWeight: 'bold' }">
              {{ formatProfit(row.daily_profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="累计收益">
          <template #default="{ row }">
            <span :style="{ color: profitColor(row.cumulative_profit), fontWeight: 'bold' }">
              {{ formatProfit(row.cumulative_profit) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 日收益明细 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>日收益明细</span>
          <div style="display:flex;gap:10px;align-items:center;">
            <el-date-picker v-model="startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width:150px" />
            <el-date-picker v-model="endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width:150px" />
            <el-button type="primary" @click="loadProfits">查询</el-button>
          </div>
        </div>
      </template>
      <el-table :data="profitData" style="width: 100%" v-loading="loading" border>
        <el-table-column prop="date" label="日期" width="150" sortable />
        <el-table-column label="收益 (USD)" width="200">
          <template #default="{ row }">
            <span :style="{ color: profitColor(row.profit), fontWeight: 'bold' }">
              {{ formatProfit(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="trade_type" label="交易类型" width="120" />
      </el-table>

      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px"
      />
    </el-card>
  </div>
</template>

<style scoped>
.daily-profit-container {
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
.overview-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.overview-card {
  flex: 1;
  text-align: center;
}
.period-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.period-card {
  flex: 1;
  min-width: 140px;
  text-align: center;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.card-value {
  font-size: 22px;
  font-weight: bold;
}
.card-rate {
  font-size: 14px;
  margin-top: 4px;
}
.section-card {
  margin-bottom: 20px;
}
</style>
