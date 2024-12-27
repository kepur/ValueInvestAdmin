<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchEvents, createEvent, updateEvent, deleteEvent,fetchEventTypes,createEventType,updateEventType,deleteEventType } from '@/utils/eventnewsapi'
import { formatDateToTimezone } from '@/utils/utillibs'

const searchEvent = ref(''); // 搜索关键字
const currentPage = ref(1); // 当前页码
const pageSize = ref(1); // 每页大小
const totalItems = ref(0); // 总记录数

// Define the interface for event data
interface Event {
  id: number | null
  event_name: string
  event_date: Date
  event_type_id: number
  description: string
  influence_score: number
}

// Define the interface for event type data
interface EventType {
  id: number | null
  type_name: string
  description: string
}

const openEventDialog = () => {
  console.log('open dialog')
  eventdialogVisible.value = true
}

const openEventTypeDialog = () => {
  console.log('open dialog')
  eventtypedialogVisible.value = true
}


// Reactive references for data and state
const events = ref<Event[]>([])
const eventTypes = ref<EventType[]>([])
const selectedEventype = ref<EventType | null>(null)

const eventdialogVisible = ref(false)
const eventtypedialogVisible = ref(false)
const EditDialogVisible = ref(false)

const eventformData = ref<Event>({
  id: null,
  event_name: '',
  description: '',
  event_type_id: 0,
  event_date:new Date(),
  influence_score: 0
})

const eventtypeformData = ref<EventType>({
  id: null,
  type_name: '',
  description: ''
})

const eventformRef = ref() // Reference to the form instance
const eventtypeformRef = ref() // Reference to the form instance

// Validation rules
const event_rules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入事件描述', trigger: 'blur' }],
  event_type_id: [{ required: true, message: '请选择事件类型', trigger: 'blur' }],
  event_date: [{ required: true, message: '请选择事件日期', trigger: 'blur' }]
}

const event_type_rules = {
  type_name: [{ required: true, message: '请输入事件类型名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入事件类型描述', trigger: 'blur' }]
}


// Function to load events from the backend
const loadEvents = async () => {
  try {
    const response = await fetchEvents({
      page:currentPage.value,
      per_page:pageSize.value,
      search:searchEvent.value
    })
    totalItems.value = response.data.total
    events.value = response.data.data
  } catch (error) {
    ElMessage.error('加载事件失败')
  }
}

// Function to load event types from the backend
const loadEventTypes = async () => {
  try {
    const response = await fetchEventTypes()
    eventTypes.value = response.data
  } catch (error) {
    ElMessage.error('加载事件类型失败')
  }
}

const doeditEventType = (eventType: EventType) => {
  eventtypeformData.value = { ...eventType }
  eventtypedialogVisible.value = true
  EditDialogVisible.value = true
}

const doDeleteEventType = async (id: number) => {
  await deleteEventType(id)
  loadEventTypes()
}


// Function to reset the form data
const resetEventForm = () => {
  EditDialogVisible.value = false
  eventdialogVisible.value = false
  eventformData.value = { id: null, event_name: '', description: '', event_type_id: 0, event_date: new Date(), influence_score: 0}
}

// Function to reset the event type form data
const resetEventTypeForm = () => {
  EditDialogVisible.value = false
  eventtypedialogVisible.value = false
  eventtypeformData.value = { id: null, type_name: '', description: ''}
}


// Function to edit an event
const doeditEvent = (event: Event) => {
  eventformData.value = { ...event }
  eventdialogVisible.value = true
  EditDialogVisible.value = true
}

// Function to delete an event
const doDeleteEvent = async (id: number) => {
  await deleteEvent(id)
  loadEvents()
}

// Function to submit the form data
const submitEventForm = async () => {
  if(!eventformData.value) return
  await eventformRef.value.validate(async() => {
    if (eventformRef.value.id) {
      await updateEvent(
        eventformRef.value.id,
        {
          event_name: eventformRef.value.event_name,
          event_date: new Date(formatDateToTimezone({ date: eventformRef.value.event_date })),
          event_type_id: eventformRef.value.event_type_id,
          description: eventformRef.value.description,
          influence_score: eventformRef.value.influence_score
        })
      ElMessage.success('事件更新成功')
    } else {
      await createEvent({
        event_name: eventformRef.value.event_name,
        description: eventformRef.value.description,
        event_type_id: eventformRef.value.event_type_id,
        event_date: new Date(formatDateToTimezone({ date: eventformRef.value.event_date })), 
        influence_score: eventformRef.value.influence_score
    })
    ElMessage.success('事件创建成功')
  }
    eventdialogVisible.value = false
    EditDialogVisible.value = false
    resetEventForm()
    loadEvents()
  })
}

