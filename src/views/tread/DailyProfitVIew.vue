<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchDailyProfits, calculateDailyProfit } from '@/utils/profitapi'
import { ElMessage } from 'element-plus'

const profitData = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(30)
const totalItems = ref(0)
const tradeType = ref('simulation')
const startDate = ref('')
const endDate = ref('')
const summary = ref({
  total_profit: 0,
  recent_7d_profit: 0,
  recent_30d_profit: 0,
})

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
    summary.value = res.data.summary
  } catch (e) {
    ElMessage.error('获取收益数据失败')
  } finally {
    loading.value = false
  }
}

const handleCalculate = async () => {
  try {
    const res = await calculateDailyProfit({ trade_type: tradeType.value })
    ElMessage.success(res.data.message || '计算完成')
    loadProfits()
  } catch (e) {
    ElMessage.error('计算日收益失败')
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadProfits()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadProfits()
}

const profitColor = (profit: number) => {
  if (profit > 0) return '#67c23a'
  if (profit < 0) return '#f56c6c'
  return '#909399'
}

onMounted(() => {
  loadProfits()
})
</script>

<template>
  <div class="daily-profit-container">
    <h1>日收益分析</h1>

    <!-- 汇总卡片 -->
    <div class="summary-cards">
      <el-card class="summary-card">
        <div class="card-label">总收益</div>
        <div class="card-value" :style="{ color: profitColor(summary.total_profit) }">
          {{ summary.total_profit >= 0 ? '+' : '' }}{{ summary.total_profit.toFixed(2) }} USD
        </div>
      </el-card>
      <el-card class="summary-card">
        <div class="card-label">近7天收益</div>
        <div class="card-value" :style="{ color: profitColor(summary.recent_7d_profit) }">
          {{ summary.recent_7d_profit >= 0 ? '+' : '' }}{{ summary.recent_7d_profit.toFixed(2) }} USD
        </div>
      </el-card>
      <el-card class="summary-card">
        <div class="card-label">近30天收益</div>
        <div class="card-value" :style="{ color: profitColor(summary.recent_30d_profit) }">
          {{ summary.recent_30d_profit >= 0 ? '+' : '' }}{{ summary.recent_30d_profit.toFixed(2) }} USD
        </div>
      </el-card>
    </div>

    <!-- 过滤工具栏 -->
    <div class="toolbar">
      <el-radio-group v-model="tradeType" @change="loadProfits">
        <el-radio-button value="simulation">模拟盘</el-radio-button>
        <el-radio-button value="real">实盘</el-radio-button>
      </el-radio-group>
      <el-date-picker v-model="startDate" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" style="width:150px" />
      <el-date-picker v-model="endDate" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" style="width:150px" />
      <el-button type="primary" @click="loadProfits">查询</el-button>
      <el-button type="success" @click="handleCalculate">计算今日收益</el-button>
    </div>

    <!-- 收益列表 -->
    <el-table :data="profitData" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="date" label="日期" width="150" sortable />
      <el-table-column label="收益 (USD)" width="200">
        <template #default="{ row }">
          <span :style="{ color: profitColor(row.profit), fontWeight: 'bold' }">
            {{ row.profit >= 0 ? '+' : '' }}{{ row.profit.toFixed(2) }}
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
  </div>
</template>

<style scoped>
.daily-profit-container {
  padding: 20px;
}
h1 {
  margin-bottom: 20px;
}
.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.summary-card {
  flex: 1;
  text-align: center;
}
.card-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}
.card-value {
  font-size: 24px;
  font-weight: bold;
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}
</style>
