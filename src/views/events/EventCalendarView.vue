<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchEvents, createEvent, updateEvent, deleteEvent,fetchEventTypes,createEventType,updateEventType,deleteEventType } from '@/utils/eventnewsapi'
import { formatDateToTimezone } from '@/utils/utillibs'
import { fetchAllCoins } from '@/utils/coinapi'

const searchEvent = ref(''); // 搜索关键字
const currentPage = ref(1); // 当前页码
const pageSize = ref(10); // 每页大小
const totalItems = ref(0); // 总记录数
const coins = ref<Coin[]>([])
const sortField = ref('event_date'); // 排序字段
const sortOrder = ref('asc'); // 排序方式：asc（升序）或 desc（降序）

const handleSortChange = ({ column, prop, order }: { column: any; prop: string; order: string }) => {
  if (prop === 'event_date') {
    sortField.value = prop;
    sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
    loadEvents(); // 重新加载数据
  }
};

interface Coin{
  id: number | null
  name: string
}
// Define the interface for event data
interface Event {
  id: number | null
  event_name: string
  event_date: Date
  event_type_id: number |null
  description: string
  influence_score: number
  coin_id: [number] | null, // 修改为 [number] | null
}

// Define the interface for event type data
interface EventType {
  id: number | null
  name: string
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
  event_type_id: null,
  event_date:new Date(),
  influence_score: 0,
  coin_id: null // 修改为 null
})

const eventtypeformData = ref<EventType>({
  id: null,
  name: '',
  description: ''
})

const eventformRef = ref() // Reference to the form instance
const eventtypeformRef = ref() // Reference to the form instance

// Validation rules
const event_rules = {
  title: [{ required: true, message: '请输入事件标题', trigger: 'blur' }],
  description: [{ required: false, message: '请输入事件描述', trigger: 'blur' }],
  event_type_id: [{ required: false, message: '请选择事件类型', trigger: 'blur' }],
  event_date: [{ required: false, message: '请选择事件日期', trigger: 'blur' }]
}

const event_type_rules = {
  name: [{ required: true, message: '请输入事件类型名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入事件类型描述', trigger: 'blur' }]
}

//Function to load events from the backend
const loadCoins = async () => {
  try {
    const response = await fetchAllCoins()
    coins.value = response.data
  } catch (error) {
    ElMessage.error('加载币种失败')
  }
}

// Function to load events from the backend

const loadEvents = async () => {
  try {
    const response = await fetchEvents({
      page: currentPage.value,
      per_page: pageSize.value,
      search: searchEvent.value,
      sort_field: sortField.value, // 排序字段
      sort_order: sortOrder.value // 排序方式
    });
    totalItems.value = response.data.total;
    events.value = response.data.data;
  } catch (error) {
    ElMessage.error('加载事件失败');
  }
};

const handleSearch = () => {
  currentPage.value = 1; // 搜索时重置到第一页
  loadEvents();
};

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  loadEvents(); // 重新加载数据
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  loadEvents(); // 重新加载数据
};


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
  eventformData.value = { id: null, event_name: '', description: '', event_type_id: 0, event_date: new Date(), influence_score: 0, coin_id:[0] }
}

// Function to reset the event type form data
const resetEventTypeForm = () => {
  EditDialogVisible.value = false
  eventtypedialogVisible.value = false
  eventtypeformData.value = { id: null, name: '', description: ''}
}


// Function to edit an event
const doeditEvent = (event: Event) => {
  eventdialogVisible.value = true;
  EditDialogVisible.value = true;
  eventformData.value = {
    ...event,
    coin_id: event.coin_id || [0] // 确保 coin_id 是数组，如果为 null 则设置为 [0]
  };
};
// Function to delete an event
const doDeleteEvent = async (id: number) => {
  await deleteEvent(id)
  loadEvents()
}

// Function to submit the form data
const submitEventForm = async () => {
  console.log("事件类型")
  if(!eventformRef.value) return
  await eventformRef.value.validate(async(valid:boolean) => {
    if (!valid) return
    try{
      console.log("准备创建事件")
      if (eventformData.value.id) {
        await updateEvent(
          eventformData.value.id,
          {
            event_name: eventformData.value.event_name,
            event_date: new Date(formatDateToTimezone({ date: eventformData.value.event_date })),
            event_type_id: eventformData.value.event_type_id || 0, // 如果为 null，则设置为 0
            description: eventformData.value.description,
            influence_score: eventformData.value.influence_score,
            coin_id: eventformData.value.coin_id || [0] // 如果为 null，则设置为 [0]
          })
        ElMessage.success('事件更新成功')
      } else {
        await createEvent({
          event_name: eventformData.value.event_name,
          event_date: new Date(formatDateToTimezone({ date: eventformData.value.event_date })),
          event_type_id: eventformData.value.event_type_id || 0, // 如果为 null，则设置为 0
          description: eventformData.value.description,
          influence_score: eventformData.value.influence_score,
          coin_id: eventformData.value.coin_id || [0] // 如果为 null，则设置为 [0]
        })
        ElMessage.success('事件创建成功')
      }
      eventdialogVisible.value = false
      EditDialogVisible.value = false
      resetEventForm()
      loadEvents()
    } catch (error) {
      ElMessage.error('事件创建失败')
    }
  })
}

