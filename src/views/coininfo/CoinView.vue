<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createCoin, fetchAllCoins, updateCoin, deleteCoin } from '@/utils/coinapi'
import { fetchAllCoinTypes,fetchAllEcosystems,fetchAllFounders,fetchAllInvestmentInstitutions } from '@/utils/coinapi';
import { formatDateToTimezone } from '@/utils/utillibs'
import { vi } from 'element-plus/es/locales.mjs';
// Define the interface for coin data
interface Coin {
  id: number | null
  name: string
  description: string
  issuance_date: Date
  is_active: boolean
  ecosystem_id: number | null
  founders: string[]
  investment_institutions: string[]
  coin_types: string[]
}



const openDialog = () => {
  console.log('open dialog')
  dialogVisible.value = true
  
}

// Reactive references for data and state

const coins = ref<Coin[]>([])

const dialogVisible = ref(false)
const Editbtnvisable = ref(false)

const formData = ref<Coin>({
  id: null,
  name: '',
  description: '',
  issuance_date: new Date(),
  is_active: true,
  ecosystem_id: null ,
  founders: [],
  investment_institutions: [],
  coin_types: []
})

const formRef = ref() // Reference to the form instance
interface CoinType {
  id: number
  type_name: string
}

interface Ecosystem {
  id: number
  name: string
}
interface Founder {
  id: number
  name: string
}

interface InvestmentInstitution {
  id: number
  name: string
}

const coinTypes = ref<CoinType[]>([])
const ecosystems = ref<Ecosystem[]>([])
const founders = ref<Founder[]>([])
const investmentInstitutions = ref<InvestmentInstitution[]>([])

// Validation rules
const rules = {
  name: [{ required: true, message: '请输入币种名称', trigger: 'blur' }],
  description: [{ required: false, message: '请输入币种描述', trigger: 'blur' }],
  issuance_date: [{ required: false, message: '请输入发行日期', trigger: 'blur' }],
  is_active: [{ required: false, message: '请输入是否活跃', trigger: 'blur' }],
  ecosystem_id: [{ required: false, message: '请输入生态系统ID', trigger: 'blur' }],
  founders: [{ required: false, message: '请输入创始人', trigger: 'blur' }],
  investment_institutions: [{ required: false, message: '请输入投资机构', trigger: 'blur' }],
  coin_types: [{ required: false, message: '请输入币种类型', trigger: 'blur' }]
}

