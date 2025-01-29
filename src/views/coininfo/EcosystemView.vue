<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createEcosystem, fetchEcosystems, updateEcosystem,deleteEcosystem } from '@/utils/coinapi';



const searchEcosystem = ref(''); // 搜索关键字
const currentPage = ref(1); // 当前页码
const pageSize = ref(10); // 每页大小
const totalItems = ref(0); // 总记录数



// Define the interface for ecosystem data
interface Ecosystem {
  id: number | null
  name: string
  description: string
}

const openDialog = () => {
  console.log('open dialog')
  dialogVisible.value = true
}

// Reactive references for data and state
const ecosystems = ref<Ecosystem[]>([])
const dialogVisible = ref(false)
const EditDialogVisible = ref(false)
const formData = ref<Ecosystem>({
  id: null,
  name: '',
  description: ''
})
const formRef = ref() // Reference to the form instance

// Validation rules
const rules = {
  name: [{ required: true, message: '请输入生态系统名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入生态系统描述', trigger: 'blur' }]
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1; // 搜索时重置到第一页
  loadEcosystems();
};

// Function to load ecosystems from the backend
const loadEcosystems = async () => {
  try {
    const response = await fetchEcosystems({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchEcosystem.value
    })
    ecosystems.value = response.data.data
    totalItems.value = response.data.total;
  } catch (error) {
    ElMessage.error('加载生态系统失败')
  }
}

// Function to reset the form data
const resetForm = () => {
  EditDialogVisible.value = false
  dialogVisible.value = false
  formData.value = { id: null, name: '', description: '' }
}

// Function to edit an ecosystem
const doeditEcosystem = (ecosystem: Ecosystem) => {
  EditDialogVisible.value = true
  formData.value = { ...ecosystem }
  dialogVisible.value = true
}

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  loadEcosystems(); // 重新加载数据
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  loadEcosystems(); // 重新加载数据
};

// Function to submit the form data
const submitForm = async () => {
  if(!formRef.value) return
  await formRef.value.validate(async() => {
    if (formData.value.id) {
      await updateEcosystem(
        formData.value.id,
        {
        name: formData.value.name,
        description: formData.value.description
      })
    } else {
      await createEcosystem({
        name: formData.value.name,
        description: formData.value.description
      })
    }
    dialogVisible.value = false
    EditDialogVisible.value = false
    loadEcosystems()
  })
}

// Function to delete an ecosystem
const doDeleteEcosystem = async (id: number) => {
  try {
    await deleteEcosystem(id)
    ElMessage.success('生态系统删除成功')
    loadEcosystems()
  } catch (error) {
    ElMessage.error('删除生态系统失败')
  }
}

// Load ecosystems when the component is mounted
onMounted(() => {
  loadEcosystems()
})

</script>
<template>
  <div>
    <el-button type="primary" @click="openDialog">创建生态系统</el-button>
    <el-input
      v-model="searchEcosystem"
      placeholder="输入名称"
      style="width: 300px; margin-left: 20px;"
      @input="handleSearch"
    />
    <el-dialog
      :title="EditDialogVisible ? '编辑生态系统名称':'创建生态系统名称'"
      v-model="dialogVisible"
      width="30%"
      :before-close="resetForm"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入生态系统名称"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" placeholder="请输入生态系统描述"></el-input>
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </div>
    </el-dialog>
    <el-table :data="ecosystems" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60"></el-table-column>
      <el-table-column prop="name" label="名称"></el-table-column>
      <el-table-column prop="description" label="描述"></el-table-column>
      <el-table-column prop="created_at" label="创建时间"></el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button  @click="doeditEcosystem(row)">编辑</el-button>
          <el-button type="danger" @click="doDeleteEcosystem(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>
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
.large-pagination .el-pagination__sizes,
.large-pagination .el-pagination__jump,
.large-pagination .el-pager li,
.large-pagination .btn-prev,
.large-pagination .btn-next {
  font-size: 16px; /* 调整字体大小 */
  padding: 10px 15px; /* 调整按钮内边距 */
  margin: 0 5px; /* 调整按钮外边距 */
}

.large-pagination .el-pager li {
  min-width: 40px; /* 调整页码按钮的最小宽度 */
  height: 40px; /* 调整页码按钮的高度 */
  line-height: 40px; /* 调整页码按钮的行高 */
}

.large-pagination .btn-prev,
.large-pagination .btn-next {
  min-width: 40px; /* 调整上一页和下一页按钮的最小宽度 */
  height: 40px; /* 调整上一页和下一页按钮的高度 */
  line-height: 40px; /* 调整上一页和下一页按钮的行高 */
}
</style>
