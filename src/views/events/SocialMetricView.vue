<script setup lang="ts">
import { ref } from 'vue';

// 假数据
const fakeData = [
  {
    event_id: 1,
    event_name: '特朗普上任',
    platform: 'Twitter',
    mentions: 1200,
    sentiment_type: true,
    sentiment_intensity: 75,
    timestamp: '2023-10-01 12:00:00'
  },
  {
    event_id: 2,
    event_name: '特朗普上任',
    platform: 'Reddit',
    mentions: 800,
    sentiment_type: false,
    sentiment_intensity: 60,
    timestamp: '2023-10-01 12:30:00'
  },
  {
    event_id: 3,
    event_name: '特朗普上任',
    platform: 'Facebook',
    mentions: 500,
    sentiment_type: true,
    sentiment_intensity: 80,
    timestamp: '2023-10-01 13:00:00'
  },
  {
    event_id: 4,
    event_name: '特朗普上任',
    platform: 'CFTC',
    mentions: 300,
    sentiment_type: false,
    sentiment_intensity: 40,
    timestamp: '2023-10-01 14:00:00'
  },
  {
    event_id: 5,
    event_name: '特朗普上任',
    platform: 'SEC',
    mentions: 700,
    sentiment_type: true,
    sentiment_intensity: 90,
    timestamp: '2023-10-01 15:00:00'
  }
];

// 分页相关状态
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(fakeData.length);

// 分页事件处理
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
};

// 计算当前页数据
const paginatedData = () => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return fakeData.slice(start, end);
};

// 抓取相关状态
const startInterval = ref(100); // 起始时间
const endInterval = ref(500); // 结束时间
const platforms = ref(['Twitter', 'Reddit', 'Facebook', 'CFTC', 'SEC']); // 可选平台
const selectedPlatforms = ref(['Twitter', 'Reddit']); // 默认选中平台
const searchKeyword = ref(''); // 搜索关键词

// 定时抓取事件
const startScheduledFetch = () => {
  if (startInterval.value < 100 || endInterval.value > 500) {
    alert('抓取时间区间必须在 100 到 500 分钟之间！');
    return;
  }
  alert(`已启动定时抓取，时间区间：${startInterval.value} - ${endInterval.value} 分钟，平台：${selectedPlatforms.value.join(', ')}`);
  // 这里可以添加定时抓取逻辑
};

// 手动抓取事件
const fetchNow = () => {
  alert(`立即抓取，平台：${selectedPlatforms.value.join(', ')}`);
  // 这里可以添加立即抓取逻辑
};

// 搜索热度记录
const searchRecords = () => {
  alert(`搜索关键词：${searchKeyword.value}`);
  // 这里可以添加搜索逻辑
};
</script>

<template>
  <div class="chatbox-container">
    <div class="chatbox-container-left">
      <h1>事件热度分析</h1>
        <!-- WebSocket 日志信息框 -->
        <div class="websocket-log-box">
        <h3>WebSocket 日志信息</h3>
        <div class="log-content">
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
          <p>这里是 WebSocket 的日志信息...</p>
        </div>
      </div>
    </div>
    <div class="chatbox-container-right">
      <h1>热度信息列表</h1>
      <div class="controls">
        <div class="control-item">
          <span style="width: 180px;">抓取时间区间（分钟):</span>
          <el-input-number v-model="startInterval" :min="100" :max="500" style="margin-left: 20px;margin-right: 20px;"/>
          <span>至</span>
          <el-input-number v-model="endInterval" :min="100" :max="500" />
          <el-input v-model="searchKeyword" placeholder="请输入搜索关键词" style="width: 510px; margin-left:20px ;"/>

        </div>

        <div class="control-item">
          <span style="width: 180px;">选择抓取平台：</span>
          <el-select v-model="selectedPlatforms" multiple placeholder="请选择抓取平台" style="width: 600px; margin-left: 20px; margin-right: 20px;" >
            <el-option
              v-for="platform in platforms"
              :key="platform"
              :label="platform"
              :value="platform"
            />
          </el-select>
          <el-button type="primary" @click="startScheduledFetch">启动定时抓取</el-button>
          <el-button type="success" @click="fetchNow">现在抓取更新</el-button>
        </div>

      </div>
      <el-table :data="paginatedData()" style="width: 100%">
        <el-table-column prop="event_id" label="事件ID" width="100" />
        <el-table-column prop="event_name" label="事件名称" width="150" />
        <el-table-column prop="platform" label="平台" width="120" />
        <el-table-column prop="mentions" label="提及次数" width="120" />
        <el-table-column prop="sentiment_type" label="情绪类型" width="120">
          <template #default="{ row }">
            {{ row.sentiment_type ? '积极' : '消极' }}
          </template>
        </el-table-column>
        <el-table-column prop="sentiment_intensity" label="情绪程度" width="120" />
        <el-table-column prop="timestamp" label="记录时间" width="180" />
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, sizes, prev, pager, next, jumper"
      />
      
    </div>
  </div>
</template>

<style scoped>
.chatbox-container {
  display: flex;
  padding: 20px;
  height: 100%;
  width: 100%;
}

.chatbox-container-left {
  flex: 1;
  padding: 20px;
  background-color: #f0f0f0;
  border-right: 1px solid #ddd;
}

.chatbox-container-right {
  flex: 3;
  padding: 20px;
}

h1 {
  font-size: 24px;
  margin-bottom: 20px;
}

.controls {
  margin-bottom: 20px;
}

.control-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  width: 1000px;
}
.control-item .control-item span {
  margin-right: 20px;
  margin-right: 20px;
}

.control-item span {
  margin-right: 10px;
}

.el-table {
  margin-top: 20px;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}
</style>