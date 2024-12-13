<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import type { FormRules } from 'element-plus';

const authStore = useAuthStore()
const errorMessage = ref('')
const router = useRouter()

const formData = reactive({
  loginId: '',
  loginPwd: ''
})

const validateLoginId = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input username'))
  } else {
    callback()
  }
}

const validateLoginPwd = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('Please input password'))
  } else {
    callback()
  }
}
const rules = reactive<FormRules>({
  loginId: [{ validator: validateLoginId, trigger: 'blur' }],
  loginPwd: [{ validator: validateLoginPwd, trigger: 'blur' }],
});

const submitForm = async () => {
  try {
    if (!formData.loginId || !formData.loginPwd) {
      errorMessage.value = 'Plz input ur username'
      return
    }
    await authStore.login(formData.loginId, formData.loginPwd)
    ElMessage.success('Login success')
    if (authStore.isAuthenticated()) {
      router.push('/index') //
    }
  } catch (error) {
    errorMessage.value = 'Login Faild Plz retry' + error
    ElMessage.error(errorMessage.value)
  }
}
</script>

<template>
  <div class="login">
    <div class="box">
      <h2>AI Story System Login</h2>
      <el-form :model="formData" :rules="rules" size="small" status-icon label-width="100px">
        <el-form-item label="Username:" prop="loginId">
          <el-input v-model="formData.loginId"></el-input>
        </el-form-item>
        <el-form-item label="Password:" prop="loginPwd">
          <el-input v-model="formData.loginPwd" type="password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm">Login</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(to bottom, #1e1e1e, #b7babd);
  display: flex;
  justify-content: center;
  align-items: center;

  .box {
    width: 400px;
    padding: 20px;
    border: 1px solid #fff;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.7);

    h2 {
      color: #fff;
      font-size: 20px;
      margin-bottom: 20px;
      text-align: center;
    }

    ::v-deep .el-form-item__label {
      color: #fff;
    }
  }
}
</style>