const loadCoins = async () => {
  try {
    const response = await fetchAllCoins();
    // 格式化每个币种的 issuance_date
    coins.value = response.data.map((coin: any) => {
      return {
        ...coin,
        issuance_date: formatDateToTimezone({ date: coin.issuance_date }),
      };
    });
  } catch (error) {
    ElMessage.error('加载币种失败');
  }
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

// Function to load ecosystems from the backend
const loadEcosystems = async () => {
  try {
    const response = await fetchAllEcosystems()
    ecosystems.value = response.data
  } catch (error) {
    ElMessage.error('加载生态系统失败')
  }
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
  dialogVisible.value = false
  Editbtnvisable.value = false
  formData.value = { id: null, name: '', description: '', issuance_date: new Date(), is_active: true, ecosystem_id: 0, founders: [], investment_institutions: [], coin_types: [] }
}

// Function to edit a coin
const doeditCoin = (coin: Coin) => {
  formData.value = { ...coin }
  dialogVisible.value = true
  Editbtnvisable.value = true
    // 如果生态系统数据已经加载，校验并设置默认值
  if (ecosystems.value.length > 0) {
    const foundEcosystem = ecosystems.value.find(
      (item) => item.id === coin.ecosystem_id
    );
    if (foundEcosystem) {
      formData.value.ecosystem_id = foundEcosystem.id;
    } else {
      formData.value.ecosystem_id = null; // 如果找不到对应的生态系统
    }
  } else {
    // 如果生态系统数据尚未加载，延迟检查
    loadEcosystems().then(() => {
      const foundEcosystem = ecosystems.value.find(
        (item) => item.id === coin.ecosystem_id
      );
      formData.value.ecosystem_id = foundEcosystem ? foundEcosystem.id : null;
    });
  }
}
// Function to delete a coin
const doDeleteCoin = async (id: number) => {
  await deleteCoin(id)
  loadCoins()
}

// Function to submit the form data
const submitForm = async () => {
  if(!formRef.value) return
  await formRef.value.validate(async() => {
    if (formData.value.id) {
      console.log("更新日期",formData.value.issuance_date)
      await updateCoin(
        formData.value.id,
        {
        name: formData.value.name,
        description: formData.value.description,
        issuance_date: new Date(formatDateToTimezone({ date: formData.value.issuance_date })),
        is_active: formData.value.is_active,
        ecosystem_id: formData.value.ecosystem_id === 0 ? null : formData.value.ecosystem_id, // 如果是0则设置为空
        founders: formData.value.founders,
        investment_institutions: formData.value.investment_institutions,
        coin_types: formData.value.coin_types
      })
      ElMessage.success('币种更新成功')
    } else {
      console.log("创建日期",formData.value.issuance_date)
      await createCoin({
        name: formData.value.name,
        description: formData.value.description,
        issuance_date: new Date(formatDateToTimezone({ date: formData.value.issuance_date })),
        is_active: formData.value.is_active,
        ecosystem_id: formData.value.ecosystem_id,
        founders: formData.value.founders,
        investment_institutions: formData.value.investment_institutions,
        coin_types: formData.value.coin_types
    })
    ElMessage.success('币种创建成功')
  }
    dialogVisible.value = false
    Editbtnvisable.value = false
    resetForm()
    loadCoins()
  })
}

// Load coins when the component is mounted
onMounted(async() => {
  await loadEcosystems()
  await loadCoins()
  await loadCoinTypes()
  await loadFounders()
  await loadInvestmentInstitutions()
})
</script>
<template>
  <div>
    <el-button type="primary" @click="openDialog">添加币种</el-button>
    <el-table :data="coins" style="width: 100%">
      <el-table-column prop="name" label="币种名称"></el-table-column>
      <el-table-column prop="description" label="币种描述"></el-table-column>
      <el-table-column prop="issuance_date" label="发行日期"></el-table-column>
      <el-table-column prop="is_active" label="是否活跃"></el-table-column>
      <el-table-column prop="ecosystem_name" label="生态系统">
      </el-table-column>
      <el-table-column prop="founders" label="创始人">
        <template #default="{ row }">
          <span v-for="founder in row.founders" :key="founder" class="perm-tag">{{ founder }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="investment_institutions" label="投资机构">
        <template #default="{ row }">
          <span v-for="investment_institution in row.investment_institutions" :key="investment_institution" class="perm-tag">{{ investment_institution }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="coin_types" label="币种类型">
        <template #default="{ row }">
          <span v-for="coin_type in row.coin_types" :key="coin_type" class="perm-tag">{{ coin_type }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button @click="doeditCoin(row)">编辑</el-button>
          <el-button type="danger" @click="doDeleteCoin(row.id)">删除</el-button>
  
        </template>
      </el-table-column>
    </el-table>


    <el-dialog
      :title="Editbtnvisable ? '编辑币种':'添加币种'"
      v-model="dialogVisible"
      :before-close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="币种名称" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item label="币种描述" prop="description">
          <el-input v-model="formData.description"></el-input>
        </el-form-item>
        <el-form-item label="发行日期" prop="issuance_date">
          <el-date-picker v-model="formData.issuance_date" type="date" 
          placeholder="选择日期" 
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="是否活跃" prop="is_active">
          <el-switch v-model="formData.is_active"></el-switch>
        </el-form-item>
        <el-form-item label="生态系统ID" prop="ecosystem_id">
          <el-select v-model="formData.ecosystem_id" placeholder="请选择生态系统">
            <el-option
              v-for="item in ecosystems"
              :key="item.id"
              :label="item.name"
              :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创始人" prop="founders">
            <el-select v-model="formData.founders" multiple filterable placeholder="请选择创始人">
              <el-option
                v-for="item in founders"
                :key="item.id"
                :label="item.name"
                :value="item.name">
              </el-option>
            </el-select>
        </el-form-item>
        <el-form-item label="投资机构" prop="investment_institutions">
            <el-select v-model="formData.investment_institutions" multiple filterable placeholder="请选择投资机构">
              <el-option
                v-for="item in investmentInstitutions"
                :key="item.id"
                :label="item.name"
                :value="item.name">
              </el-option>
            </el-select>
        </el-form-item>
        <el-form-item label="币种类型" prop="coin_types">
            <el-select v-model="formData.coin_types" multiple filterable placeholder="请选择币种类型">
              <el-option
                v-for="item in coinTypes"
                :key="item.id"
                :label="item.type_name"
                :value="item.type_name">
              </el-option>
            </el-select>
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false; resetForm()">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<style scoped>
.dialog-footer {
  text-align: center;
  margin-top: 10px;
}
.perm-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
}
</style>
