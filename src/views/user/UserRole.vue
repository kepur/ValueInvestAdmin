<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'

  import{
    fetchRoles,
    createRole,
    deleteRole  as deleteRoleAPI,
    updateRole,
    fetchAllPermissions,
  } from '@/utils/role'


// Define the interface for role data
interface Role {
  id: number | null
  name: string
  description: string
  permissions: string[]
  created_at?: string
}

// Reactive references for data and state
const roles = ref<Role[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const formData = ref<Role>({
  id: null,
  name: '',
  description: '',
  permissions: []
})
const formRef = ref() // Reference to the form instance

const allPermissions = ref<{ name: string }[]>([]) // All available permissions

// Validation rules
const rules = {
  name: [{ required: true, message: 'Please enter Role Name', trigger: 'blur' }],
  permissions: [
    { required: true, message: 'Please select at least one permission', trigger: 'change' }
  ]
}

// Function to load roles from the backend
const loadRoles = async () => {
  loading.value = true
  try {
    const response = await fetchRoles()
    roles.value = response.data
  } catch (error) {
    ElMessage.error('Failed to load roles')
  } finally {
    loading.value = false
  }
}

// Function to load all permissions
const loadAllPermissions = async () => {
  try {
    const response = await fetchAllPermissions()
    allPermissions.value = response.data
  } catch (error) {
    ElMessage.error('Failed to load permissions')
  }
}

// Function to open the dialog for creating or editing a role
const openCreateRoleDialog = (role: Role | null) => {
  if (role) {
    formData.value = { ...role }
  } else {
    formData.value = { id: null, name: '', description: '', permissions: [] }
  }
  dialogVisible.value = true
}

// Function to submit the form data to the backend
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        if (formData.value.id) {
          // Update existing role
          await updateRole(formData.value.id, {
            name: formData.value.name,
            description: formData.value.description,
            permissions: formData.value.permissions
          })
          ElMessage.success('Role updated successfully')
        } else {
          // Create new role
          await createRole({
            name: formData.value.name,
            description: formData.value.description,
            permissions: formData.value.permissions
          })
          ElMessage.success('Role created successfully')
        }
        dialogVisible.value = false
        loadRoles()
      } catch (error) {
        ElMessage.error('Failed to submit role')
      }
    } else {
      ElMessage.error('Please fill in the required fields')
    }
  })
}

// Function to delete a role
const deleteRole = async (id: number) => {
  try {
    await deleteRoleAPI(id)
    ElMessage.success('Role deleted successfully')
    loadRoles()
  } catch (error) {
    ElMessage.error('Failed to delete role')
  }
}

// Load roles and permissions when the component is mounted
onMounted(() => {
  loadRoles()
  loadAllPermissions()
})
</script>

<template>
  <div>
    <el-button type="primary" @click="openCreateRoleDialog">创建权限</el-button>
    <el-table :data="roles" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60"></el-table-column>
      <el-table-column prop="name" label="Role Name"></el-table-column>
      <el-table-column prop="description" label="Description"></el-table-column>
      <el-table-column prop="permissions" label="Permissions">
        <template #default="scope">
          <span v-for="perm in scope.row.permissions" :key="perm" class="perm-tag">{{ perm }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="Created At"></el-table-column>
      <el-table-column label="Actions" width="180">
        <template #default="scope">
          <el-button @click="openCreateRoleDialog(scope.row)">Edit</el-button>
          <el-button type="danger" @click="deleteRole(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" title="Role Management">
      <el-form :model="formData" ref="formRef" :rules="rules" label-width="120px">
        <!-- Role Name -->
        <el-form-item label="Role Name" prop="name">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <!-- Description -->
        <el-form-item label="Description" prop="description">
          <el-input v-model="formData.description"></el-input>
        </el-form-item>
        <!-- Permissions -->
        <el-form-item label="Permissions" prop="permissions">
          <el-select v-model="formData.permissions" multiple placeholder="Select Permissions">
            <el-option
              v-for="perm in allPermissions"
              :key="perm.name"
              :label="perm.name"
              :value="perm.name"
            ></el-option>
          </el-select>
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
.perm-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
}
</style>