// Function to submit the event type form data
const submitEventTypeForm = async () => {
  if(!eventtypeformData.value) return
  await eventtypeformRef.value.validate(async() => {
    if (eventtypeformRef.value.id) {
      await updateEventType(
        eventtypeformRef.value.id,
        {
          type_name: eventtypeformRef.value.type_name,
          description: eventtypeformRef.value.description
        })
      ElMessage.success('事件类型更新成功')
    } else {
      await createEventType({
        type_name: eventtypeformRef.value.type_name,
        description: eventtypeformRef.value.description
    })
    ElMessage.success('事件类型创建成功')
  }
    eventtypedialogVisible.value = false
    EditDialogVisible.value = false
    resetEventTypeForm()
    loadEventTypes()
  })
}

// Lifecycle hook
onMounted(() => {
  loadEvents()
  loadEventTypes()
})
</script>
<template>
<div>
  <div class="button-group" style="margin:10px 10px;">
    <el-button type="primary" @click="openEventDialog">添加事件</el-button>
    <el-button type="primary" @click="openEventTypeDialog">添加事件类型</el-button>
    <el-input v-model="searchEvent" placeholder="搜索事件" style="width: 150px; margin-left: 15px;"></el-input>
    <el-select v-model="selectedEventype" placeholder="选择事件类型" style="width: 400px; margin-left: 15px;">
      <el-option
        v-for="type in eventTypes"
        :key="type.id"
        :label="type.type_name"
        :value="type.id">
      </el-option>
    </el-select>
    <div class="event-type" v-for="type in eventTypes" :key="type.id">
      <span>{{ type.type_name }}</span>
      <el-button type="text" @click="doeditEventType(type)">编辑</el-button>
      <el-button type="text" @click="type.id !== null && doDeleteEventType(type.id)">删除</el-button>
    </div>
    <el-button type="primary" @click="loadEvents" style="margin-left: 15px;">刷新</el-button>

  </div>
        <el-table :data="events" border style="width: 100%">
          <el-table-column prop="event_name" label="事件名称"></el-table-column>
          <el-table-column prop="event_date" label="事件日期" width="180">
            <template #default="{ row }">
              {{ row.event_date | formatDate }}
            </template>
          </el-table-column>
          <el-table-column prop="event_type_id" label="事件类型" width="180">
            <template #default="{ row }">
              {{ eventTypes.find((type) => type.id === row.event_type_id)?.type_name }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="事件描述"></el-table-column>
          <el-table-column prop="influence_score" label="影响力" width="120"></el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button type="text" @click="doeditEvent(row)">编辑</el-button>
              <el-button type="text" @click="doDeleteEvent(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          @size-change="loadEvents"
          @current-change="loadEvents"
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper">
        </el-pagination>

    <el-dialog
      title="添加/编辑事件"
      v-model="eventdialogVisible"
      width="30%"
      :before-close="resetEventForm"
    >
      <el-form :model="eventformData" :rules="event_rules" ref="formRef" label-width="100px">
        <el-form-item label="事件名称" prop="event_name">
          <el-input v-model="eventformData.event_name"></el-input>
        </el-form-item>
        <el-form-item label="事件日期" prop="event_date">
          <el-date-picker
            v-model="eventformData.event_date"
            type="datetime"
            placeholder="选择日期时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            format="yyyy-MM-dd HH:mm:ss"
            clearable>
          </el-date-picker>
        </el-form-item>
        <el-form-item label="事件类型" prop="event_type_id">
          <el-select v-model="eventformData.event_type_id" placeholder="请选择事件类型">
            <el-option
              v-for="type in eventTypes"
              :key="type.id"
              :label="type.type_name"
              :value="type.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="事件描述" prop="description">
          <el-input v-model="eventformData.description"></el-input>
        </el-form-item>
        <el-form-item label="影响力" prop="influence_score">
          <el-input v-model="eventformData.influence_score"></el-input>
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="eventdialogVisible = false; resetEventForm()">取消</el-button>
        <el-button type="primary" @click="submitEventForm">确定</el-button>
      </div>
    </el-dialog>
    <el-dialog
      title="添加/编辑事件类型"
      v-model="eventtypedialogVisible"
      width="30%"
      :before-close="resetEventTypeForm">
      <el-form :model="eventtypeformData" :rules="event_type_rules" ref="formRef" label-width="100px">
        <el-form-item label="类型名称" prop="type_name">
          <el-input v-model="eventtypeformData.type_name"></el-input>
        </el-form-item>
        <el-form-item label="类型描述" prop="description">
          <el-input v-model="eventtypeformData.description"></el-input>
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="eventtypedialogVisible = false; resetEventTypeForm()">取消</el-button>
        <el-button type="primary" @click="submitEventTypeForm">确定</el-button>
      </div>
    </el-dialog>
</div>
</template>
<style scoped>
.el-table__body-wrapper {
  max-height: 500px;
  overflow-y: auto;
}

.el-pagination {
  margin-top: 20px;
  text-align: right;
}
</style>