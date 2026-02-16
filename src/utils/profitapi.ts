import api from './api'

//****************************日收益分析****************************
// 获取日收益列表
export const fetchDailyProfits = (params?: {
    trade_type?: string
    start_date?: string
    end_date?: string
    page?: number
    pageSize?: number
}) => {
    return api.get('daily_profits', { params })
}

// 计算当日收益
export const calculateDailyProfit = (data?: {
    trade_type?: string
}) => {
    return api.post('daily_profits/calculate', data)
}

// 获取多周期收益统计（7d/15d/30d/90d/180d/累计 + 收益率 + 最大回撤 + 曲线）
export const fetchProfitStatistics = (params?: {
    trade_type?: string
}) => {
    return api.get('profit_statistics', { params })
}
