<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchInvestmentPlans, createInvestmentPlan, deleteInvestmentPlan } from '@/utils/investapi'
import { ElMessage, ElMessageBox } from 'element-plus'

const plans = ref<any[]>([])
const loading = ref(false)

// 弹窗
const dialogVisible = ref(false)
const form = ref({
  cycle_period: 'monthly',
  start_date: '',
  target_amount: 0,
  stages: '[]' as string,
})

const loadPlans = async () => {
  loading.value = true
  try {
    const res = await fetchInvestmentPlans()
    plans.value = res.data
  } catch (e) {
    ElMessage.error('获取投资计划失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  form.value = { cycle_period: 'monthly', start_date: '', target_amount: 0, stages: '[]' }
  dialogVisible.value = true
}

const handleSave = async () => {
  let stages: any[] = []
  try {
    stages = JSON.parse(form.value.stages)
  } catch {
    ElMessage.error('阶段数据格式错误，请使用JSON数组格式')
    return
  }

  try {
    await createInvestmentPlan({
      cycle_period: form.value.cycle_period,
      start_date: form.value.start_date,
      target_amount: form.value.target_amount,
      stages,
    })
    ElMessage.success('投资计划创建成功')
    dialogVisible.value = false
    loadPlans()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该投资计划？', '警告', { type: 'warning' })
    await deleteInvestmentPlan(row.id)
    ElMessage.success('删除成功')
    loadPlans()
  } catch (e) {}
}

onMounted(() => {
  loadPlans()
})
</script>

<template>
  <div class="stage-container">
    <h1>投资阶段管理</h1>
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增投资计划</el-button>
      <el-button @click="loadPlans">刷新</el-button>
    </div>

    <el-table :data="plans" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="cycle_period" label="周期" width="120" />
      <el-table-column prop="start_date" label="开始时间" width="180" />
      <el-table-column prop="target_amount" label="目标金额" width="150" />
      <el-table-column label="阶段数据" min-width="300">
        <template #default="{ row }">
          <el-text v-if="row.stages">
            {{ JSON.stringify(row.stages) }}
          </el-text>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="新增投资计划" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="投资周期">
          <el-select v-model="form.cycle_period" style="width:100%">
            <el-option label="每日" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="每季度" value="quarterly" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.start_date" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width:100%" />
        </el-form-item>
        <el-form-item label="目标金额">
          <el-input-number v-model="form.target_amount" :min="0" :step="1000" style="width:100%" />
        </el-form-item>
        <el-form-item label="阶段数据">
          <el-input v-model="form.stages" type="textarea" :rows="4" placeholder="JSON格式，如: [{&quot;phase&quot;: 1, &quot;amount&quot;: 1000}]" />
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
.stage-container {
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