<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createInvestmentInstitution, fetchAllInvestmentInstitutions, 
  updateInvestmentInstitution,
  DeleteInvestmentInstitution,
  fetchAllCoinInvestment,
  createCoinInvestment,
  updateCoinInvestment,
  deleteCoinInvestment
} from '@/utils/coinapi';

// Define the interface for investment institution data
interface InvestmentInstitution {
  id: number | null
  name: string
  description: string
}

//Define the interface for CoinInvestment data
interface CoinInvestment {
  id: number | null
  coin_id: number
  investment_institution_id: number
  investment_amount: number
  investment_date: string
}

const openInstitutionsDialog = () => {
  console.log('open dialog')
  InstitutionsdialogVisible.value = true
}
const openCoinInvestDialog = () => {
  console.log('open dialog')
  CoinInvestdialogVisible.value = true
}

// Reactive references for data and state
const investmentInstitutions = ref<InvestmentInstitution[]>([])
// Reactive references for data and state
const coinInvestments = ref<CoinInvestment[]>([])


// const dialog
const CoinInvestdialogVisible = ref(false)
const InstitutionsdialogVisible = ref(false)


const formData = ref<InvestmentInstitution>({
  id: null,
  name: '',
  description: ''
})
const formRef = ref() // Reference to the form instance

// Validation rules
const rules = {
  name: [{ required: true, message: '请输入投资机构名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入投资机构描述', trigger: 'blur' }]
}


// Function to load investment institutions from the backend
const loadInvestmentInstitutions = async () => {
  try {
    const response = await fetchAllInvestmentInstitutions()
    investmentInstitutions.value = response.data
  } catch (error) {
    ElMessage.error('加载投资机构失败')
  }
}

// Function to reset the form data
const resetForm = () => {
  formData.value = { id: null, name: '', description: '' }
}

// Function to edit an investment institution
const doeditInvestmentInstitution = (investmentInstitution: InvestmentInstitution) => {
  formData.value = { ...investmentInstitution }
  dialogVisible.value = true
}
// Function to submit the form data
const submitForm = async () => {
  if(!formRef.value) return
  await formRef.value.validate(async() => {
    if (formData.value.id) {
      await updateInvestmentInstitution(
        formData.value.id,
        {
        name: formData.value.name,
        description: formData.value.description
      })
      ElMessage.success('投资机构更新成功')
    } else {
      await createInvestmentInstitution({
        name: formData.value.name,
        description: formData.value.description
      })
      ElMessage.success('投资机构创建成功')
    }
    dialogVisible.value = false
    loadInvestmentInstitutions()
  })
}

// Function to delete an investment institution
const doDeleteInvestmentInstitution = async (id: number) => {
  try {
    await DeleteInvestmentInstitution(id)
    ElMessage.success('投资机构删除成功')
    loadInvestmentInstitutions()
  } catch (error) {
    ElMessage.error('删除投资机构失败')
  }
}

// Lifecycle hook
onMounted(() => {
  loadInvestmentInstitutions()
})
</script>
<template>
  <div>
    <el-button type="primary" @click="openDialog">添加投资机构</el-button>
    <el-dialog
      title="添加投资机构"
      v-model="dialogInstiutionsVisible"
      width="30%"
      :before-close="resetForm"
    >
      <el-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        label-width="100px"
      >
        <el-form-item label="投资机构名称" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item label="投资机构描述" prop="description">
          <el-input v-model="formData.description"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog title="投资机构信息编辑" v-model="dialogCoinInvestmentVisible" width="30%" :before-close="resetForm">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="投资机构名称" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item label="投资机构描述" prop="description">
          <el-input v-model="formData.description"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
      
    </el-dialog>
    <el-table :data="investmentInstitutions" style="width: 100%">
      <el-table-column prop="name" label="投资机构名称"></el-table-column>
      <el-table-column prop="description" label="投资机构描述"></el-table-column>
      <el-table-column prop="coinInvestments" lable="投资币种">
        <template #default="{ scope }">
          <span v-for="perm in scope.row.CoinInvestment" :key="perm" class="perm-tag">{{ perm }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button type="text" @click="doeditInvestmentInstitution(row)">编辑</el-button>
          <el-button type="text" @click="doDeleteInvestmentInstitution(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<style scoped>
.perm-tag {
  margin-right: 5px;
  padding: 5px;
  border-radius: 5px;
  background-color: #f0f0f0;
}
</style>
