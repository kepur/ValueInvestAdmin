<template>
  <div class="backtest-view">
    <!-- 配置面板 -->
    <el-card class="config-panel">
      <template #header>
        <div class="card-header">
          <span>回测配置</span>
        </div>
      </template>

      <el-form :model="config" label-width="120px" size="small">
        <!-- 第一行：策略模板 + 币种 + 日期范围 + 初始资金 -->
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="策略模板">
              <el-select
                v-model="config.template_id"
                placeholder="选择策略模板"
                clearable
                @change="onTemplateChange"
              >
                <el-option
                  v-for="t in templates"
                  :key="t.id"
                  :label="t.name"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="回测币种">
              <el-select
                v-model="config.coin_ids"
                placeholder="选择币种（多选）"
                multiple
                clearable
              >
                <el-option
                  v-for="c in coins"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="初始资金">
              <el-input-number
                v-model="config.initial_capital"
                :min="1000"
                :step="1000"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 实验参数组 -->
      <el-divider />

      <div class="experiments-section">
        <h4 style="margin-bottom: 15px">实验参数配置</h4>
        <el-table :data="config.experiments" size="small" style="margin-bottom: 10px">
          <el-table-column prop="name" label="实验名称" width="150">
            <template #default="{ row, $index }">
              <el-input v-model="row.name" placeholder="例：基准" size="small" />
            </template>
          </el-table-column>

          <el-table-column prop="buy_level_multiplier" label="买入倍率" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.buy_level_multiplier"
                :min="0.1"
                :max="3"
                :step="0.1"
                :precision="1"
                controls-position="right"
              />
            </template>
          </el-table-column>

          <el-table-column prop="stop_loss_multiplier" label="止损倍率" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.stop_loss_multiplier"
                :min="0.1"
                :max="3"
                :step="0.1"
                :precision="1"
                controls-position="right"
              />
            </template>
          </el-table-column>

          <el-table-column label="操作" width="100">
            <template #default="{ $index }">
              <el-button
                text
                type="danger"
                size="small"
                @click="removeExperiment($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-button type="primary" size="small" @click="addExperiment">
          + 新增实验
        </el-button>
      </div>

      <!-- 运行按钮 -->
      <el-divider />
      <div style="text-align: right">
        <el-button
          type="primary"
          size="default"
          :loading="running"
          @click="handleRunBacktest"
        >
          {{ running ? "运行中..." : "运行回测" }}
        </el-button>
      </div>
    </el-card>

    <!-- 结果区 (tabs) -->
    <el-tabs
      v-if="results.length > 0"
      class="results-tabs"
      style="margin-top: 20px"
    >
      <!-- Tab 1: 对比摘要 -->
      <el-tab-pane label="对比摘要">
        <el-table :data="results" size="small">
          <el-table-column prop="name" label="实验名称" width="150" />
          <el-table-column label="总收益(%)" align="center" width="150">
            <template #default="{ row }">
              <span :class="{ positive: row.summary.total_return_pct > 0, negative: row.summary.total_return_pct < 0 }">
                {{ row.summary.total_return_pct }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column label="最大回撤(%)" align="center" width="150">
            <span class="negative">{{ row.summary.max_drawdown_pct }}%</span>
          </el-table-column>
          <el-table-column label="交易次数" align="center" width="120" prop="summary.trade_count" />
          <el-table-column label="胜率" align="center" width="120">
            <template #default="{ row }">
              {{ (row.summary.win_rate * 100).toFixed(1) }}%
            </template>
          </el-table-column>
          <el-table-column label="最终权益" align="center" width="150" prop="summary.final_equity" />
        </el-table>
      </el-tab-pane>

      <!-- Tab 2: 权益曲线 -->
      <el-tab-pane label="权益曲线">
        <div class="chart-container">
          <el-table :data="equityCurveData" size="small" :default-sort="{ prop: 'date', order: 'ascending' }">
            <el-table-column prop="date" label="日期" width="120" sortable />
            <el-table-column
              v-for="(result, idx) in results"
              :key="idx"
              :label="result.name"
              align="center"
            >
              <template #default="{ row }">
                {{ getEquityForDate(row.date, idx) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 收益归因 -->
      <el-tab-pane label="收益归因">
        <el-row v-if="results.length > 0" :gutter="20">
          <el-col :span="12">
            <h4 style="margin-bottom: 10px">按币种归因</h4>
            <el-select
              v-model="selectedExperimentForAttr"
              placeholder="选择实验"
              style="margin-bottom: 10px; width: 100%"
              size="small"
            >
              <el-option
                v-for="(r, idx) in results"
                :key="idx"
                :label="r.name"
                :value="idx"
              />
            </el-select>
            <el-table
              :data="getCurrentByCoinAttribution"
              size="small"
              :default-sort="{ prop: 'pnl', order: 'descending' }"
            >
              <el-table-column prop="coin_name" label="币种" width="100" />
              <el-table-column label="收益" align="center" width="100">
                <template #default="{ row }">
                  <span :class="{ positive: row.pnl > 0, negative: row.pnl < 0 }">
                    {{ row.pnl.toFixed(2) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="交易数" align="center" width="80" prop="trade_count" />
              <el-table-column label="胜数" align="center" width="80" prop="win_count" />
            </el-table>
          </el-col>

          <el-col :span="12">
            <h4 style="margin-bottom: 10px">按信号归因</h4>
            <el-table
              :data="getCurrentBySignalAttribution"
              size="small"
              :default-sort="{ prop: 'pnl', order: 'descending' }"
            >
              <el-table-column prop="signal" label="信号" width="150" />
              <el-table-column label="收益" align="center" width="100">
                <template #default="{ row }">
                  <span :class="{ positive: row.pnl > 0, negative: row.pnl < 0 }">
                    {{ row.pnl.toFixed(2) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="触发次数" align="center" width="100" prop="count" />
            </el-table>
          </el-col>
        </el-row>
      </el-tab-pane>

      <!-- Tab 4: 交易明细 -->
      <el-tab-pane label="交易明细">
        <el-row :gutter="20" style="margin-bottom: 15px">
          <el-col :span="6">
            <el-select
              v-model="selectedExperimentForTrades"
              placeholder="选择实验"
              size="small"
              @change="tradePageNo = 1"
            >
              <el-option
                v-for="(r, idx) in results"
                :key="idx"
                :label="r.name"
                :value="idx"
              />
            </el-select>
          </el-col>
        </el-row>

        <el-table
          :data="getCurrentTradesPaginated"
          size="small"
          :default-sort="{ prop: 'date', order: 'descending' }"
        >
          <el-table-column prop="date" label="日期" width="120" />
          <el-table-column prop="coin_name" label="币种" width="100" />
          <el-table-column label="方向" align="center" width="80">
            <template #default="{ row }">
              <span :class="{ positive: row.action === 'buy', negative: row.action === 'sell' }">
                {{ row.action === 'buy' ? '买入' : '卖出' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="right" width="100" prop="quantity" />
          <el-table-column label="价格" align="right" width="100" prop="price" />
          <el-table-column label="金额" align="right" width="100" prop="amount" />
          <el-table-column label="触发信号" width="150" prop="triggered_by" />
          <el-table-column label="盈亏" align="right" width="100">
            <template #default="{ row }">
              <span v-if="row.pnl !== null" :class="{ positive: row.pnl > 0, negative: row.pnl < 0 }">
                {{ row.pnl.toFixed(2) }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="tradePageNo"
          v-model:page-size="tradePageSize"
          :page-sizes="[10, 20, 50]"
          :total="getCurrentTrades.length"
          layout="total, sizes, prev, pager, next"
          style="margin-top: 15px; text-align: right"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 空状态 -->
    <el-empty
      v-if="!running && results.length === 0"
      description="请配置参数后运行回测"
      style="margin-top: 60px"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchStrategyTemplates,
  fetchAllCoins,
  runBacktest,
} from '@/utils/investapi'

interface Config {
  template_id: number | null
  coin_ids: number[]
  start_date: string
  end_date: string
  initial_capital: number
  experiments: Array<{
    name: string
    buy_level_multiplier: number
    stop_loss_multiplier: number
  }>
}

const config = ref<Config>({
  template_id: null,
  coin_ids: [],
  start_date: '',
  end_date: '',
  initial_capital: 10000,
  experiments: [
    {
      name: '基准',
      buy_level_multiplier: 1.0,
      stop_loss_multiplier: 1.0,
    },
  ],
})

const dateRange = ref<[string, string] | null>(null)
const templates = ref<any[]>([])
const coins = ref<any[]>([])
const running = ref(false)
const results = ref<any[]>([])

const selectedExperimentForAttr = ref(0)
const selectedExperimentForTrades = ref(0)
const tradePageNo = ref(1)
const tradePageSize = ref(10)

// 初始化数据
async function initializeData() {
  try {
    const [templatesRes, coinsRes] = await Promise.all([
      fetchStrategyTemplates({ active_only: 'true' }),
      fetchAllCoins(),
    ])
    templates.value = templatesRes.data || []
    coins.value = coinsRes.data || []
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

function onTemplateChange() {
  // Reset when template changes
}

function addExperiment() {
  config.value.experiments.push({
    name: `实验${config.value.experiments.length + 1}`,
    buy_level_multiplier: 1.0,
    stop_loss_multiplier: 1.0,
  })
}

function removeExperiment(index: number) {
  if (config.value.experiments.length > 1) {
    config.value.experiments.splice(index, 1)
  } else {
    ElMessage.warning('至少需要保留一个实验')
  }
}

async function handleRunBacktest() {
  // Validate
  if (
    !config.value.template_id ||
    config.value.coin_ids.length === 0 ||
    !dateRange.value ||
    dateRange.value.length !== 2
  ) {
    ElMessage.error('请完整填写配置参数')
    return
  }

  running.value = true
  try {
    const response = await runBacktest({
      template_id: config.value.template_id,
      coin_ids: config.value.coin_ids,
      start_date: dateRange.value[0],
      end_date: dateRange.value[1],
      initial_capital: config.value.initial_capital,
      experiments: config.value.experiments,
    })
    results.value = response.data.experiments || []
    ElMessage.success('回测完成')
  } catch (error) {
    ElMessage.error('回测执行失败')
  } finally {
    running.value = false
  }
}

// 权益曲线计算
const equityCurveData = computed(() => {
  if (results.value.length === 0) return []
  const firstResult = results.value[0]
  return firstResult.equity_curve || []
})

function getEquityForDate(date: string, experimentIndex: number): string {
  const result = results.value[experimentIndex]
  if (!result || !result.equity_curve) return '-'
  const point = result.equity_curve.find((p: any) => p.date === date)
  return point ? point.value.toFixed(2) : '-'
}

// 归因数据
const getCurrentByCoinAttribution = computed(() => {
  if (results.value.length === 0) return []
  const result = results.value[selectedExperimentForAttr.value]
  return result?.attribution?.by_coin || []
})

const getCurrentBySignalAttribution = computed(() => {
  if (results.value.length === 0) return []
  const result = results.value[selectedExperimentForAttr.value]
  return result?.attribution?.by_signal || []
})

// 交易明细分页
const getCurrentTrades = computed(() => {
  if (results.value.length === 0) return []
  const result = results.value[selectedExperimentForTrades.value]
  return result?.trades || []
})

const getCurrentTradesPaginated = computed(() => {
  const trades = getCurrentTrades.value
  const start = (tradePageNo.value - 1) * tradePageSize.value
  const end = start + tradePageSize.value
  return trades.slice(start, end)
})

// 初始化
initializeData()
</script>

<style scoped>
.backtest-view {
  padding: 20px;
}

.config-panel {
  background-color: #f5f7fa;
}

.experiments-section {
  background-color: #fff;
  padding: 15px;
  border-radius: 4px;
}

.results-tabs {
  margin-top: 20px;
}

.chart-container {
  min-height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #303133;
}

.positive {
  color: #67c23a;
  font-weight: bold;
}

.negative {
  color: #f56c6c;
  font-weight: bold;
}
</style>
