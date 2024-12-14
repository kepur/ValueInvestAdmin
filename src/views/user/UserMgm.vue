<template>
  <div>
    <el-button type="primary" @click="openDialog(null)">Create New User</el-button>
    <el-table :data="users" style="width: 100%" v-loading="loading">
      <el-table-column prop="id" label="ID" width="60"></el-table-column>
      <el-table-column prop="username" label="Username"></el-table-column>
      <el-table-column prop="email" label="Email"></el-table-column>
      <el-table-column prop="roles" label="Roles">
        <template #default="scope">
          <span v-for="role in scope.row.roles" :key="role" class="role-tag">{{ role }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="Created At"></el-table-column>
      <el-table-column label="Actions" width="180">
        <template #default="scope">
          <el-button @click="openDialog(scope.row)">Edit</el-button>
          <el-button size="small" type="danger" @click="deleteUser(scope.row.id)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Dialog -->
    <el-dialog v-model="dialogVisible" title="User Management">
      <el-form :model="formData" ref="formRef" :rules="rules" label-width="120px">
        <!-- Username -->
        <el-form-item label="Username" prop="username">
          <el-input v-model="formData.username"></el-input>
        </el-form-item>
        <!-- Email -->
        <el-form-item label="Email" prop="email">
          <el-input v-model="formData.email"></el-input>
        </el-form-item>
        <!-- Password -->
        <el-form-item label="Password" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            autocomplete="new-password"
          ></el-input>
        </el-form-item>
        <!-- Roles -->
        <el-form-item label="Roles" prop="roles">
          <el-select v-model="formData.roles" multiple placeholder="Select Roles">
            <el-option
              v-for="role in allRoles"
              :key="role.name"
              :label="role.name"
              :value="role.name"
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

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser as deleteUserAPI,
  fetchAllRoles
} from '@/utils/userapi'

// Define the interface for user data
interface User {
  id: number | null
  username: string
  email: string
  password?: string
  roles: string[]
  created_at?: string
}

// Reactive references for data and state
const users = ref<User[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const formData = ref<User>({
  id: null,
  username: '',
  email: '',
  password: '',
  roles: []
})
const formRef = ref() // Reference to the form instance

const allRoles = ref<{ name: string }[]>([]) // All available roles

// Validation rules
const rules = {
  username: [{ required: true, message: 'Please enter Username', trigger: 'blur' }],
  email: [{ required: true, message: 'Please enter Email', trigger: 'blur' }],
  // Password is required when creating a new user
  password: [{ required: false, message: 'Please enter Password', trigger: 'blur' }],
  roles: [{ required: true, message: 'Please select at least one role', trigger: 'change' }]
}

// Function to load users from the backend
// UserMgm.vue

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await fetchUsers()
    console.log('API Response:', response.data)
    if (response.data) {
      users.value = response.data
    } else {
      ElMessage.error('Invalid data format received from API')
    }
  } catch (error) {
    ElMessage.error('Failed to load users')
  } finally {
    loading.value = false
  }
}

// Function to load all roles
const loadAllRoles = async () => {
  try {
    const response = await fetchAllRoles()
    allRoles.value = response.data
  } catch (error) {
    ElMessage.error('Failed to load roles')
  }
}

// Function to open the dialog for creating or editing a user
const openDialog = (user: User | null) => {
  if (user) {
    formData.value = { ...user, password: '' } // Clear password field when editing
    // When editing, password is optional
    rules.password[0].required = false
  } else {
    formData.value = { id: null, username: '', email: '', password: '', roles: [] }
    // When creating, password is required
    rules.password[0].required = true
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
          // Update existing user
          const updateData: any = {
            username: formData.value.username,
            email: formData.value.email,
            roles: formData.value.roles
          }
          if (formData.value.password) {
            updateData.password = formData.value.password
          }
          await updateUser(formData.value.id!, updateData)
          ElMessage.success('User updated successfully')
        } else {
          // Create new user
          await createUser({
            username: formData.value.username,
            email: formData.value.email,
            password: formData.value.password!,
            roles: formData.value.roles
          })
          ElMessage.success('User created successfully')
        }
        dialogVisible.value = false
        loadUsers()
      } catch (error) {
        ElMessage.error('Failed to submit user')
      }
    } else {
      ElMessage.error('Please fill in the required fields')
    }
  })
}

// Function to delete a user
const deleteUser = async (id: number) => {
  try {
    await deleteUserAPI(id)
    ElMessage.success('User deleted successfully')
    loadUsers()
  } catch (error) {
    ElMessage.error('Failed to delete user')
  }
}

// Load users and roles when the component is mounted
onMounted(() => {
  loadUsers()
  loadAllRoles()
})
</script>

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
