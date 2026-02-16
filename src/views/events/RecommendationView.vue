<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {createRecommendationSocket} from '@/utils/websocket';
import { fetchCoinSearch,founder_search,coinmarket_top100 } from '@/utils/recommendationapi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}
interface coin_search{
  coin_search: string;
}
interface founder_search{
  founder_search: string;
}
interface cointype_search{
  coin_type_search: string;
}


const coinSearchKeyword = ref('');
const ecosystemKeyword = ref('');
const cointypeKeyword = ref('');
const founderKeyword = ref('');
const institutionKeyword = ref('');
const institutionInfoKeyword = ref('');

const messages = ref<Message[]>([]);
const newMessage = ref('');

let recommendation_socket: ReturnType<typeof createRecommendationSocket> | null = null;


const scrollToBottom = () => {
  const chatDialog = document.querySelector('.chat-messages') as HTMLElement;
  chatDialog.scrollTop = chatDialog.scrollHeight;
};

const loadHistory = async () => {
  const history: Message[] = [
    { role: 'assistant', content: '我是您的系统助手! 这里显示实时任务执行日志。' },
  ];
  messages.value.push(...history);
  scrollToBottom();
};

const handleChatResponse = (data: { messages: Message[] }) => {
  if (data.messages) {
    data.messages.forEach((msg) => {
      messages.value.push(msg);
    });
    scrollToBottom();
  }
};
const HandleProceeTop100=async()=>{
  try {
    messages.value.push({ role: 'user', content: '请求批量添加 TOP100 主流代币' });
    if (recommendation_socket) {
        recommendation_socket.emit('start_process', { task: 'TOP100 批量添加' });
    }
    const res = await coinmarket_top100();
    console.log('coinmarket_top100:', res);
  } catch (error) {
    console.error('查询失败:', error);
    messages.value.push({ role: 'assistant', content: 'TOP100 批量添加请求失败' });
  }
}

const handleCoinSearch = async () => {
  if (!coinSearchKeyword.value.trim()) {
    console.warn('请输入关键字');
    return;
  }

  try {
    const res = await fetchCoinSearch({ coin_search: coinSearchKeyword.value });
    console.log('coin_search:', res);
    if (res && res.data) {
      messages.value.push({ role: 'assistant', content: `代币搜索结果: ${JSON.stringify(res.data)}` });
      scrollToBottom();
    }
  } catch (error) {
    console.error('查询失败:', error);
    messages.value.push({ role: 'assistant', content: '查询失败，请稍后重试' });
    scrollToBottom();
  }
};
const handleGenericAction = (task: string, label: string) => {
    let keyword = '';
    switch(label) {
        case '代币链': keyword = ecosystemKeyword.value; break;
        case '代币类型': keyword = cointypeKeyword.value; break;
        case '创始团队': keyword = founderKeyword.value; break;
        case '投资机构': keyword = institutionKeyword.value; break;
        case '投资机构信息': keyword = institutionInfoKeyword.value; break;
        default: keyword = coinSearchKeyword.value;
    }

    const content = keyword ? `请求: ${label} - ${task} (关键字: ${keyword})` : `请求: ${label} - ${task}`;
    messages.value.push({ role: 'user', content });
    
    if (recommendation_socket) {
        recommendation_socket.emit('start_process', { 
            task: `${label} ${task}`,
            keyword: keyword 
        });
    }
}
const handleCoinUpdate = () => {
    if (!coinSearchKeyword.value.trim()) return;
    messages.value.push({ role: 'user', content: `请求 AI 更新代币信息: ${coinSearchKeyword.value}` });
    if (recommendation_socket) {
        recommendation_socket.emit('start_process', { task: `更新 ${coinSearchKeyword.value} 信息` });
    }
}

const handleCoinAdd = () => {
    if (!coinSearchKeyword.value.trim()) return;
    messages.value.push({ role: 'user', content: `请求 AI 自动添加代币: ${coinSearchKeyword.value}` });
    if (recommendation_socket) {
        recommendation_socket.emit('start_process', { task: `自动添加 ${coinSearchKeyword.value}` });
    }
}

onMounted(() => {
  recommendation_socket = createRecommendationSocket({
    onConnect: () => {
      console.log('Recommendation Socket connected');
      messages.value.push({ role: 'assistant', content: 'WebSocket 已连接，准备就绪。' });
    },
    onMessage: handleChatResponse,
    onDisconnect: () => {
      console.log('Recommendation Socket disconnected');
      messages.value.push({ role: 'assistant', content: 'WebSocket 已断开。' });
    },
    onError: (error) => {
      console.error('Recommendation Socket error:', error);
    },
  });
  if (recommendation_socket) {
    recommendation_socket.on('chat_response', handleChatResponse);
    loadHistory();
  }
});


</script>

