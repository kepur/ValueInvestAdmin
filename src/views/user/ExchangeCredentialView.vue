<script setup lang="ts">
/**
 * T-0533 用户后台交易所接入页：新增/验证/启停/掩码显示 + 风险提示文案
 */
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchExchangeCredentials,
  createExchangeCredential,
  updateExchangeCredential,
  deleteExchangeCredential,
  verifyExchangeCredential,
  type ExchangeCredentialItem,
} from '@/utils/exchangeCredentialApi'

const list = ref<ExchangeCredentialItem[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增交易所凭证')
const editingId = ref<number | null>(null)
const form = ref({
  exchange: 'binance',
  name: '',
  environment: 'mainnet',
  api_key: '',
  api_secret: '',
  validate: true,
})
const verifyLoading = ref<number | null>(null)
const submitLoading = ref(false)

const exchangeOptions = [
  { label: 'Binance Spot', value: 'binance' },
  { label: 'Gate.io', value: 'gate' },
  { label: 'Coinbase Advanced Trade', value: 'coinbase' },
]
const envOptions = [
  { label: '主网 (Mainnet)', value: 'mainnet' },
  { label: '测试网 (Testnet)', value: 'testnet' },
]

const load = async () => {
  loading.value = true
  try {
    const res = await fetchExchangeCredentials()
    list.value = res.data?.data || []
  } catch {
    ElMessage.error('加载凭证列表失败')
  } finally {
    loading.value = false
  }
}

const openAdd = () => {
  editingId.value = null
  dialogTitle.value = '新增交易所凭证'
  form.value = { exchange: 'binance', name: '', environment: 'mainnet', api_key: '', api_secret: '', validate: true }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.value.api_key?.trim()) {
    ElMessage.warning('请填写 API Key')
    return
  }
  submitLoading.value = true
  try {
    if (editingId.value) {
      await updateExchangeCredential(editingId.value, {
        name: form.value.name || undefined,
        api_key: form.value.api_key || undefined,
        api_secret: form.value.api_secret || undefined,
        environment: form.value.environment,
      })
      ElMessage.success('已更新')
    } else {
      await createExchangeCredential({
        exchange: form.value.exchange,
        name: form.value.name || undefined,
        environment: form.value.environment,
        api_key: form.value.api_key,
        api_secret: form.value.api_secret || undefined,
        validate: form.value.validate,
      })
      ElMessage.success('已创建，建议使用「验证」确认仅交易权限')
    }
    dialogVisible.value = false
    load()
  } catch (e: any) {
    const msg = e.response?.data?.error || '操作失败'
    ElMessage.error(msg)
  } finally {
    submitLoading.value = false
  }
}

const handleVerify = async (row: ExchangeCredentialItem) => {
  verifyLoading.value = row.id
  try {
    const res = await verifyExchangeCredential(row.id)
    const data = res.data as { valid?: boolean; error?: string }
    if (data.valid) {
      ElMessage.success('验证通过，权限快照已更新')
    } else {
      ElMessage.warning(data.error || '验证未通过')
    }
    load()
  } catch {
    ElMessage.error('验证请求失败')
  } finally {
    verifyLoading.value = null
  }
}

const handleToggleEnabled = async (row: ExchangeCredentialItem) => {
  try {
    await updateExchangeCredential(row.id, { enabled: !row.enabled })
    ElMessage.success(row.enabled ? '已停用' : '已启用')
    load()
  } catch {
    ElMessage.error('更新失败')
  }
}

const handleDelete = async (row: ExchangeCredentialItem) => {
  try {
    await ElMessageBox.confirm('确定删除该凭证？删除后无法恢复。', '删除确认', { type: 'warning' })
    await deleteExchangeCredential(row.id)
    ElMessage.success('已删除')
    load()
  } catch {}
}

const handleSyncBalance = async () => {
  try {
    const { syncWalletBalance } = await import('@/utils/tradapi')
    await syncWalletBalance()
    ElMessage.success('同步成功')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '同步失败')
  }
}

onMounted(load)
</script>

<template>
  <div class="exchange-credential-view">
    <el-card shadow="never">
      <template #header>
        <span>交易所 API 凭证</span>
        <div style="float: right; display: flex; gap: 10px;">
          <el-button size="small" @click="handleSyncBalance">同步钱包余额</el-button>
          <el-button type="primary" size="small" @click="openAdd">新增凭证</el-button>
        </div>
      </template>

      <!-- 风险提示 T-0533 -->
      <el-alert type="warning" :closable="false" show-icon class="risk-tip">
        <template #title>风险提示</template>
        <ul>
          <li>请仅使用<strong>仅 Spot 交易权限</strong>的 API Key，切勿开启提现、转账、合约等权限。</li>
          <li>建议使用子账户或交易所的 API 权限限制功能，将权限限定为「交易」。</li>
          <li>API Key/Secret 将加密存储；请勿与他人共享或在不可信环境输入。</li>
        </ul>
      </el-alert>

      <el-table :data="list" v-loading="loading" border stripe size="small">
        <el-table-column prop="exchange" label="交易所" width="120">
          <template #default="{ row }">
            {{ row.exchange === 'binance' ? 'Binance Spot' : row.exchange === 'coinbase' ? 'Coinbase' : row.exchange }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="备注" width="120" show-overflow-tooltip />
        <el-table-column prop="environment" label="环境" width="100">
          <template #default="{ row }">
            <el-tag :type="row.environment === 'testnet' ? 'info' : 'success'" size="small">
              {{ row.environment === 'testnet' ? '测试网' : '主网' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="API Key" width="100">
          <template #default="{ row }">
            <span class="masked">{{ row.api_key_encrypted || '***' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="permission_snapshot" label="权限快照" min-width="140">
          <template #default="{ row }">
            <span v-if="row.permission_snapshot" class="snapshot">
              {{ JSON.stringify(row.permission_snapshot).slice(0, 60) }}...
            </span>
            <span v-else class="muted">未验证</span>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" :loading="verifyLoading === row.id"
              @click="handleVerify(row)">验证</el-button>
            <el-button size="small" @click="handleToggleEnabled(row)">
              {{ row.enabled ? '停用' : '启用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="交易所">
          <el-select v-model="form.exchange" placeholder="选择" style="width: 100%;" :disabled="!!editingId">
            <el-option v-for="o in exchangeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="环境">
          <el-select v-model="form.environment" placeholder="选择" style="width: 100%;" :disabled="!!editingId">
            <el-option v-for="o in envOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注名">
          <el-input v-model="form.name" placeholder="可选" />
        </el-form-item>
        <el-form-item label="API Key" required>
          <el-input v-model="form.api_key" placeholder="请输入 API Key" type="password" show-password />
        </el-form-item>
        <el-form-item label="API Secret">
          <el-input v-model="form.api_secret" placeholder="请输入 API Secret" type="password" show-password />
        </el-form-item>
        <el-form-item v-if="!editingId" label="保存前验证">
          <el-switch v-model="form.validate" /> 验证仅交易权限后再保存
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.exchange-credential-view { padding: 16px; }
.risk-tip { margin-bottom: 16px; }
.risk-tip ul { margin: 8px 0 0 0; padding-left: 20px; }
.masked { font-family: monospace; color: #909399; }
.snapshot { font-size: 12px; color: #606266; }
.muted { color: #c0c4cc; }
</style>
