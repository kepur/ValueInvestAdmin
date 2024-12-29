<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  createInvestmentInstitution,
  fetchAllInvestmentInstitutions,
  updateInvestmentInstitution,
  DeleteInvestmentInstitution,
  fetchAllCoinInvestment,
  createCoinInvestment,
  updateCoinInvestment,
  deleteCoinInvestment,
  fetchAllCoins,
} from '@/utils/coinapi'

const searchCoin = ref(''); // 搜索关键字
const currentPage = ref(1); // 当前页码
const pageSize = ref(1); // 每页大小
const totalItems = ref(0); // 总记录数


interface Coin {
  id: number | null
  name: string
}

interface InvestmentInstitution {
  id: number | null
  name: string
  description: string
}

interface CoinInvestment {
  id: number | null
  coin_id: number
  institution_id: number
  holding_amount: number
  holding_percentage: number
  coin_name?: string
  institution_name?: string
}
// 处理搜索
const handleSearch = () => {
  currentPage.value = 1; // 搜索时重置到第一页
  loadCoinInvestments();
};

// 处理分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadCoinInvestments();
};

const coins = ref<Coin[]>([])
const investmentInstitutions = ref<InvestmentInstitution[]>([])
const coinInvestments = ref<CoinInvestment[]>([])
const selectedInstitution = ref<InvestmentInstitution | null>(null)

const CoinInvestdialogVisible = ref(false)
const InstitutionsdialogVisible = ref(false)
const Editbtnvisable = ref(false)

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

const CoinInvestformRef = ref()
const InstitutionformRef = ref()

const Institutionrules = {
  name: [{ required: true, message: '请输入投资机构名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入投资机构描述', trigger: 'blur' }]
}

const CoinInvestrules = {
  coin_id: [{ required: true, message: '请选择币种', trigger: 'change' }],
  institution_id: [{ required: true, message: '请选择投资机构', trigger: 'change' }],
  holding_amount: [{ required: true, message: '请输入持有量', trigger: 'blur' }],
  holding_percentage: [{ required: true, message: '请输入持有百分比', trigger: 'blur' }]
}

const loadCoins = async () => {
  try {
    const response = await fetchAllCoins();
    coins.value = response.data;
  } catch (error) {
    ElMessage.error('加载币种失败');
  }
};

const loadInvestmentInstitutions = async () => {
  try {
    const response = await fetchAllInvestmentInstitutions()
    investmentInstitutions.value = response.data
  } catch (error) {
    ElMessage.error('加载投资机构失败')
  }
}

const loadCoinInvestments = async () => {
  try {
    const response = await fetchAllCoinInvestment({
      page: currentPage.value,
      per_page: pageSize.value,
      search: searchCoin.value,
    })
    totalItems.value = response.data.total;  // 总记录数
    coinInvestments.value = response.data.data.map((investment: CoinInvestment) => ({
      ...investment,
      institution_name: investmentInstitutions.value.find(i => i.id === investment.institution_id)?.name
    }))
  } catch (error) {
    ElMessage.error('加载投资信息失败'+error)
  }
}

const openInstitutionsDialog = () => {
  InstitutionsdialogVisible.value = true
  Editbtnvisable.value = false
  InstitutionformData.value = { id: null, name: '', description: '' }
}

const openCoinInvestDialog = () => {
  CoinInvestdialogVisible.value = true
  Editbtnvisable.value = false
  CoinInvestformData.value = { id: null, coin_id: 0, institution_id: 0, holding_amount: 0, holding_percentage: 0 }
}

const InstitutionresetForm = () => {
  InstitutionsdialogVisible.value = false
  InstitutionformData.value = { id: null, name: '', description: '' }
  Editbtnvisable.value = false
}

const CoinInvestresetForm = () => {
  CoinInvestdialogVisible.value = false
  CoinInvestformData.value = { id: null, coin_id: 0, institution_id: 0, holding_amount: 0, holding_percentage: 0 }
  Editbtnvisable.value = false
}

const doeditInvestmentInstitution = (institution: InvestmentInstitution) => {
  InstitutionformData.value = { ...institution }
  InstitutionsdialogVisible.value = true
  Editbtnvisable.value = true
}

const doeditCoinInvestment = (coinInvestment: CoinInvestment) => {
  CoinInvestformData.value = { ...coinInvestment }
  CoinInvestdialogVisible.value = true
  Editbtnvisable.value = true
}

