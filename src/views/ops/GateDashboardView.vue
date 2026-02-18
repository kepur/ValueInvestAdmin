<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { fetchGateStatus, fetchSystemConfig, updateSystemConfig, type GateStatusResponse, type GateItem, type GateStatus } from '@/utils/gateapi'
import { ElMessage } from 'element-plus'
import { CircleCheck, Warning, CircleClose, Refresh, Link } from '@element-plus/icons-vue'

const loading = ref(false)
const data = ref<GateStatusResponse | null>(null)
const env = ref<'test' | 'prod'>('test')

const load = async () => {
  loading.value = true
  try {
    data.value = await fetchGateStatus(env.value)
  } catch (e) {
    ElMessage.error('加载闸门状态失败')
  } finally {
    loading.value = false
  }
}

// T-0524 Kill Switch / Shadow Mode 运维开关
const sysConfig = ref<{ global_kill_switch?: string; shadow_mode?: string }>({})
const configLoading = ref(false)
const loadConfig = async () => {
  configLoading.value = true
  try {
    sysConfig.value = await fetchSystemConfig()
  } catch {
    // 非管理员可能无权限，忽略
  } finally {
    configLoading.value = false
  }
}
const killSwitch = computed({
  get: () => sysConfig.value?.global_kill_switch === 'true',
  set: async (v: boolean) => {
    try {
      await updateSystemConfig({ global_kill_switch: v })
      sysConfig.value = { ...sysConfig.value, global_kill_switch: v ? 'true' : 'false' }
      ElMessage.success(v ? '已开启 Kill Switch' : '已关闭 Kill Switch')
      load()
    } catch (e: any) {
      ElMessage.error(e.response?.data?.error || '更新失败')
    }
  },
})
const shadowMode = computed({
  get: () => sysConfig.value?.shadow_mode === 'true',
  set: async (v: boolean) => {
    try {
      await updateSystemConfig({ shadow_mode: v })
      sysConfig.value = { ...sysConfig.value, shadow_mode: v ? 'true' : 'false' }
      ElMessage.success(v ? '已开启 Shadow Mode' : '已关闭 Shadow Mode')
      load()
    } catch (e: any) {
      ElMessage.error(e.response?.data?.error || '更新失败')
    }
  },
})

const allowRelease = computed(() => data.value?.allowRelease ?? false)
const gates = computed(() => data.value?.gates ?? [])
const summary = computed(() => data.value?.summary ?? '')

const statusConfig = (s: GateStatus) => {
  const map = {
    pass: { type: 'success' as const, icon: CircleCheck, label: '通过' },
    warn: { type: 'warning' as const, icon: Warning, label: '警告' },
    fail: { type: 'danger' as const, icon: CircleClose, label: '未通过' },
  }
  return map[s] || map.pass
}

const formatTime = (iso: string | null) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'medium' })
  } catch {
    return iso
  }
}

onMounted(() => { load(); loadConfig() })
</script>

<template>
  <div class="gate-dashboard">
    <div class="page-header">
      <h2>上线闸门看板</h2>
      <div class="actions">
        <el-radio-group v-model="env" size="default" @change="load">
          <el-radio-button label="test">测试环境</el-radio-button>
          <el-radio-button label="prod">生产环境</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <!-- T-0524 运维开关：Kill Switch / Shadow Mode -->
    <el-card shadow="never" class="ops-switch-card" v-loading="configLoading">
      <template #header>运维开关</template>
      <div class="switch-row">
        <span class="label">全局 Kill Switch</span>
        <el-switch v-model="killSwitch" active-text="开启(禁止实盘)" inactive-text="关闭" />
      </div>
      <div class="switch-row">
        <span class="label">Shadow Mode（仅记录不下单）</span>
        <el-switch v-model="shadowMode" active-text="开启" inactive-text="关闭" />
      </div>
    </el-card>

    <!-- 发布前检查结论 -->
    <el-card shadow="never" class="release-card" :class="{ blocked: !allowRelease }">
      <template #header>
        <span>发布前检查</span>
        <el-tag :type="allowRelease ? 'success' : 'danger'" size="large" style="margin-left: 12px;">
          {{ allowRelease ? '可执行发布' : '未通过 — 建议修复后再发布' }}
        </el-tag>
      </template>
      <p class="summary">{{ summary }}</p>
      <el-alert v-if="!allowRelease" type="error" :closable="false" show-icon>
        存在未通过闸门，请先处理对应项后再进行发布。可点击下方闸门查看详情或跳转日志。
      </el-alert>
    </el-card>

    <!-- 闸门列表 -->
    <el-card shadow="never" v-loading="loading">
      <template #header>
        <span>闸门状态</span>
        <span style="color: #999; font-size: 12px; margin-left: 8px;">最近验证时间与负责人</span>
      </template>
      <div class="gate-list">
        <div v-for="gate in gates" :key="gate.id" class="gate-item" :class="gate.status">
          <div class="gate-main">
            <el-icon :size="24" class="gate-icon">
              <component :is="statusConfig(gate.status).icon" />
            </el-icon>
            <div class="gate-info">
              <div class="gate-name">{{ gate.name }} <span class="name-en">({{ gate.nameEn }})</span></div>
              <div class="gate-meta">
                <el-tag :type="statusConfig(gate.status).type" size="small">{{ statusConfig(gate.status).label }}</el-tag>
                <span class="time">验证时间: {{ formatTime(gate.lastCheckedAt) }}</span>
                <span v-if="gate.owner" class="owner">负责人: {{ gate.owner }}</span>
              </div>
              <p v-if="gate.message" class="gate-message">{{ gate.message }}</p>
            </div>
            <a v-if="gate.link" :href="gate.link" target="_blank" rel="noopener" class="gate-link">
              <el-icon><Link /></el-icon> 查看
            </a>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.gate-dashboard {
  padding: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ops-switch-card {
  margin-bottom: 16px;
}
.switch-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.switch-row .label {
  min-width: 200px;
  font-size: 14px;
}
.release-card {
  margin-bottom: 16px;
}

.release-card.blocked {
  border-left: 4px solid var(--el-color-danger);
}

.summary {
  margin: 0 0 12px 0;
  color: #606266;
}

.gate-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gate-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px 16px;
  transition: border-color 0.2s;
}

.gate-item.pass { border-left: 4px solid var(--el-color-success); }
.gate-item.warn { border-left: 4px solid var(--el-color-warning); }
.gate-item.fail { border-left: 4px solid var(--el-color-danger); }

.gate-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.gate-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.gate-item.pass .gate-icon { color: var(--el-color-success); }
.gate-item.warn .gate-icon { color: var(--el-color-warning); }
.gate-item.fail .gate-icon { color: var(--el-color-danger); }

.gate-info {
  flex: 1;
  min-width: 0;
}

.gate-name {
  font-weight: 600;
  font-size: 15px;
}

.name-en {
  color: #909399;
  font-weight: normal;
  font-size: 13px;
}

.gate-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.gate-message {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: #606266;
}

.gate-link {
  flex-shrink: 0;
  color: var(--el-color-primary);
  text-decoration: none;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.gate-link:hover {
  text-decoration: underline;
}
</style>
