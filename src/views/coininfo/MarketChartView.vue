<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { fetchKlineData } from '@/utils/priceapi'
import { fetchCoins } from '@/utils/coinapi'
import KlineChart from '@/components/KlineChart.vue'
import { ElMessage } from 'element-plus'

const coins = ref<any[]>([])
const selectedCoinId = ref<number | null>(null)
const selectedInterval = ref('15m')
const klineData = ref<any[]>([])
const loading = ref(false)

const intervals = [
    { label: '1分钟', value: '1m' },
    { label: '5分钟', value: '5m' },
    { label: '15分钟', value: '15m' },
    { label: '1小时', value: '1h' },
    { label: '4小时', value: '4h' },
    { label: '1天', value: '1d' },
]

const loadCoins = async () => {
    try {
        const res = await fetchCoins({ page: 1, pageSize: 100 })
        coins.value = res.data.data || []
        if (coins.value.length > 0 && !selectedCoinId.value) {
            selectedCoinId.value = coins.value[0].id
        }
    } catch (e) {
        ElMessage.error('加载币种列表失败')
    }
}

const loadKline = async () => {
    if (!selectedCoinId.value) return
    loading.value = true
    try {
        const res = await fetchKlineData({
            coin_id: selectedCoinId.value,
            interval: selectedInterval.value,
            limit: 100
        })
        klineData.value = res.data.data || []
    } catch (e) {
        ElMessage.error('加载K线数据失败')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadCoins()
})

watch([selectedCoinId, selectedInterval], () => {
    loadKline()
})
</script>

<template>
    <div class="market-chart-view">
        <el-card shadow="never">
            <template #header>
                <div class="header-actions">
                    <el-select v-model="selectedCoinId" placeholder="选择币种" style="width: 200px;">
                        <el-option v-for="coin in coins" :key="coin.id" :label="`${coin.name} (${coin.name})`" :value="coin.id" />
                    </el-select>
                    <el-radio-group v-model="selectedInterval" size="small">
                        <el-radio-button v-for="item in intervals" :key="item.value" :label="item.value">
                            {{ item.label }}
                        </el-radio-button>
                    </el-radio-group>
                    <el-button @click="loadKline" icon="Refresh" circle />
                </div>
            </template>

            <div v-loading="loading" class="chart-container">
                <KlineChart v-if="klineData.length > 0" :data="klineData" :title="`K线图 - ${selectedInterval}`" height="500px" />
                <el-empty v-else description="暂无K线数据，请确保后台已运行 K线聚合任务" />
            </div>
        </el-card>

        <el-alert
            title="提示"
            type="info"
            description="K线数据基于聚合任务产生。如果没有数据，请在「任务日志」中手动触发「K线聚合」任务。"
            show-icon
            style="margin-top: 20px;"
        />
    </div>
</template>

<style scoped>
.market-chart-view {
    padding: 20px;
}
.header-actions {
    display: flex;
    gap: 20px;
    align-items: center;
}
.chart-container {
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
