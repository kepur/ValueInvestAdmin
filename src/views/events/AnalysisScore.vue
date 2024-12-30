<script setup lang="ts">
import { ref } from 'vue';

// 示例数据
const tableData = ref([
  {
    name: '泰达币',
    symbol: 'USDT',
    features: '稳定币，旨在将加密货币的价格稳定在1美元，广泛用于交易和价值存储',
    issueDate: '2014年2月',
    issueAmount: '无限供应',
    marketCap: '约1398亿美元',
    allTimeHigh: '$1.32',
    currentPrice: '$1.32',
    growthPotential: '稳定币，价格波动极小，增长潜力有限（评分：4分）',
    celebrityEndorsement: '无知名人士公开推荐（评分：5分）',
    chainScore: 10,
    lockupPlan: 10,
    marketScarcity: 10,
    historicalPerformance: 5,
    institutionalHoldings: 10,
    fdvRatio: 10,
    supplyInflation: 10,
    hasMainChain: '是',
    totalScore: 90,
  },
  // 其他代币数据...
]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(100);

// 批量操作状态
const showSelection = ref(false);

// 模型选项
const modelOptions = ['ChatGPT', 'xAi', 'DeepSeek'];
const selectedBatchModel = ref(''); // 批量选择的模型

// 选中的代币
const selectedTokens = ref<any[]>([]);

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pageSize.value = size;
};

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

// 处理单行打分评估
const handleEvaluate = (row: any, model: string) => {
  console.log('评估代币:', row.name, '模型:', model);
  // 这里可以调用评估接口
};

// 处理批量打分评估
const handleBatchEvaluate = () => {
  if (selectedTokens.value.length === 0) {
    console.log('请先选择代币');
    return;
  }
  if (!selectedBatchModel.value) {
    console.log('请先选择模型');
    return;
  }
  console.log('批量评估代币:', selectedTokens.value, '模型:', selectedBatchModel.value);
  // 这里可以调用批量评估接口
};
</script>

<template>
  <div class="risk-assessment">
    <h1>代币风险评估</h1>
    <div class="toolbar">
      <el-button type="primary" @click="showSelection = !showSelection">
        批量操作
      </el-button>
      <el-select v-model="selectedBatchModel" placeholder="选择模型" class="model-select">
        <el-option
          v-for="option in modelOptions"
          :key="option"
          :label="option"
          :value="option"
        />
      </el-select>
      <el-button type="primary" @click="handleBatchEvaluate">批量打分评估</el-button>
      <el-input placeholder="搜索代币" class="search-input" />
      <el-button type="primary">刷新</el-button>
    </div>
    <el-table
      :data="tableData"
      style="width: 100%"
      border
      @selection-change="selectedTokens = $event"
    >
      <!-- 勾选框列 -->
      <el-table-column v-if="showSelection" type="selection" width="55" />
      <!-- 代币信息列 -->
      <el-table-column prop="name" label="代币名称" sortable />
      <el-table-column prop="symbol" label="代币符号" sortable />
      <el-table-column prop="features" label="主要特点" />
      <el-table-column prop="issueDate" label="发行时间" sortable />
      <el-table-column prop="issueAmount" label="发行量" sortable />
      <el-table-column prop="marketCap" label="市值" sortable />
      <el-table-column prop="allTimeHigh" label="历史最高价" sortable />
      <el-table-column prop="currentPrice" label="当前价格" sortable />
      <el-table-column prop="growthPotential" label="增长潜力" sortable />
      <el-table-column prop="celebrityEndorsement" label="名人推荐" sortable />
      <el-table-column prop="chainScore" label="链上规模及主流性评分（10%）" sortable />
      <el-table-column prop="lockupPlan" label="锁仓与释放计划（10%）" sortable />
      <el-table-column prop="marketScarcity" label="市值与稀缺性（15%）" sortable />
      <el-table-column prop="historicalPerformance" label="历史表现（5%）" sortable />
      <el-table-column prop="institutionalHoldings" label="机构持仓（5%）" sortable />
      <el-table-column prop="fdvRatio" label="FDV比率（5%）" sortable />
      <el-table-column prop="supplyInflation" label="供应与通胀（5%）" sortable />
      <el-table-column prop="hasMainChain" label="是否有主链" sortable />
      <el-table-column prop="totalScore" label="综合评分（100分）" sortable />
      <!-- 模型选择列 -->
      <el-table-column label="选择模型">
        <template #default="{ row }">
          <el-select v-model="row.selectedModel" placeholder="选择模型">
            <el-option
              v-for="option in modelOptions"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
        </template>
      </el-table-column>
      <!-- 打分评估列 -->
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button
            type="primary"
            :disabled="!row.selectedModel"
            @click="handleEvaluate(row, row.selectedModel)"
          >
            打分评估
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="totalItems"
      layout="total, sizes, prev, pager, next, jumper"
    />
  </div>
</template>

<style scoped>
.risk-assessment {
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

.model-select {
  width: 150px;
}

.search-input {
  width: 200px;
}

.el-table {
  margin-bottom: 20px;
}

.el-pagination {
  text-align: right;
}
</style>