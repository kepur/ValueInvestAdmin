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
  institution_id: number
  holding_amount: number
  holding_percentage: number
}

const openInstitutionsDialog = () => {
  console.log('open Institutions dialog')
  InstitutionsdialogVisible.value = true
}
const openCoinInvestDialog = () => {
  console.log('open CoinInvest dialog')
  CoinInvestdialogVisible.value = true
}

// Reactive references for data and state
const investmentInstitutions = ref<InvestmentInstitution[]>([])
// Reactive references for data and state
const coinInvestments = ref<CoinInvestment[]>([])


// const dialog
const CoinInvestdialogVisible = ref(false)
const InstitutionsdialogVisible = ref(false)


const InstitutionformData = ref<InvestmentInstitution>({
  id: null,
  name: '',
  description: ''
})


const CoinInvestformData = ref<CoinInvestment>({
  id: null,
  coin_id: 0,
  institution_id: 0,
  holding_amount: 0,
  holding_percentage: 0
})

const CoinInvestformRef = ref() // Reference to the form instance
const InstitutionformRef = ref() // Reference to the form instance

// Validation rules
const Institutionrules = {
  name: [{ required: true, message: '请输入投资机构名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入投资机构描述', trigger: 'blur' }]
}
// Validation rules
const CoinInvestrules = {
  coin_id: [{ required: true, message: '请输入币种ID', trigger: 'blur' }],
  investment_institution_id: [{ required: true, message: '请输入投资机构ID', trigger: 'blur' }],
  investment_amount: [{ required: true, message: '请输入投资金额', trigger: 'blur' }],
  investment_date: [{ required: true, message: '请输入投资日期', trigger: 'blur' }]
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

// Function to load coin investments from the backend
const loadCoinInvestments = async () => {
  try {
    const response = await fetchAllCoinInvestment()
    coinInvestments.value = response.data
  } catch (error) {
    ElMessage.error('加载投资信息失败')
  }
}

// Function to reset the form data
const InstitutionresetForm = () => {
  InstitutionformData.value = { id: null, name: '', description: '' }
}
// Function to reset the form data
const CoinInvestresetForm = () => {
  CoinInvestformData.value = { id: null, coin_id: 0, institution_id: 0, holding_amount: 0, holding_percentage: 0 }
}


// Function to edit an investment institution
const doeditInvestmentInstitution = (investmentInstitution: InvestmentInstitution) => {
  InstitutionformData.value = { ...investmentInstitution }
  InstitutionsdialogVisible.value = true
}

// Function to edit a coin investment
const doeditCoinInvestment = (coinInvestment: CoinInvestment) => {
  CoinInvestformData.value = { ...coinInvestment }
  CoinInvestdialogVisible.value = true
}


// Function to submit the form data
const InstitutionsubmitForm = async () => {
  console.log('submitting form')
  if(!InstitutionformRef.value) return
  await InstitutionformRef.value.validate(async() => {
    if (InstitutionformData.value.id) {
      await updateInvestmentInstitution(
        InstitutionformData.value.id,
        {
        name: InstitutionformData.value.name,
        description: InstitutionformData.value.description
      })
      ElMessage.success('投资机构更新成功')
    } 
    else {
      console.log('create investment institution')
      await createInvestmentInstitution({        
        name: InstitutionformData.value.name,
        description: InstitutionformData.value.description
      })
      ElMessage.success('投资机构创建成功')
    }
    InstitutionsdialogVisible.value = false
    InstitutionresetForm()
    loadInvestmentInstitutions()
  })
}

// Function to submit the form data

const CoinInvestsubmitForm = async () => {
  if(!CoinInvestformRef.value) return
  await CoinInvestformRef.value.validate(async() => {
    if (CoinInvestformData.value.id) {
      await updateCoinInvestment(
        CoinInvestformData.value.id,
        {
        coin_id: CoinInvestformData.value.coin_id,
        institution_id: CoinInvestformData.value.institution_id,
        holding_amount: CoinInvestformData.value.holding_amount,
        holding_percentage: CoinInvestformData.value.holding_percentage
      })
      ElMessage.success('投资信息更新成功')
    } else {
      await createCoinInvestment({
        coin_id: CoinInvestformData.value.coin_id,
        institution_id: CoinInvestformData.value.institution_id,
        holding_amount: CoinInvestformData.value.holding_amount,
        holding_percentage: CoinInvestformData.value.holding_percentage
      })
      ElMessage.success('投资信息创建成功')
    }
    CoinInvestdialogVisible.value = false
    loadCoinInvestments()
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


// Function to delete a coin investment
const doDeleteCoinInvestment = async (id: number) => {
  try {
    await deleteCoinInvestment(id)
    ElMessage.success('投资信息删除成功')
    loadCoinInvestments()
  } catch (error) {
    ElMessage.error('删除投资信息失败')
  }
}

// Lifecycle hook
onMounted(() => {
  loadInvestmentInstitutions()
  loadCoinInvestments()
})
</script>
<template>
  <div>
    <el-button type="primary" @click="openInstitutionsDialog">添加投资机构</el-button>
    <el-button type="primary" @click="openCoinInvestDialog">机构投资添加</el-button>

    // Investment Institution Dialog
    <el-dialog
      title="添加投资机构"
      v-model="InstitutionsdialogVisible"
      width="30%"
      :before-close="InstitutionresetForm"
    >
      <el-form
        :model="InstitutionformData"
        :rules="Institutionrules"
        ref="InstitutionformRef"
        label-width="100px"
      >
        <el-form-item label="机构名称" prop="name">
          <el-input v-model="InstitutionformData.name"></el-input>
        </el-form-item>
        <el-form-item label="机构描述" prop="description">
          <el-input v-model="InstitutionformData.description"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="InstitutionsdialogVisible = false;InstitutionresetForm()">取 消</el-button>
        <el-button type="primary" @click="InstitutionsubmitForm">确 定</el-button>
      </span>
    </el-dialog>


    // CoinInvestment Dialog
    <el-dialog 
    title="投资机构信息编辑" 
    v-model="CoinInvestdialogVisible" 
    width="30%" 
    :before-close="CoinInvestresetForm">
      <el-form :model="CoinInvestformData" :rules="CoinInvestrules" ref="CoinInvestformRef" label-width="100px">
        <el-form-item label="币种名称" prop="name">
          <el-input v-model="CoinInvestformData.coin_id"></el-input>
        </el-form-item>
        <el-form-item label="持有量" prop="holding_amount">
          <el-input v-model="CoinInvestformData.holding_amount"></el-input>
        </el-form-item>
        <el-form-item label="持有百分比" prop="holding_percentage">
          <el-input v-model="CoinInvestformData.holding_percentage"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="CoinInvestdialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="CoinInvestformData">确 定</el-button>
      </span>
    </el-dialog>
    
    // Investment Institution Table
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
          <el-button  @click="doeditInvestmentInstitution(row)">编辑</el-button>
          <el-button type="danger" @click="doDeleteInvestmentInstitution(row.id)">删除</el-button>
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
