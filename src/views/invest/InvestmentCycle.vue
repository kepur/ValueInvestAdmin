<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchCycleTypes, createCycleType, updateCycleType, deleteCycleType } from '@/utils/investapi'
import { ElMessage, ElMessageBox } from 'element-plus'

const cycleTypes = ref<any[]>([])
const loading = ref(false)

// 弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(0)
const form = ref({
  name: '',
  description: '',
  duration: 30,
  duration_unit: 'days',
})

const loadCycleTypes = async () => {
  loading.value = true
  try {
    const res = await fetchCycleTypes()
    cycleTypes.value = res.data
  } catch (e) {
    ElMessage.error('获取周期类型失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  isEdit.value = false
  form.value = { name: '', description: '', duration: 30, duration_unit: 'days' }
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  editingId.value = row.id
  form.value = {
    name: row.name,
    description: row.description || '',
    duration: row.duration,
    duration_unit: row.duration_unit || 'days',
  }
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await updateCycleType(editingId.value, form.value)
      ElMessage.success('更新成功')
    } else {
      await createCycleType(form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadCycleTypes()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定删除该周期类型？', '警告', { type: 'warning' })
    await deleteCycleType(row.id)
    ElMessage.success('删除成功')
    loadCycleTypes()
  } catch (e) {}
}

onMounted(() => {
  loadCycleTypes()
})
</script>

<template>
  <div class="cycle-container">
    <h1>投资周期管理</h1>
    <div class="toolbar">
      <el-button type="primary" @click="handleCreate">新增周期类型</el-button>
      <el-button @click="loadCycleTypes">刷新</el-button>
    </div>

    <el-table :data="cycleTypes" style="width: 100%" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="周期名称" width="150" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="duration" label="时长" width="100" />
      <el-table-column prop="duration_unit" label="单位" width="100" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="isEdit ? '编辑周期类型' : '新增周期类型'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="周期名称">
          <el-input v-model="form.name" placeholder="如: 短线, 中线, 长线" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="时长">
          <el-input-number v-model="form.duration" :min="1" />
        </el-form-item>
        <el-form-item label="单位">
          <el-select v-model="form.duration_unit" style="width:100%">
            <el-option label="天" value="days" />
            <el-option label="周" value="weeks" />
            <el-option label="月" value="months" />
          </el-select>
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
.cycle-container {
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