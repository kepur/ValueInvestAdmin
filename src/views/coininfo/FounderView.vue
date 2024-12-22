<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createFounder, fetchAllFounders, updateFounder,deleteFounder } from '@/utils/coinapi';

// Define the interface for founder data
interface Founder {
  id: number | null
  name: string
  team_name: string
  reputation_score: number
}

const EditDialogVisible = ref(false)

const openDialog = () => {
  console.log('open dialog')
  dialogVisible.value = true
}

// Reactive references for data and state
const founders = ref<Founder[]>([])
const dialogVisible = ref(false)
const formData = ref<Founder>({
  id: null,
  name: '',
  team_name: '',
  reputation_score: 0
})
const formRef = ref() // Reference to the form instance

// Validation rules

const rules = {
  name: [{ required: true, message: '请输入创始人名称', trigger: 'blur' }],
  team_name: [{ required: true, message: '请输入创始人描述', trigger: 'blur' }],
  refutation_score: [{ required: false, message: '请输入创始人声誉分数', trigger: 'blur' }]
}


// Function to load founders from the backend
const loadFounders = async () => {
  try {
    const response = await fetchAllFounders()
    founders.value = response.data
  } catch (error) {
    ElMessage.error('加载创始人失败')
  }
}

// Function to reset the form data
const resetForm = () => {
  EditDialogVisible.value = false
  dialogVisible.value = false
  formData.value = { id: null, name: '', team_name: '', reputation_score: 0 }
}

// Function to edit an founder
const doeditFounder = (founder: Founder) => {
  formData.value = { ...founder }
  dialogVisible.value = true
  EditDialogVisible.value = true
}
// Function to delete an founder
const doDeleteFounder = async (id: number) => {
  await deleteFounder(id)
  loadFounders()
}

// Function to submit the form data
const submitForm = async () => {
  if(!formRef.value) return
  await formRef.value.validate(async() => {
    if (formData.value.id) {
      await updateFounder(
        formData.value.id,
        {
        name: formData.value.name,
        team_name: formData.value.team_name,
        reputation_score: formData.value.reputation_score
      })
    } else {
      await createFounder({
        name: formData.value.name,
        team_name: formData.value.team_name,
        reputation_score: formData.value.reputation_score
      })
    }
    EditDialogVisible.value = false
    dialogVisible.value = false
    loadFounders()
  })
}

onMounted(() => {
  loadFounders()
})
</script>
<template>
  <div>
    <el-button type="primary" @click="openDialog">创建创始人</el-button>
    <el-dialog
      :title="EditDialogVisible? '编辑创始人信息':'添加创始人信息' "
      v-model="dialogVisible"
      width="30%"
      :before-close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="创始人名称" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item label="团队名称" prop="team_name">
          <el-input v-model="formData.team_name"></el-input>
        </el-form-item>
        <el-form-item label="声誉分数" prop="reputation_score">
          <el-input v-model="formData.reputation_score"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>
    <el-table :data="founders" style="width: 100%">
      <el-table-column prop="name" label="创始人名称"></el-table-column>
      <el-table-column prop="team_name" label="团队名称"></el-table-column>
      <el-table-column prop="reputation_score" label="声誉分数"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button  @click="doeditFounder(row)">编辑</el-button>
          <el-button type="danger" @click="doDeleteFounder(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<style scoped>

.dialog-footer {
  text-align: right;
}

</style>