// Function to submit the event type form data
const submitEventTypeForm = async () => {
  if(!eventtypeformRef.value) return
  await eventtypeformRef.value.validate(async(valid:boolean) => {
    if (!valid) return
    try{
      console.log("准备创建事件类型")
      if (eventtypeformData.value.id) {
        await updateEventType(
          eventtypeformData.value.id,
          {
            name: eventtypeformData.value.name,
            description: eventtypeformData.value.description
          })
        ElMessage.success('事件类型更新成功')
      } else {
        await createEventType({
          name: eventtypeformData.value.name,
          description: eventtypeformData.value.description
        })
        ElMessage.success('事件类型创建成功')
      }
      eventtypedialogVisible.value = false
      EditDialogVisible.value = false
      resetEventTypeForm()
      loadEventTypes()
    } catch (error) {
      ElMessage.error('事件类型创建失败')
    }
  })
}
// Lifecycle hook
onMounted(() => {
  loadEvents()
  loadEventTypes()
  loadCoins()
})
</script>
<template>
<div>
  <div class="button-group" style="margin:10px 10px;">
    <el-button type="primary" @click="loadEvents" style="margin-left: 15px;">刷新</el-button>
    <el-button type="primary" @click="openEventDialog">添加事件</el-button>
    <el-button type="primary" @click="openEventTypeDialog">添加事件类型</el-button>
    <el-input v-model="searchEvent" placeholder="搜索事件" style="width: 200px; margin-left: 15px;" @input="handleSearch"></el-input>
    <el-select v-model="selectedEventype" placeholder="选择事件类型" clearable  style="width: 400px; margin-left: 15px;">
      <el-option
        v-for="type in eventTypes"
        :key="type.id"
        :label="type.name"
        :value="type.id"
        >
        <div class="eventype-option">
          <span>{{ type.name }}</span>
          <div class="eventype-actions">
          <el-button type="primary" size='small' @click.stop="doeditEventType(type)">编辑</el-button>
          <el-button type="danger" size="small" @click.stop="type.id !== null && doDeleteEventType(type.id)">删除</el-button>
          </div>
      </div>
      </el-option>
    </el-select>

  </div>
        <el-table :data="events" border style="width: 100%">
          <el-table-column prop="event_name" label="事件名称" width="180"></el-table-column>
          <el-table-column
            prop="event_date"
            label="事件日期"
            width="160"
            sortable
            :sort-orders="['ascending', 'descending']"
            @sort-change="handleSortChange"
          >
            <template #default="{ row }">
              {{ formatDateToTimezone({ date: row.event_date }) }}
            </template>
          </el-table-column>
          <el-table-column prop="event_type_id" label="事件类型" width="150">
            <template #default="{ row }">
              {{ eventTypes.find((type) => type.id === row.event_type_id)?.name }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="事件描述" width="180"></el-table-column>

          <el-table-column prop="influence_score" label="影响力" width="90"></el-table-column>
          <el-table-column prop="coins" label="关联币种" width="280">
            <template #default="{ row }">
              <span v-for="name in row.coins" :key="name" class="perm-tag">{{ name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button type="primary" @click="doeditEvent(row)">编辑</el-button>
              <el-button type="danger" @click="doDeleteEvent(row.id)">删除</el-button>
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

    <el-dialog
      :title="EditDialogVisible ? '编辑事件' : '添加事件'"
      v-model="eventdialogVisible"
      width="30%"
      :before-close="resetEventForm"
    >
      <el-form :model="eventformData" :rules="event_rules" ref="eventformRef" label-width="100px">
        <el-form-item label="事件名称" prop="event_name">
          <el-input v-model="eventformData.event_name"></el-input>
        </el-form-item>
        <el-form-item label="事件日期" prop="event_date">
          <el-date-picker
            v-model="eventformData.event_date"
            type="datetime"
            placeholder="选择日期和时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="事件类型" prop="event_type_id">
          <el-select v-model="eventformData.event_type_id" placeholder="请选择事件类型">
            <el-option
              v-for="type in eventTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="事件描述" prop="description">
          <el-input v-model="eventformData.description"></el-input>
        </el-form-item>
        <el-form-item label="关联币种" prop="coin_influence">
            <el-select v-model="eventformData.coin_id" multiple filterable placeholder="请选择币种类型">
              <el-option
                v-for="item in coins"
                :key="item.id"
                :label="item.name"
                :value="item.id">
              </el-option>
            </el-select>
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
      :title="EditDialogVisible ? '编辑事件类型' : '添加事件类型'"
      v-model="eventtypedialogVisible"
      width="30%"
      :before-close="resetEventTypeForm">
      <el-form :model="eventtypeformData" :rules="event_type_rules" ref="eventtypeformRef" label-width="100px">
        <el-form-item label="类型名称" prop="name">
          <el-input v-model="eventtypeformData.name"></el-input>
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
.eventype-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 5px 0;
}
.eventype-actions {
  display: flex;
  gap: 20px;
}
.dialog-footer {
  text-align: center;
  margin-top: 10px;
}
.perm-tag {
  display: inline-block;
  background-color: #f0f0f0;
  padding: 2px 6px;
  margin: 2px;
  border-radius: 4px;
}
</style>