<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { createChatSocket } from '@/utils/websocket';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const messages = ref<Message[]>([]);
const newMessage = ref('');
const md = new MarkdownIt();
let chat_socket: ReturnType<typeof createChatSocket> | null = null;

// Markdown 渲染函数
const renderMarkdown = (content: string) => md.render(content);

// 自动滚动到最新消息
const scrollToBottom = () => {
  nextTick(() => {
    const chatDialog = document.querySelector('.chat-messages') as HTMLElement;
    if (chatDialog && chatDialog.scrollHeight > chatDialog.clientHeight) {
      chatDialog.scrollTop = chatDialog.scrollHeight;
    }
  });
};

// 动态加载历史记录
const loadHistory = async () => {
  setTimeout(() => {
    const history: Message[] = [
      { role: 'assistant', content: '```javascript\n我是您的系统助手!\n```' },
    ];
    messages.value.unshift(...history);
    scrollToBottom();
  }, 1000); // 模拟延迟加载
};

// 发送消息
const sendMessage = () => {
  if (newMessage.value.trim()) {
    const userMessage: Message = { role: 'user', content: newMessage.value };
    messages.value.push(userMessage);

    if (chat_socket) {
      chat_socket.emit('chat_message', { messages: [userMessage] });
    }

    newMessage.value = '';
    scrollToBottom();
  }
};

// 监听服务器响应
const handleChatResponse = (data: { messages: Message[] }) => {
  if (data.messages) {
    data.messages.forEach((msg) => {
      messages.value.push(msg);
    });
    scrollToBottom();
  }
};

// 表格搜索逻辑
const searchQuery = ref('');
const tableData = ref([
  { id: 1, sender: 'User', content: 'Hello, I need help.', timestamp: '2023-10-01 10:00:00' },
  { id: 2, sender: 'Assistant', content: 'Sure, what can I do for you?', timestamp: '2023-10-01 10:01:00' },
]);

const filteredTableData = computed(() => {
  if (!searchQuery.value.trim()) return tableData.value;
  return tableData.value.filter((item) =>
    item.content.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 清除搜索
const clearSearch = () => {
  searchQuery.value = '';
};

onMounted(() => {
  // 初始化 WebSocket
  chat_socket = createChatSocket({
    onConnect: () => console.log('Chat WebSocket connected'),
    onDisconnect: () => console.log('Chat WebSocket disconnected'),
    onMessage: handleChatResponse,
    onError: (error) => console.error('Chat WebSocket error:', error),
  });

  loadHistory(); // 加载历史记录
});

onBeforeUnmount(() => {
  // 清理 WebSocket 连接
  chat_socket?.disconnect();
  chat_socket = null;
});
</script>

<template>
    <div class="container">
      <!-- 左侧聊天对话框 -->
      <div class="chat-dialog">
        <div class="chat-messages" ref="chatDialog" @scroll="">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message', msg.role]"
          >
            <!-- 使用 Markdown 渲染 assistant 消息 -->
            <div v-if="msg.role === 'assistant'" class="bubble" v-html="renderMarkdown(msg.content)"></div>
            <!-- 用户消息直接渲染 -->
            <div v-else class="bubble">{{ msg.content }}</div>
          </div>
        </div>
        <div class="input-area">
          <el-input
            v-model="newMessage"
            @keydown.enter="sendMessage"
            placeholder="Type a message..."
          >
            <template #append>
              <el-button @click="sendMessage" icon="el-icon-arrow-right"></el-button>
            </template>
          </el-input>
        </div>
      </div>
  
      <!-- 右侧功能区 -->
      <div class="right-panel">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="Search"
            @input=""
          />
          <el-button @click="">Search</el-button>
          <el-button @click="clearSearch">Clear</el-button>
        </div>
        <el-table :data="filteredTableData" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="sender" label="Sender" width="120" />
          <el-table-column prop="content" label="Content" />
          <el-table-column prop="timestamp" label="Timestamp" width="180" />
        </el-table>
      </div>
    </div>
  </template>



  <style scoped>
  .container {
    display: flex;
    height: 100%;
    overflow: hidden;
  }
  
  .chat-dialog {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f4f4f4;
    padding: 10px;
    border-right: 1px solid #e0e0e0;
    height: 680px;
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background-color: #ffffff;
    border-radius: 8px;
  }
  
  .message {
    display: flex;
    margin-bottom: 10px;
  }
  
  .message.user .bubble {
    align-self: flex-end;
    background-color: #4caf50;
    color: #ffffff;
    padding: 10px 15px;
    border-radius: 15px 15px 0 15px;
  }
  
  .message.assistant .bubble {
    align-self: flex-start;
    background-color: #e0e0e0;
    padding: 10px 15px;
    border-radius: 15px 15px 15px 0;
  }
  
  .input-area {
    padding: 10px;
    background-color: #f9f9f9;
    border-top: 1px solid #e0e0e0;
  }
  
  .right-panel {
    width: 650px;
    padding: 20px;
    background-color: #f9f9f9;
    overflow-y: auto;
    border-left: 1px solid #e0e0e0;
  }
  
  .search-bar {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .search-bar button {
    margin-left: 10px;
  }
  </style>
  