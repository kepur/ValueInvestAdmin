<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchHotspots, fetchHotspotSentiment } from '@/utils/hotspotapi'
import { fetchAllCoins } from '@/utils/coinapi'
import { ElMessage } from 'element-plus'

// ── 情绪概览 ──
const overview = ref<any>({})
const sentimentDist = ref<any>({})
const trendingCoins = ref<any[]>([])

// ── 热点列表 ──
const hotspots = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(15)
const totalItems = ref(0)

// ── 筛选条件 ──
const searchKeyword = ref('')
const filterPlatform = ref('')
const filterCoinId = ref<number | undefined>(undefined)
const filterDateRange = ref<string[]>([])
const filterDays = ref(7)

// ── 币种选项 ──
const coinOptions = ref<any[]>([])

const platformOptions = [
    { label: '全部', value: '' },
    { label: 'CoinTelegraph', value: 'CoinTelegraph' },
    { label: 'CoinDesk', value: 'CoinDesk' },
]

const dayOptions = [
    { label: '7天', value: 7 },
    { label: '15天', value: 15 },
    { label: '30天', value: 30 },
]

// ── 加载情绪概览 ──
const loadSentiment = async () => {
    try {
        const res = await fetchHotspotSentiment({ days: filterDays.value, top_n: 10 })
        overview.value = res.data.overview || {}
        sentimentDist.value = res.data.sentiment_distribution || {}
        trendingCoins.value = res.data.trending_coins || []
    } catch (e) {
        console.error('加载情绪概览失败', e)
    }
}

// ── 加载热点列表 ──
const loadHotspots = async () => {
    try {
        const params: any = {
            page: currentPage.value,
            pageSize: pageSize.value,
        }
        if (searchKeyword.value) params.search = searchKeyword.value
        if (filterPlatform.value) params.platform = filterPlatform.value
        if (filterCoinId.value) params.coin_id = filterCoinId.value
        if (filterDateRange.value?.length === 2) {
            params.start_date = filterDateRange.value[0]
            params.end_date = filterDateRange.value[1]
        }
        const res = await fetchHotspots(params)
        hotspots.value = res.data.data || []
        totalItems.value = res.data.total || 0
    } catch (e) {
        ElMessage.error('加载热点数据失败')
    }
}

// ── 加载币种选项 ──
const loadCoins = async () => {
    try {
        const res = await fetchAllCoins()
        coinOptions.value = res.data || []
    } catch (e) {
        console.error('加载币种失败', e)
    }
}

// ── 事件处理 ──
const handleSearch = () => {
    currentPage.value = 1
    loadHotspots()
}

const handleReset = () => {
    searchKeyword.value = ''
    filterPlatform.value = ''
    filterCoinId.value = undefined
    filterDateRange.value = []
    currentPage.value = 1
    loadHotspots()
}

const handlePageChange = (page: number) => {
    currentPage.value = page
    loadHotspots()
}

const handleDaysChange = () => {
    loadSentiment()
}

// ── 辅助函数 ──
const moodLabel = (mood: string) => {
    const map: any = { bullish: '看涨', bearish: '看跌', neutral: '中性' }
    return map[mood] || mood
}

const moodType = (mood: string) => {
    const map: any = { bullish: 'success', bearish: 'danger', neutral: 'info' }
    return map[mood] || 'info'
}

const sentimentColor = (score: number) => {
    if (score > 20) return '#67c23a'
    if (score < -20) return '#f56c6c'
    return '#909399'
}

onMounted(() => {
    loadCoins()
    loadSentiment()
    loadHotspots()
})
</script>

