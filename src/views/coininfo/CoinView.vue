<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createCoin, fetchCoins, updateCoin, deleteCoin } from '@/utils/coinapi'
import { fetchAllCoinTypes,fetchAllEcosystems,fetchAllFounders,fetchAllInvestmentInstitutions } from '@/utils/coinapi';
import { formatDateToTimezone } from '@/utils/utillibs'

const searchCoin = ref(''); // 搜索关键字
const currentPage = ref(1); // 当前页码
const pageSize = ref(10); // 每页大小
const totalItems = ref(0); // 总记录数

// Define the interface for coin data
interface Coin {
  id: number | null
  name: string
  description: string
  issuance_date: Date
  is_active: boolean
  ecosystems:string[]
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
  ecosystems:[] ,
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
  ecosystems: [{ required: false, message: '请输入生态系统', trigger: 'blur' }],
  founders: [{ required: false, message: '请输入创始人', trigger: 'blur' }],
  investment_institutions: [{ required: false, message: '请输入投资机构', trigger: 'blur' }],
  coin_types: [{ required: false, message: '请输入币种类型', trigger: 'blur' }]
}

// 加载币种数据，支持分页和搜索
const loadCoins = async () => {
  try {
    const response = await fetchCoins({
      page: currentPage.value,      // 当前页
      pageSize: pageSize.value,     // 每页记录数
      search: searchCoin.value,     // 搜索关键词
    });

    coins.value = response.data.data;        // 当前页的数据
    totalItems.value = response.data.total;  // 总记录数

  } catch (error) {
    ElMessage.error('加载币种失败');
  }
};
// 处理搜索
const handleSearch = () => {
  currentPage.value = 1; // 搜索时重置到第一页
  loadCoins();
};

// 处理分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadCoins();
};
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  loadCoins(); // 重新加载数据
};

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
  formData.value = { id: null, name: '', description: '', issuance_date: new Date(), is_active: true, ecosystems: [], founders: [], investment_institutions: [], coin_types: [] }
}

// Function to edit a coin
const doeditCoin = (coin: Coin) => {
  formData.value = { ...coin }
  dialogVisible.value = true
  Editbtnvisable.value = true
}
// Function to delete a coin
const doDeleteCoin = async (id: number) => {
  try {
    await deleteCoin(id).then(() => {
      ElMessage.success('删除生态系统成功')
    })
    loadCoins()
  } catch (error) {
    ElMessage.error('删除生态系统失败')
  }
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
        ecosystems: formData.value.ecosystems,
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
        ecosystems: formData.value.ecosystems,
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
    <el-input
      v-model="searchCoin"
      placeholder="输入名称"
      style="width: 300px; margin-left: 20px;"
      @input="handleSearch"
    />
    <el-table :data="coins" style="width: 100%">
      <el-table-column prop="name" label="币种名称" width="100px"></el-table-column>
      <el-table-column prop="description" label="币种描述" width="100px">
        <template #default="{ row }">
          <div class="cell-content two-line-ellipsis">{{ row.description }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="issuance_date" label="发行日期" width="130px"></el-table-column>
      <el-table-column prop="is_active" label="是否活跃" width="100px"></el-table-column>
      <el-table-column prop="ecosystems" label="生态系统" >
        <template #default="{ row }">
          <div class="coin-types-container">
            <span v-for="(ecosystem, index) in row.ecosystems" :key="index" class="perm-tag">
              {{ ecosystem }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="founders" label="创始人" width="100px">
        <template #default="{ row }">
          <div class="cell-content two-line-ellipsis">
            <span v-for="founder in row.founders" :key="founder" class="perm-tag">{{ founder }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="investment_institutions" label="投资机构">
        <template #default="{ row }">
          <div class="investment-container">
            <span v-for="(institution, index) in row.investment_institutions" :key="index" class="perm-tag">
              {{ institution }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="coin_types" label="代币类型">
        <template #default="{ row }">
          <div class="coin-types-container">
            <span v-for="(type, index) in row.coin_types" :key="index" class="perm-tag">
              {{ type }}
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="doeditCoin(row)">编辑</el-button>
          <el-button type="danger" size="small" @click="doDeleteCoin(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="totalItems"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
  </div>

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
        <el-date-picker v-model="formData.issuance_date" type="date" placeholder="选择日期"></el-date-picker>
      </el-form-item>
      <el-form-item label="是否活跃" prop="is_active">
        <el-switch v-model="formData.is_active"></el-switch>
      </el-form-item>
      <el-form-item label="生态系统ID" prop="ecosystems">
        <el-select v-model="formData.ecosystems" multiple filterable placeholder="请选择生态系统">
          <el-option
            v-for="item in ecosystems"
            :key="item.id"
            :label="item.name"
            :value="item.name">
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
</template>
<style scoped>
.investment-container,
.coin-types-container {
  display: flex;
  flex-wrap: wrap; /* 允许换行 */
  gap: 4px; /* 设置标签之间的间距 */
  max-height: 4em; /* 限制总高度为两行 */
  line-height: 1.5em; /* 行高 */
  overflow: hidden; /* 超出部分隐藏 */
}

.investment-container .perm-tag {
  flex: 0 0 calc(33.33% - 4px); /* 每行显示 3 个，减去间距 */
  box-sizing: border-box;
  text-align: center;
  line-height: 1.5em; /* 行高 */
  max-height: 4em; /* 限制总高度为两行 */
  overflow: hidden; /* 超出部分隐藏 */
}

.coin-types-container .perm-tag {
  flex: 0 0 calc(50% - 4px); /* 每行显示 2 个，减去间距 */
  box-sizing: border-box;
  text-align: center;
}

.perm-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; /* 单行显示，超出部分省略 */
}
</style>