const InstitutionsubmitForm = async () => {
  if (!InstitutionformRef.value) return
  await InstitutionformRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      if (InstitutionformData.value.id) {
        await updateInvestmentInstitution(InstitutionformData.value.id, {
          name: InstitutionformData.value.name,
          description: InstitutionformData.value.description
        })
        ElMessage.success('投资机构更新成功')
      } else {
        await createInvestmentInstitution({
          name: InstitutionformData.value.name,
          description: InstitutionformData.value.description
        })
        ElMessage.success('投资机构创建成功')
      }
      InstitutionsdialogVisible.value = false
      Editbtnvisable.value = false
      InstitutionresetForm()
      await loadCoinInvestments()
      await loadInvestmentInstitutions()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

const CoinInvestsubmitForm = async () => {
  if (!CoinInvestformRef.value) return
  await CoinInvestformRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    try {
      if (CoinInvestformData.value.id) {
        await updateCoinInvestment(CoinInvestformData.value.id, {
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
      Editbtnvisable.value = false
      await loadCoinInvestments()
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

const doDeleteInvestmentInstitution = async (id: number) => {
  try {
    await DeleteInvestmentInstitution(id)
    ElMessage.success('投资机构删除成功')
    await loadInvestmentInstitutions()
  } catch (error) {
    ElMessage.error('删除投资机构失败')
  }
}

const doDeleteCoinInvestment = async (id: number) => {
  try {
    await deleteCoinInvestment(id)
    ElMessage.success('投资信息删除成功')
    await loadCoinInvestments()
  } catch (error) {
    ElMessage.error('删除投资信息失败')
  }
}
onMounted(async () => {
  await loadCoins(); // 确保 coins 加载完成
  await loadInvestmentInstitutions(); // 确保 investmentInstitutions 加载完成
  await loadCoinInvestments(); // 最后加载 coinInvestments
});
</script>

<template>
  <div class="investment-management">
    <div class="button-group">
      <el-button type="primary" @click="openInstitutionsDialog">添加投资机构</el-button>
      <el-button type="primary" @click="openCoinInvestDialog">机构投资添加</el-button>
      <el-input
      v-model="searchCoin"
      placeholder="输入名称"
      style="width: 300px; margin-left: 20px;"
      @input="handleSearch"
    />
      <el-select 
        v-model="selectedInstitution" 
        placeholder="选择投资机构"
        clearable
        class="institution-select"
      >
        <el-option
          v-for="institution in investmentInstitutions"
          :key="institution.id"
          :label="institution.name"
          :value="institution"
        >
          <div class="institution-option">
            <span>{{ institution.name }}</span>
            <div class="institution-actions">
              <el-button 
                type="primary" 
                @click.stop="doeditInvestmentInstitution(institution)"
                size="small"
              >编辑</el-button>
              <el-button 
                size="small"
                type="danger" 
                class="delete-btn"
                @click.stop="doDeleteInvestmentInstitution(institution.id!)"> 删除</el-button>
            </div>
          </div>
        </el-option>
      </el-select>
    </div>

    <!-- 投资机构弹窗 -->
    <el-dialog
      :title="Editbtnvisable ? '编辑投资机构' : '添加投资机构'"
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
      <template #footer>
        <el-button @click="InstitutionresetForm">取 消</el-button>
        <el-button type="primary" @click="InstitutionsubmitForm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 机构投资弹窗 -->
    <el-dialog
      :title="Editbtnvisable ? '编辑机构投资信息' : '添加机构投资信息'"
      v-model="CoinInvestdialogVisible"
      width="30%"
      :before-close="CoinInvestresetForm"
    >
      <el-form
        :model="CoinInvestformData"
        :rules="CoinInvestrules"
        ref="CoinInvestformRef"
        label-width="100px"
      >
        <el-form-item label="投资机构" prop="institution_id">
          <el-select v-model="CoinInvestformData.institution_id" placeholder="请选择投资机构">
            <el-option
              v-for="institution in investmentInstitutions"
              :key="institution.id"
              :label="institution.name"
              :value="institution.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="币种名称" prop="coin_id">
          <el-select v-model="CoinInvestformData.coin_id" placeholder="请选择币种">
            <el-option
              v-for="coin in coins"
              :key="coin.id"
              :label="coin.name"
              :value="coin.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="持有量" prop="holding_amount">
          <el-input v-model.number="CoinInvestformData.holding_amount" type="number"></el-input>
        </el-form-item>
        <el-form-item label="持有百分比" prop="holding_percentage">
          <el-input v-model.number="CoinInvestformData.holding_percentage" type="number">
            <template #suffix>%</template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="CoinInvestresetForm">取 消</el-button>
        <el-button type="primary" @click="CoinInvestsubmitForm">确 定</el-button>
      </template>
    </el-dialog>

    <!-- 投资信息表格 -->
    <el-table :data="coinInvestments"  style="width: 100%; margin-top: 20px">
      <el-table-column prop="coin_name" label="币种" width="120"/>
      <el-table-column prop="institution_name" label="投资机构" />
      <el-table-column prop="holding_amount" label="持有量" >
        <template #default="{ row }">
          {{ row.holding_amount }}<span v-if="row.holding_amount"> 亿</span>
        </template>
      </el-table-column>
      <el-table-column prop="holding_percentage" label="持有百分比" >
        <template #default="{ row }">
          {{ row.holding_percentage }}<span v-if="row.holding_percentage">%</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" >
        <template #default="{ row }">
          <el-button type="primary" size="middle" @click="doeditCoinInvestment(row)">编辑</el-button>
          <el-button type="danger" size="middle"   class="delete-btn" @click="doDeleteCoinInvestment(row.id!)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      style="margin-top: 20px;"
      background
      layout="prev, pager, next"
      :current-page="currentPage"
      :page-size="pageSize"
      :total="totalItems"
      @current-change="handlePageChange"
    />
  </div>
</template>
<style scoped>
.investment-management {
  padding: 20px;
  background-color: #f0f2f5;
  width: 100%;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.institution-select {
  width: 410px;
}

.institution-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 5px 0;
}

.institution-actions {
  display: flex;
  gap: 20px;
}

.delete-btn {
  color: #f0f1f3;
}

.delete-btn:hover {
  color: #ff4d4f;
}

:deep(.el-select-dropdown__item) {
  padding: 0 10px;
}

:deep(.el-form-item__label) {
  font-weight: 800;
}

:deep(.el-input__wrapper) {
  width: 100%;
}


:deep(.el-button--text) {
  padding: 0 4px;
}

:deep(.el-select-dropdown__item.selected) {
  color: #409EFF;
  font-weight: 700;
}

:deep(.el-dialog__body) {
  padding: 20px 30px;
}

:deep(.el-dialog__footer) {
  text-align: center;
  margin-top: 10px;
}
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