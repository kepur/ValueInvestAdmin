<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchInvestmentAllocations, createInvestmentAllocation, updateInvestmentAllocation, deleteInvestmentAllocation } from '@/utils/investapi'
import { ElMessage, ElMessageBox } from 'element-plus'

const allocations = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const form = ref({
  total_investment: 0,
  trade_type_id: 1,
  total_return: 0,
  diversification_score: 0,
})

const loadAllocations = async () => {
  loading.value = true
  try {
    const res = await fetchInvestmentAllocations({
      page: currentPage.value,
      pageSize: pageSize.value,
    })
    allocations.value = res.data.data
    totalItems.value = res.data.total
  } catch (e) {
    ElMessage.error('获取投资分配失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.value = { total_investment: 0, trade_type_id: 1, total_return: 0, diversification_score: 0 }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    total_investment: row.total_investment,
    trade_type_id: row.trade_type_id,
    total_return: row.total_return || 0,
    diversification_score: row.diversification_score || 0,
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await updateInvestmentAllocation(editingId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createInvestmentAllocation(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadAllocations()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除？', '警告', { type: 'warning' })
    await deleteInvestmentAllocation(row.id)
    ElMessage.success('删除成功')
    loadAllocations()
  } catch (e) {}
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  loadAllocations()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadAllocations()
}

onMounted(() => {
  loadAllocations()
})
</script>

<template>
  <div class="allocation-container">
    <h1>投资比例管理</h1>
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增分配</el-button>
      <el-button @click="loadAllocations">刷新</el-button>
    </div>

    <el-table :data="allocations" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="total_investment" label="投资总额" width="150" />
      <el-table-column prop="trade_type_name" label="交易类型" width="120" />
      <el-table-column prop="total_return" label="总回报" width="120" />
      <el-table-column prop="diversification_score" label="分散化评分" width="120" />
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

    <el-dialog :title="isEdit ? '编辑投资分配' : '新增投资分配'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="120px">
        <el-form-item label="投资总额">
          <el-input-number v-model="form.total_investment" :min="0" :step="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="交易类型">
          <el-select v-model="form.trade_type_id" style="width:100%">
            <el-option label="模拟盘" :value="1" />
            <el-option label="实盘" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="总回报">
          <el-input-number v-model="form.total_return" :step="10" style="width:100%" />
        </el-form-item>
        <el-form-item label="分散化评分">
          <el-input-number v-model="form.diversification_score" :min="0" :max="100" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.allocation-container {
  padding: 20px;
}
h1 {
  margin-bottom: 20px;
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
</style>
