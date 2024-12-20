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
  const auditlogs=ref(<Auditlog[]>([]))
  const loading=ref(false)
  const loadAuditlogs=async()=>{
    loading.value=true
    try{
      const response = await fetchAuditLogs()
      console.log("日志:",response)
      if (response.data){
        auditlogs.value=Array.isArray(response.data)?response.data:response.data.auditlogs;
      }
    }catch(error){
      ElMessage.error('数据加载失败:'+error)
    }finally{
      loading.value=false
    }
}
// Load users and roles when the component is mounted

onMounted(() => {
  loadAuditlogs()
})
</script>
<template>
  <div>
    <el-table :data="auditlogs" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60"></el-table-column>
      <el-table-column prop="user_name" label="User Name"></el-table-column>
      <el-table-column prop="description" label="Description"></el-table-column>
      <el-table-column prop="optime" label="Optime"></el-table-column>
    </el-table>
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
