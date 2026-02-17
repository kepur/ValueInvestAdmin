<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
    data: any[]
    title?: string
    height?: string
}>()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const initChart = () => {
    if (!chartRef.value) return
    chartInstance = echarts.init(chartRef.value)
    updateChart()
}

const updateChart = () => {
    if (!chartInstance) return

    const kData = props.data.map(item => [
        item.open,
        item.close,
        item.low,
        item.high
    ])
    const categoryData = props.data.map(item => {
        if (item.time_label) return item.time_label
        // 如果虽然是数字但看起来像毫秒(大于 1e11)，则不乘以1000
        if (typeof item.timestamp === 'number') {
             const ts = item.timestamp > 1e11 ? item.timestamp : item.timestamp * 1000
             return new Date(ts).toLocaleString()
        }
        //如果是字符串直接返回
        return item.timestamp
    })

    const option = {
        title: {
            text: props.title || 'K-Line Chart',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        grid: {
            left: '10%',
            right: '10%',
            bottom: '15%'
        },
        xAxis: {
            type: 'category',
            data: categoryData,
            scale: true,
            boundaryGap: false,
            axisLine: { onZero: false },
            splitLine: { show: false },
            min: 'dataMin',
            max: 'dataMax'
        },
        yAxis: {
            scale: true,
            splitArea: { show: true }
        },
        dataZoom: [
            {
                type: 'inside',
                start: 50,
                end: 100
            },
            {
                show: true,
                type: 'slider',
                top: '90%',
                start: 50,
                end: 100
            }
        ],
        series: [
            {
                name: 'Candlestick',
                type: 'candlestick',
                data: kData,
                itemStyle: {
                    color: '#ef232a',
                    color0: '#14b143',
                    borderColor: '#ef232a',
                    borderColor0: '#14b143'
                }
            }
        ]
    }

    chartInstance.setOption(option)
}

watch(() => props.data, () => {
    updateChart()
}, { deep: true })

const handleResize = () => {
    chartInstance?.resize()
}

onMounted(() => {
    initChart()
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    chartInstance?.dispose()
})
</script>

<template>
    <div ref="chartRef" :style="{ width: '100%', height: props.height || '400px' }"></div>
</template>

<style scoped>
</style>
