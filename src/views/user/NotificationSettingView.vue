<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchNotificationSettings,
  saveNotificationSettings,
  testNotification,
  broadcastNotification,
} from '@/utils/commonapi'

type NotificationRow = {
  type: string
  label: string
  email: boolean
  telegram: boolean
}

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const broadcasting = ref(false)

const rows = ref<NotificationRow[]>([
  { type: 'trade', label: '交易通知', email: false, telegram: false },
  { type: 'event', label: '事件新闻', email: false, telegram: false },
  { type: 'whale', label: '鲸鱼买入', email: false, telegram: false },
])

// 广播表单
const broadcastForm = ref({
  title: '',
  body: '',
})
const broadcastDialogVisible = ref(false)

const loadSettings = async () => {
  loading.value = true
  try {
    const response = await fetchNotificationSettings()
    const map: Record<string, boolean> = {}

    const settings = response.data?.settings || []
    settings.forEach((item: any) => {
      const key = `${item.type}:${item.channel}`
      map[key] = Boolean(item.enabled)
    })

    rows.value = rows.value.map((row) => ({
      ...row,
      email: map[`${row.type}:email`] ?? false,
      telegram: map[`${row.type}:telegram`] ?? false,
    }))
  } catch (error) {
    ElMessage.error('加载通知设置失败')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const payload = rows.value.flatMap((row) => ([
      { type: row.type, channel: 'email', enabled: row.email },
      { type: row.type, channel: 'telegram', enabled: row.telegram },
    ]))

    await saveNotificationSettings(payload)
    ElMessage.success('通知设置已保存')
  } catch (error) {
    ElMessage.error('保存通知设置失败')
  } finally {
    saving.value = false
  }
}

const resetAll = () => {
  rows.value = rows.value.map((row) => ({
    ...row,
    email: false,
    telegram: false,
  }))
}

const handleTestTelegram = async () => {
  testing.value = true
  try {
    const resp = await testNotification({ channel: 'telegram' })
    const result = resp.data?.result
    if (result?.ok) {
      ElMessage.success('Telegram 测试消息发送成功')
    } else {
      ElMessage.warning(`Telegram 测试失败: ${result?.detail || '未知错误'}`)
    }
  } catch (error) {
    ElMessage.error('Telegram 测试请求失败')
  } finally {
    testing.value = false
  }
}

const handleTestEmail = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入测试邮箱地址', '邮件测试', {
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      inputErrorMessage: '请输入有效的邮箱地址',
    })
    testing.value = true
    const resp = await testNotification({ channel: 'email', target: value })
    const result = resp.data?.result
    if (result?.ok) {
      ElMessage.success('测试邮件发送成功')
    } else {
      ElMessage.warning(`邮件测试失败: ${result?.detail || '未知错误'}`)
    }
  } catch {
    // 用户取消
  } finally {
    testing.value = false
  }
}

const openBroadcastDialog = () => {
  broadcastForm.value = { title: '', body: '' }
  broadcastDialogVisible.value = true
}

const handleBroadcast = async () => {
  if (!broadcastForm.value.title || !broadcastForm.value.body) {
    ElMessage.warning('标题和内容不能为空')
    return
  }
  broadcasting.value = true
  try {
    await broadcastNotification(broadcastForm.value)
    ElMessage.success('广播消息已发送')
    broadcastDialogVisible.value = false
  } catch (error) {
    ElMessage.error('广播发送失败')
  } finally {
    broadcasting.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="notification-page">
    <div class="page-header">
      <h1>通知设置</h1>
      <div class="actions">
        <el-button @click="loadSettings" :loading="loading">刷新</el-button>
        <el-button @click="resetAll">全部关闭</el-button>
        <el-button type="primary" @click="saveSettings" :loading="saving">保存设置</el-button>
      </div>
    </div>

    <el-card shadow="never">
      <p class="tip">
        开启后系统会按对应渠道推送消息，建议先至少保留一个渠道，避免错过关键交易信号。
      </p>

      <el-table :data="rows" border v-loading="loading" style="width: 100%">
        <el-table-column prop="label" label="通知类型" min-width="180" />
        <el-table-column label="邮件" width="130" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.email" />
          </template>
        </el-table-column>
        <el-table-column label="Telegram" width="130" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.telegram" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 通知测试 & 广播 -->
    <el-card shadow="never" style="margin-top: 16px">
      <template #header>
        <span>通知渠道测试</span>
      </template>

      <div class="test-actions">
        <el-button type="success" @click="handleTestTelegram" :loading="testing">
          测试 Telegram
        </el-button>
        <el-button type="warning" @click="handleTestEmail" :loading="testing">
          测试邮件
        </el-button>
        <el-button type="primary" @click="openBroadcastDialog">
          群组广播
        </el-button>
      </div>

      <p class="tip" style="margin-top: 12px">
        点击测试按钮将发送一条测试消息到对应渠道，确认渠道配置是否正确。群组广播会发送消息到默认 Telegram 群组。
      </p>
    </el-card>

    <!-- 广播对话框 -->
    <el-dialog v-model="broadcastDialogVisible" title="Telegram 群组广播" width="500">
      <el-form label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="broadcastForm.title" placeholder="消息标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="broadcastForm.body"
            type="textarea"
            :rows="4"
            placeholder="消息内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="broadcastDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBroadcast" :loading="broadcasting">发送广播</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.notification-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h1 {
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
}

.tip {
  margin-top: 0;
  color: #666;
  font-size: 13px;
}

.test-actions {
  display: flex;
  gap: 12px;
}
</style>