<template>
  <div class="container">
    <div class="container-left">
      <h1>代币信息管理</h1>
      <!-- 批量添加按钮 -->
      <div class="batch-buttons">
        <el-button type="primary" @click="HandleProceeTop100">TOP100 主流代币批量添加</el-button>
        <el-button type="primary" @click="handleGenericAction('批量添加', '代币链')">代币链批量添加</el-button>
        <el-button type="primary" @click="handleGenericAction('批量添加', '代币类型')">代币类型批量添加</el-button>
        <el-button type="primary" @click="handleGenericAction('批量添加', '创始团队')">创始团队批量添加</el-button>
        <el-button type="primary" @click="handleGenericAction('批量添加', '投资机构信息')">投资机构信息批量添加</el-button>
        <el-button type="primary" @click="handleGenericAction('批量添加', '代币名称')">代币名称批量添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">代币链</span>
        <el-input v-model="ecosystemKeyword" placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button" @click="handleGenericAction('常规查询', '代币链')">查询</el-button>
        <el-button type="warning" class="button" @click="handleGenericAction('AI 更新', '代币链')">AI 更新</el-button>
        <el-button type="success" class="button" @click="handleGenericAction('AI 自动添加', '代币链')">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">代币名称</span>
        <el-input v-model="coinSearchKeyword" placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button" @click="handleCoinSearch">查询</el-button>
        <el-button type="warning" class="button" @click="handleCoinUpdate">AI 更新</el-button>
        <el-button type="success" class="button" @click="handleCoinAdd">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">代币类型</span>
        <el-input v-model="cointypeKeyword" placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button" @click="handleGenericAction('常规查询', '代币类型')">查询</el-button>
        <el-button type="warning" class="button" @click="handleGenericAction('AI 更新', '代币类型')">AI 更新</el-button>
        <el-button type="success" class="button" @click="handleGenericAction('AI 自动添加', '代币类型')">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">创始团队</span>
        <el-input v-model="founderKeyword" placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button" @click="handleGenericAction('常规查询', '创始团队')">查询</el-button>
        <el-button type="warning" class="button" @click="handleGenericAction('AI 更新', '创始团队')">AI 更新</el-button>
        <el-button type="success" class="button" @click="handleGenericAction('AI 自动添加', '创始团队')">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">投资机构</span>
        <el-input v-model="institutionKeyword" placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button" @click="handleGenericAction('常规查询', '投资机构')">查询</el-button>
        <el-button type="warning" class="button" @click="handleGenericAction('AI 更新', '投资机构')">AI 更新</el-button>
        <el-button type="success" class="button" @click="handleGenericAction('AI 自动添加', '投资机构')">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">投资机构信息</span>
        <el-input v-model="institutionInfoKeyword" placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button" @click="handleGenericAction('常规查询', '投资机构信息')">查询</el-button>
        <el-button type="warning" class="button" @click="handleGenericAction('AI 更新', '投资机构信息')">AI 更新</el-button>
        <el-button type="success" class="button" @click="handleGenericAction('AI 自动添加', '投资机构信息')">AI 自动添加</el-button>
      </div>

    </div>
    <div class="container-right">
      <!-- WebSocket 日志信息框 -->
      <div class="websocket-log-box">
        <h3>WebSocket 日志信息</h3>
        <div class="chat-messages">
          <div v-for="msg,index in messages" :key="index" :class="['message', msg.role]">
            <p class="content">{{ msg.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  height: 100vh;
}

.container-left {
  width: 700px;
  height: 500px;
  padding: 20px;
  border-right: 1px solid #ccc;
}

.container-right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

h1 {
  margin-bottom: 20px;
}

/* 批量添加按钮样式 */
.batch-buttons {
  display: flex;
  gap: 10px; /* 按钮之间的间距 */
  margin-bottom: 20px;
  flex-wrap: wrap; /* 如果按钮过多，自动换行 */
}

.function-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.label {
  width: 120px;
  font-weight: bold;
}

.input {
  width: 200px;
  margin-right: 10px;
}

.button {
  margin-right: 10px;
}

/* WebSocket 日志信息框样式 */
.websocket-log-box {
  margin-top: 20px;
  width: auto;
  height: 480px;
  background-color: #333; /* 黑灰色背景 */
  color: #fff; /* 文字颜色 */
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.websocket-log-box h3 {
  margin-bottom: 10px;
  font-size: 16px;
  border-bottom: 1px solid #555;
  padding-bottom: 5px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto; 
  padding: 5px;
}

.message {
  margin-bottom: 10px;
  padding: 8px;
  border-radius: 4px;
}

.message.assistant {
  background-color: #444;
  border-left: 4px solid #4ade80;
}

.message.user {
  background-color: #555;
  border-left: 4px solid #60a5fa;
  text-align: right;
}

.content {
  margin: 0;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>