<template>
    <div class="hotspot-manage">
        <!-- 情绪概览卡片 -->
        <el-row :gutter="16" style="margin-bottom: 16px;">
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header><span>市场情绪</span></template>
                    <div style="text-align: center;">
                        <el-tag :type="moodType(overview.market_mood)" size="large" effect="dark" style="font-size: 18px; padding: 8px 20px;">
                            {{ moodLabel(overview.market_mood) }}
                        </el-tag>
                        <div style="margin-top: 8px; color: #999; font-size: 13px;">
                            平均情绪分: <span :style="{ color: sentimentColor(overview.avg_sentiment), fontWeight: 'bold' }">{{ overview.avg_sentiment || 0 }}</span>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>事件统计</span>
                            <el-select v-model="filterDays" size="small" style="width: 80px;" @change="handleDaysChange">
                                <el-option v-for="d in dayOptions" :key="d.value" :label="d.label" :value="d.value" />
                            </el-select>
                        </div>
                    </template>
                    <div style="text-align: center; font-size: 28px; font-weight: bold; color: #409eff;">
                        {{ overview.total_events || 0 }}
                    </div>
                    <div style="text-align: center; color: #999; font-size: 13px;">近 {{ filterDays }} 天热点事件</div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header><span>情绪分布</span></template>
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-size: 20px; font-weight: bold; color: #67c23a;">{{ sentimentDist.bullish || 0 }}</div>
                            <div style="font-size: 12px; color: #999;">看涨 ({{ sentimentDist.bullish_pct || 0 }}%)</div>
                        </div>
                        <div>
                            <div style="font-size: 20px; font-weight: bold; color: #909399;">{{ sentimentDist.neutral || 0 }}</div>
                            <div style="font-size: 12px; color: #999;">中性 ({{ sentimentDist.neutral_pct || 0 }}%)</div>
                        </div>
                        <div>
                            <div style="font-size: 20px; font-weight: bold; color: #f56c6c;">{{ sentimentDist.bearish || 0 }}</div>
                            <div style="font-size: 12px; color: #999;">看跌 ({{ sentimentDist.bearish_pct || 0 }}%)</div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover">
                    <template #header><span>趋势币种 TOP5</span></template>
                    <div v-if="trendingCoins.length">
                        <div v-for="coin in trendingCoins.slice(0, 5)" :key="coin.coin_id"
                            style="display: flex; justify-content: space-between; padding: 2px 0; font-size: 13px;">
                            <span style="font-weight: bold;">{{ coin.symbol }}</span>
                            <span>
                                <el-tag :type="moodType(coin.sentiment_label)" size="small">{{ moodLabel(coin.sentiment_label) }}</el-tag>
                                <span style="margin-left: 4px; color: #999;">{{ coin.event_count }}条</span>
                            </span>
                        </div>
                    </div>
                    <div v-else style="text-align: center; color: #ccc;">暂无数据</div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 筛选栏 -->
        <el-card shadow="never" style="margin-bottom: 16px;">
            <el-form :inline="true" size="default">
                <el-form-item label="关键词">
                    <el-input v-model="searchKeyword" placeholder="搜索标题" clearable style="width: 180px;"
                        @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item label="来源">
                    <el-select v-model="filterPlatform" clearable placeholder="全部" style="width: 140px;">
                        <el-option v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value" />
                    </el-select>
                </el-form-item>
                <el-form-item label="关联币种">
                    <el-select v-model="filterCoinId" clearable filterable placeholder="全部" style="width: 160px;">
                        <el-option v-for="c in coinOptions" :key="c.id" :label="`${c.symbol} - ${c.name}`" :value="c.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="日期范围">
                    <el-date-picker v-model="filterDateRange" type="daterange" range-separator="至"
                        start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
                        style="width: 240px;" />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 热点数据表格 -->
        <el-card shadow="never">
            <el-table :data="hotspots" stripe border style="width: 100%;" max-height="500">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
                <el-table-column label="情绪" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag v-if="row.influence_score > 60" type="success" size="small">热门</el-tag>
                        <el-tag v-else-if="row.influence_score > 30" type="warning" size="small">一般</el-tag>
                        <el-tag v-else type="info" size="small">低热</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="热度" width="90" align="center">
                    <template #default="{ row }">
                        <el-progress :percentage="row.influence_score || 0" :stroke-width="14" :text-inside="true"
                            :color="row.influence_score > 60 ? '#67c23a' : row.influence_score > 30 ? '#e6a23c' : '#909399'" />
                    </template>
                </el-table-column>
                <el-table-column label="来源" width="120" align="center">
                    <template #default="{ row }">
                        <el-tag v-for="s in row.sources" :key="s.platform" size="small" style="margin: 1px;">
                            {{ s.platform }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="关联币种" width="150">
                    <template #default="{ row }">
                        <el-tag v-for="c in row.coins" :key="c.id" type="warning" size="small" style="margin: 1px;">
                            {{ c.symbol }}
                        </el-tag>
                        <span v-if="!row.coins?.length" style="color: #ccc;">-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="source_count" label="源数" width="60" align="center" />
                <el-table-column prop="event_date" label="发布时间" width="150" />
                <el-table-column prop="status" label="状态" width="80" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
                    </template>
                </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
                <el-pagination background layout="total, prev, pager, next, sizes" :total="totalItems"
                    v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 15, 20, 50]" @current-change="handlePageChange"
                    @size-change="() => { currentPage = 1; loadHotspots(); }" />
            </div>
        </el-card>
    </div>
</template>

<style scoped>
.hotspot-manage {
    padding: 12px;
}
</style>
