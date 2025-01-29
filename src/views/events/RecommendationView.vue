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


const coinSearchKeyword = ref(''); // 绑定用户输入的关键字
const messages = ref<Message[]>([]);
const newMessage = ref('');

let recommendation_socket: ReturnType<typeof createRecommendationSocket> | null = null;


const scrollToBottom = () => {
  const chatDialog = document.querySelector('.chat-messages') as HTMLElement;
  chatDialog.scrollTop = chatDialog.scrollHeight;
};

const loadHistory = async () => {
  setTimeout(() => {
    const history: Message[] = [
      { role: 'assistant', content: '```javascript\n我是您的系统助手!\n```' },
    ];
    messages.value.unshift(...history);
    scrollToBottom();
  }, 1000); // 模拟延迟加载
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
    const coin_search = await coinmarket_top100();
    console.log('coin_search:', coin_search);
  } catch (error) {
    console.error('查询失败:', error);
  }
}

const handleCoinSearch = async () => {
  if (!coinSearchKeyword.value.trim()) {
    console.warn('请输入关键字');
    return;
  }

  try {
    const coin_search = await fetchCoinSearch({ coin_search: coinSearchKeyword.value });
    console.log('coin_search:', coin_search);
    if (coin_search) {
      messages.value.push({ role: 'assistant', content: `代币搜索结果: ${coin_search}` });
      scrollToBottom();
    }
  } catch (error) {
    console.error('查询失败:', error);
    messages.value.push({ role: 'assistant', content: '查询失败，请稍后重试' });
    scrollToBottom();
  }
};
onMounted(() => {
  recommendation_socket = createRecommendationSocket({
    onConnect: () => {
      console.log('Recommendation Socket connected');
    },
    onMessage: handleChatResponse,
    onDisconnect: () => {
      console.log('Recommendation Socket disconnected');
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
        <el-button type="primary">代币链批量添加</el-button>
        <el-button type="primary">代币类型批量添加</el-button>
        <el-button type="primary">创始团队批量添加</el-button>
        <el-button type="primary">投资机构信息批量添加</el-button>
        <el-button type="primary">代币名称批量添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">代币链</span>
        <el-input placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button">查询</el-button>
        <el-button type="warning" class="button">AI 更新</el-button>
        <el-button type="success" class="button">AI 自动添加</el-button>
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
        <el-input placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button">查询</el-button>
        <el-button type="warning" class="button">AI 更新</el-button>
        <el-button type="success" class="button">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">创始团队</span>
        <el-input placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button">查询</el-button>
        <el-button type="warning" class="button">AI 更新</el-button>
        <el-button type="success" class="button">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">投资机构</span>
        <el-input placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button">查询</el-button>
        <el-button type="warning" class="button">AI 更新</el-button>
        <el-button type="success" class="button">AI 自动添加</el-button>
      </div>
      <div class="function-row">
        <span class="label">投资机构信息</span>
        <el-input placeholder="输入关键字" class="input" />
        <el-button type="primary" class="button">查询</el-button>
        <el-button type="warning" class="button">AI 更新</el-button>
        <el-button type="success" class="button">AI 自动添加</el-button>
      </div>

    </div>
    <div class="container-right">
      <!-- WebSocket 日志信息框 -->
      <div class="websocket-log-box">
        <h3>WebSocket 日志信息</h3>
        <div class="log-content" v-for="msg,index in messages" :key="index" :class="['message', msg.role]">
          <p>{{ msg.content }}</p>
          <p>这里是 WebSocket 的日志信息...</p>
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
}

.log-content {
  flex: 1;
  overflow-y: auto; /* 添加滚动条 */
  padding: 5px;
  background-color: #444; /* 日志内容背景色 */
  border-radius: 4px;
}

.log-content p {
  margin: 5px 0;
  font-size: 14px;
}
</style>