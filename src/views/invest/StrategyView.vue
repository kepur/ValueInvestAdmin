<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchStrategies, createStrategy, updateStrategy, deleteStrategy, fetchCycleTypes } from '@/utils/investapi'
import { fetchAllCoinTypes } from '@/utils/coinapi'
import { ElMessage, ElMessageBox } from 'element-plus'

// 数据状态
const strategies = ref<any[]>([])
const cycleTypes = ref<any[]>([])
const coinTypes = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const searchKeyword = ref('')

// 弹窗相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const form = ref({
  name: '',
  cycle_type_id: null as number | null,
  coin_type_id: null as number | null,
  buy_levels: '' as string,
  stop_loss: 0,
  wait_zone: '',
  rebound_targets: '' as string,
  volatility_coefficient: 1.0,
  priority: 100,
  action: '',
  is_global: false,
})

// 获取策略列表
const loadStrategies = async () => {
  loading.value = true
  try {
    const res = await fetchStrategies({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchKeyword.value
    })
    strategies.value = res.data.data
    totalItems.value = res.data.total
  } catch (e) {
    ElMessage.error('获取策略列表失败')
  } finally {
    loading.value = false
  }
}

// 获取选项数据
const loadOptions = async () => {
  try {
    const [ctRes, coinTypeRes] = await Promise.all([
      fetchCycleTypes(),
      fetchAllCoinTypes()
    ])
    cycleTypes.value = ctRes.data
    coinTypes.value = coinTypeRes.data
  } catch (e) {
    console.error('加载选项数据失败', e)
  }
}

// 打开创建弹窗
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 打开编辑弹窗
const handleEdit = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    name: row.name,
    cycle_type_id: row.cycle_type_id,
    coin_type_id: row.coin_type_id,
    buy_levels: Array.isArray(row.buy_levels) ? row.buy_levels.join(',') : '',
    stop_loss: row.stop_loss,
    wait_zone: row.wait_zone,
    rebound_targets: Array.isArray(row.rebound_targets) ? row.rebound_targets.join(',') : '',
    volatility_coefficient: row.volatility_coefficient,
    priority: row.priority,
    action: row.action,
    is_global: row.is_global,
  }
  dialogVisible.value = true
}

// 保存策略
const handleSave = async () => {
  const submitData = {
    ...form.value,
    buy_levels: form.value.buy_levels ? form.value.buy_levels.split(',').map(Number) : [],
    rebound_targets: form.value.rebound_targets ? form.value.rebound_targets.split(',').map(Number) : [],
  }

  try {
    if (isEdit.value) {
      await updateStrategy(editingId.value, submitData)
      ElMessage.success('策略更新成功')
    } else {
      await createStrategy(submitData as any)
      ElMessage.success('策略创建成功')
    }
    dialogVisible.value = false
    loadStrategies()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

// 删除策略
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该策略？', '警告', { type: 'warning' })
    await deleteStrategy(row.id)
    ElMessage.success('删除成功')
    loadStrategies()
  } catch (e) {
    // 用户取消
  }
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    cycle_type_id: null,
    coin_type_id: null,
    buy_levels: '',
    stop_loss: 0,
    wait_zone: '',
    rebound_targets: '',
    volatility_coefficient: 1.0,
    priority: 100,
    action: '',
    is_global: false,
  }
}

// 分页事件
const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadStrategies()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadStrategies()
}

onMounted(() => {
  loadStrategies()
  loadOptions()
})
</script>

<template>
  <div class="strategy-container">
    <h1>投资策略管理</h1>
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增策略</el-button>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索策略名称"
        style="width: 250px"
        @keyup.enter="loadStrategies"
      />
      <el-button type="primary" @click="loadStrategies">搜索</el-button>
    </div>

    <el-table :data="strategies" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="name" label="策略名称" width="150" />
      <el-table-column prop="cycle_type_name" label="周期类型" width="120" />
      <el-table-column prop="coin_type_name" label="币种类型" width="120" />
      <el-table-column prop="priority" label="优先级" width="80" sortable />
      <el-table-column prop="stop_loss" label="止损(%)" width="100" />
      <el-table-column prop="volatility_coefficient" label="波动系数" width="100" />
      <el-table-column prop="action" label="操作动作" width="120" />
      <el-table-column prop="wait_zone" label="等待区间" width="120" />
      <el-table-column label="买入级别" width="150">
        <template #default="{ row }">
          {{ Array.isArray(row.buy_levels) ? row.buy_levels.join(', ') : row.buy_levels }}
        </template>
      </el-table-column>
      <el-table-column label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.is_global ? 'success' : 'info'">
            {{ row.is_global ? '全局' : '个人' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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
      style="margin-top: 20px"
    />

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="isEdit ? '编辑策略' : '新增策略'" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="策略名称">
          <el-input v-model="form.name" placeholder="请输入策略名称" />
        </el-form-item>
        <el-form-item label="周期类型">
          <el-select v-model="form.cycle_type_id" placeholder="选择周期类型" style="width: 100%">
            <el-option v-for="ct in cycleTypes" :key="ct.id" :label="ct.name" :value="ct.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="币种类型">
          <el-select v-model="form.coin_type_id" placeholder="选择币种类型" style="width: 100%">
            <el-option v-for="ct in coinTypes" :key="ct.id" :label="ct.type_name" :value="ct.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="买入级别">
          <el-input v-model="form.buy_levels" placeholder="逗号分隔，如: -5,-10,-15,-20" />
        </el-form-item>
        <el-form-item label="止损(%)">
          <el-input-number v-model="form.stop_loss" :min="-100" :max="0" />
        </el-form-item>
        <el-form-item label="等待区间">
          <el-input v-model="form.wait_zone" placeholder="如: 70000-75000" />
        </el-form-item>
        <el-form-item label="反弹目标">
          <el-input v-model="form.rebound_targets" placeholder="逗号分隔，如: 5,10,15" />
        </el-form-item>
        <el-form-item label="波动系数">
          <el-input-number v-model="form.volatility_coefficient" :min="0" :max="10" :step="0.1" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="form.priority" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="操作动作">
          <el-input v-model="form.action" placeholder="如: 批量买入, 止损卖出" />
        </el-form-item>
        <el-form-item label="全局策略">
          <el-switch v-model="form.is_global" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.strategy-container {
  padding: 20px;
  overflow-x: auto;
}
h1 {
  margin-bottom: 20px;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}
/* T-0305 表格横向滚动、弹窗小屏自适应 */
.strategy-container :deep(.el-table) {
  min-width: 900px;
}
@include respond-md {
  .strategy-container :deep(.el-dialog) {
    width: 90% !important;
    max-width: 600px;
  }
}
</style>
