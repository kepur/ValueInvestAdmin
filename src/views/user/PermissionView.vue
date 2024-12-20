<script setup lang="ts">
  import {ref,onMounted} from 'vue'
  import { ElMessage } from 'element-plus';
  import { fetchAllPermissions,createPermission,deletePermission,updatePermission } from '@/utils/permission'
import { el, tr } from 'element-plus/es/locales.mjs';
import { createRole } from '@/utils/role';
  interface Permission{
    id:number|null
    name:string
    description:string
  }
  const loading=ref(false)
  const dialogVisible=ref(false)
  const formData=ref<Permission>({
    id:null,
    name:'',
    description:''
  })

  const allPermissions = ref<Permission[]>([])
// Function to open the dialog for creating or editing a role
const openPermisiondialog = (permission: Permission | null) => {
  if (permission) {
    formData.value = { ...permission }
  } else {
    formData.value = { id: null, name: '', description: ''}
  }
  dialogVisible.value = true
}

  // Function to load all permissions
  const loadPermissions = async () => {
    try {
      const response = await fetchAllPermissions()
      allPermissions.value = response.data
    } catch (error) {
      ElMessage.error('Failed to load permissions')
    }
  } 

  const formRef = ref() // Reference to the form instance
  const submitForm=async()=>{
    if(!formRef.value) return
    await formRef.value.validate(async(valid:boolean)=>{
        if(valid){
          try{ 
            if (formData.value.id){
            await updatePermission(formData.value.id,{
              name:formData.value.name,
              description:formData.value.description
            })
            ElMessage.success("更新权限成功")
            }
            else
            {
              //创建新的权限
              await createPermission({
                name:formData.value.name,
                description:formData.value.description
              })
              ElMessage.success('创建权限成功')
            }
            dialogVisible.value=false
            loadPermissions()
          }catch (error){
            ElMessage.error('请求后端api报错')
          }
        } else{
          ElMessage.error("请求错误")
        }
      }
    )
  }

const dodeletePermission=async(id:number)=>{
  try{
    await deletePermission(id)
    loadPermissions()
    ElMessage.success("删除权限成功")
  }
  catch(error){
    ElMessage.error("删除失败")
  }
}
  // Load roles and permissions when the component is mounted
onMounted(() => {
  loadPermissions()
})
</script>
<template>
  <div class="about">
    <el-button type="primary" @click="openPermisiondialog">新增权限</el-button>
    <el-table :data="allPermissions" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60"></el-table-column>
      <el-table-column prop="name" label="name"></el-table-column>
      <el-table-column prop="description" label="description"></el-table-column>
      <el-table-column prop="created_at" label="Created At"></el-table-column>
      <el-table-column label="Actions" width="180">
        <template #default="scope">
          <el-button @click="openPermisiondialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="dodeletePermission(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" title="创建 Permission">
      <el-form :model="formData" ref="formRef" :rules="allPermissions" label-width="120px">
        <!-- Permission -->
        <el-form-item label="权限名称" prop="权限名称">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <!-- Email -->
        <el-form-item label="权限描述" prop="权限描述">
          <el-input v-model="formData.description"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="submitForm">Confirm</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
.dialog-footer {
  text-align: right;
}
.role-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
}
.custom-mini-button {
  padding: 2px 6px;
  font-size: 12px;
}
</style>