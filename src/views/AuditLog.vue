<script setup lang="ts" >
  import {onMounted,ref} from 'vue'
  import { fetchAuditLogs } from '@/utils/commonapi';
  import { ElMessage } from "element-plus"

  interface Auditlog{
    id:number|null
    user_name:string
    action:string
    optime:string
  }
  const auditlogs=ref<Auditlog[]>([])
  const loading=ref(false)
  const keyword=ref('')
  const currentPage=ref(1)
  const pageSize=ref(20)
  const totalItems=ref(0)

  const loadAuditlogs=async()=>{
    loading.value=true
    try{
      const response = await fetchAuditLogs({
        keyword: keyword.value,
        page: currentPage.value,
        page_size: pageSize.value
      })
      console.log("日志:",response)
      if (response.data){
        // 后端现在返回 { total, page, page_size, logs }
        auditlogs.value = response.data.logs || []
        totalItems.value = response.data.total || 0
      }
    }catch(error){
      ElMessage.error('数据加载失败:'+error)
    }finally{
      loading.value=false
    }
}

const handleSearch = () => {
  currentPage.value = 1
  loadAuditlogs()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadAuditlogs()
}
// Load users and roles when the component is mounted

onMounted(() => {
  loadAuditlogs()
})
</script>
<template>
  <div style="padding: 20px;">
    <el-card shadow="never" style="margin-bottom: 20px;">
      <div style="display: flex; gap: 12px; align-items: center;">
        <el-input v-model="keyword" placeholder="搜索用户或动作" style="width: 250px" clearable @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch" :loading="loading">搜索</el-button>
        <el-button @click="() => { keyword = ''; handleSearch(); }">重置</el-button>
      </div>
    </el-card>

    <el-table :data="auditlogs" style="width: 100%" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70"></el-table-column>
      <el-table-column prop="user_name" label="用户名" width="150"></el-table-column>
      <el-table-column prop="action" label="操作内容"></el-table-column>
      <el-table-column prop="optime" label="操作时间" width="180"></el-table-column>
    </el-table>

    <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalItems"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        background
      />
    </div>
  </div>
</template>
<style scoped>
.dialog-footer {
  text-align: right;
}
.perm-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
}
</style>
