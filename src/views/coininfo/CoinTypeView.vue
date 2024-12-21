<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAllCoinTypes, createCoinType, updateCoinType, DeleteCoinType } from '@/utils/coinapi'

// Define the interface for coin type data
interface CoinType {
  id: number | null
  type_name: string
  description: string
}

const openDialog = () => {
  console.log('open dialog')
  dialogVisible.value = true
}

// Reactive references for data and state
const coinTypes = ref<CoinType[]>([])
const dialogVisible = ref(false)
const formData = ref<CoinType>({
  id: null,
  type_name: '',
  description: ''
})
const formRef = ref() // Reference to the form instance

// Validation rules
const rules = {
  type_name: [{ required: true, message: '请输入币种类型名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入币种类型描述', trigger: 'blur' }]
}


// Function to load coin types from the backend
const loadCoinTypes = async () => {
  try {
    const response = await fetchAllCoinTypes()
    coinTypes.value = response.data
  } catch (error) {
    ElMessage.error('加载币种类型失败')
  }
}

// Function to reset the form data
const resetForm = () => {
  formData.value = { id: null, type_name: '', description: '' }
}

// Function to submit the form data
const submitForm = async () => {
  if(!formRef.value) return
  await formRef.value.validate(async() => {
    if (formData.value.id) {
      await updateCoinType(
        formData.value.id,
        {
        type_name: formData.value.type_name,
        description: formData.value.description
      })
      ElMessage.success('币种类型更新成功')
    } else {
      await createCoinType({
        type_name: formData.value.type_name,
        description: formData.value.description
    })
    ElMessage.success('币种类型创建成功')
  }
    dialogVisible.value = false
    resetForm()
    loadCoinTypes()
  })
}

// Function to edit a coin type
const editCoinType = (coinType: CoinType) => {
  formData.value = { ...coinType }
  dialogVisible.value = true
}

// Function to delete a coin type
const doDeleteCoinType = async (id: number) => {
  try {
    await DeleteCoinType(id)
    ElMessage.error('删除币种类型成功')
    loadCoinTypes()
  } catch (error) {
    ElMessage.error('删除币种类型失败')
  }
}

// Load coin types when the component is mounted
onMounted(() => {
  loadCoinTypes()
  // setTimeout(() => {
  //   dialogVisible.value = true
  //   console.log('Dialog should be visible now')
  // }, 2000)
})


</script>
<template>
  <div>
    <el-button type="primary" @click="openDialog">创建币种类型</el-button>
    <el-table :data="coinTypes" style="width: 100%">
      <el-table-column prop="id" label="ID" width="100"></el-table-column>
      <el-table-column prop="type_name" label="名称"></el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="text" @click="editCoinType(row)">编辑</el-button>
          <el-button type="text" @click="doDeleteCoinType(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog
      title="创建币种类型"
      v-model="dialogVisible"
      width="30%"
      :before-close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.type_name"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description"></el-input>
        </el-form-item>
      </el-form>
      <!-- 修改按钮区域 -->
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false; resetForm()">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>

  </div>
</template>
<style scoped>
  .dialog-footer {
    text-align: right;
  }
  .perm-tag {
    display: inline-block;
    background-color: #f0f0f0;
    padding: 2px 6px;
    margin: 2px;
    border-radius: 4px;
  }
</style>