import api from './api'

//****************************交易管理****************************
// 获取交易记录
export const fetchTradeRecords = (params?: {
    page?: number
    pageSize?: number
    trade_type?: string
    coin_id?: number
    action?: string
}) => {
    return api.get('/trade_records', { params })
}

// 获取钱包余额
export const fetchWalletBalance = () => {
    return api.get('/wallet/balance')
}

// 钱包充值/提现
export const updateWallet = (data: {
    amount: number
    transaction_type: string
    trade_type: string
}) => {
    return api.post('/wallet/update', data)
}

// 获取交易历史
export const fetchTransactionHistory = (params?: {
    page?: number
    pageSize?: number
    coin_id?: number
}) => {
    return api.get('/transaction_history', { params })
}

//****************************社交指标****************************
// 获取社交指标列表
export const fetchSocialMetrics = (params?: {
    page?: number
    pageSize?: number
    search?: string
    event_id?: number
}) => {
    return api.get('/social_metrics', { params })
}

// 创建社交指标
export const createSocialMetric = (data: {
    event_id: number
    platform: string
    mentions: number
    sentiment_type: boolean
    sentiment_intensity: number
}) => api.post('/social_metrics', data)

// 修改社交指标
export const updateSocialMetric = (id: number, data: any) =>
    api.put(`/social_metrics/${id}`, data)

// 删除社交指标
export const deleteSocialMetric = (id: number) =>
    api.delete(`/social_metrics/${id}`)
