<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createEcosystem, fetchAllEcosystems, updateEcosystem,deleteEcosystem } from '@/utils/coinapi';

// Define the interface for ecosystem data
interface Ecosystem {
  id: number | null
  name: string
  description: string
}

const openDialog = () => {
  console.log('open dialog')
  dialogVisible.value = true
}

// Reactive references for data and state
const ecosystems = ref<Ecosystem[]>([])
const dialogVisible = ref(false)
const formData = ref<Ecosystem>({
  id: null,
  name: '',
  description: ''
})
const formRef = ref() // Reference to the form instance

// Validation rules
const rules = {
  name: [{ required: true, message: '请输入生态系统名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入生态系统描述', trigger: 'blur' }]
}


// Function to load ecosystems from the backend
const loadEcosystems = async () => {
  try {
    const response = await fetchAllEcosystems()
    ecosystems.value = response.data
  } catch (error) {
    ElMessage.error('加载生态系统失败')
  }
}

// Function to reset the form data
const resetForm = () => {
  formData.value = { id: null, name: '', description: '' }
}

// Function to edit an ecosystem
const doeditEcosystem = (ecosystem: Ecosystem) => {
  formData.value = { ...ecosystem }
  dialogVisible.value = true
}
// Function to submit the form data
const submitForm = async () => {
  if(!formRef.value) return
  await formRef.value.validate(async() => {
    if (formData.value.id) {
      await updateEcosystem(
        formData.value.id,
        {
        name: formData.value.name,
        description: formData.value.description
      })
    } else {
      await createEcosystem({
        name: formData.value.name,
        description: formData.value.description
      })
    }
    dialogVisible.value = false
    loadEcosystems()
  })
}

// Function to delete an ecosystem
const doDeleteEcosystem = async (id: number) => {
  try {
    await deleteEcosystem(id)
    ElMessage.success('生态系统删除成功')
    loadEcosystems()
  } catch (error) {
    ElMessage.error('删除生态系统失败')
  }
}

// Load ecosystems when the component is mounted
onMounted(() => {
  loadEcosystems()
})

</script>
<template>
  <div>
    <el-button type="primary" @click="openDialog">创建生态系统</el-button>
    <el-dialog
      title="生态系统"
      v-model="dialogVisible"
      width="30%"
      :before-close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入生态系统名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" placeholder="请输入生态系统描述"></el-input>
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
    <el-table :data="ecosystems" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60"></el-table-column>
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
      <el-table-column prop="created_at" label="创建时间"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="text" @click="doeditEcosystem(row)">编辑</el-button>
          <el-button type="text" @click="doDeleteEcosystem(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<style scoped>
.dialog-footer {
  text-align: right;
}

.role-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
}
</style>
