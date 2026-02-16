import axios from 'axios'
import { cronBaseURL, cronWsURL } from '@/config/baseConfig'

// Cron 服务 axios 实例
const cronApi = axios.create({
    baseURL: cronBaseURL,
    timeout: 60000,
})

// ── HTTP 接口 ──

/** 获取所有任务执行记录 */
export const fetchTaskStatus = () => cronApi.get('tasks/task_status')

/** 获取指定任务的日志详情 */
export const fetchTaskLogs = (taskId: string) => cronApi.get(`tasks/task_logs/${taskId}`)

/** 手动触发新闻采集 */
export const triggerNewsCollection = () => cronApi.post('tasks/collect_news')

/** 手动触发情绪计算 */
export const triggerSentimentCalc = () => cronApi.post('tasks/calculate_sentiment')

/** 手动触发代币信息 AI 抓取 */
export const triggerCoinInfoFetch = (params?: {
    coin_symbols?: string[]
    provider?: string
    max_retries?: number
}) => cronApi.post('tasks/fetch_coin_info', params || {})

/** 手动触发 K 线聚合 */
export const triggerKlineAggregate = (params?: {
    intervals?: string[]
    lookback_hours?: number
}) => cronApi.post('tasks/aggregate_kline', params || {})

// ── WebSocket 连接 ──

export interface TaskLogMessage {
    type: 'task_started' | 'task_log' | 'task_finished'
    task_id?: string
    task_type?: string
    task_name?: string
    level?: string
    message?: string
    stage?: string
    progress?: number
    timestamp?: string
    status?: string
    result?: any
    extra?: any
}

/**
 * 创建任务日志 WebSocket 连接
 * @param taskId 可选，指定任务ID则只接收该任务日志
 * @param onMessage 消息回调
 * @param onClose 关闭回调
 * @returns WebSocket 实例
 */
export function connectTaskLogWS(
    taskId: string | null,
    onMessage: (msg: TaskLogMessage) => void,
    onClose?: () => void,
): WebSocket {
    const path = taskId ? `tasks/ws/task_logs/${taskId}` : 'tasks/ws/task_logs'
    const ws = new WebSocket(`${cronWsURL}${path}`)

    ws.onmessage = (event) => {
        try {
            const data: TaskLogMessage = JSON.parse(event.data)
            onMessage(data)
        } catch (e) {
            console.error('解析任务日志消息失败', e)
        }
    }

    ws.onclose = () => {
        onClose?.()
    }

    ws.onerror = (err) => {
        console.error('任务日志 WebSocket 错误', err)
    }

    // 心跳保活 (每30秒)
    const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping')
        } else {
            clearInterval(heartbeat)
        }
    }, 30000)

    return ws
}
