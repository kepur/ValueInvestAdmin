import api from './api'
import { cronBaseURL } from '@/config/baseConfig'
import axios from 'axios'

const cronApi = axios.create({ baseURL: cronBaseURL, timeout: 60000 })

//****************************评分管理****************************
// 获取投资价值评估列表
export const fetchInvestmentScores = (params?: {
    page?: number
    pageSize?: number
    coin_id?: number
}) => {
    return api.get('investment_scores', { params })
}

// 触发单个/批量 AI 风险评估 (调用 Cron 服务)
export const triggerRiskScore = (params: {
    coin_symbols?: string[]
    provider?: string
    max_retries?: number
}) => cronApi.post('tasks/risk_score', params)
