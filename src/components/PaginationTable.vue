<template>
    <div>
      <!-- 表格部分 -->
      <el-table :data="pagedData" v-bind="tableProps">
        <slot></slot>
      </el-table>
  
      <!-- 分页部分 -->
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
  
  <script lang="ts" setup>
  import { ref, computed, defineProps, defineEmits } from 'vue';
  
  // 定义 Props
  const props = defineProps({
    data: {
      type: Array,
      required: true,
      default: () => [],
    },
    totalItems: {
      type: Number,
      required: true,
      default: 0,
    },
    pageSize: {
      type: Number,
      default: 10,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
    tableProps: {
      type: Object,
      default: () => ({}),
    },
  });
  
  // 定义 Emits
  const emit = defineEmits(['update:currentPage']);
  
  // 分页逻辑
  const currentPage = ref(1);
  
  // 计算分页后的数据
  const pagedData = computed(() => {
    const start = (currentPage.value - 1) * props.pageSize;
    const end = currentPage.value * props.pageSize;
    return props.data.slice(start, end);
  });
  
  // 页码切换
  const handlePageChange = (page: number) => {
    currentPage.value = page;
    emit('update:currentPage', page); // 向父组件同步页码
  };
  </script>
  
  <style scoped>
  /* 样式保持简洁 */
  </style>
  