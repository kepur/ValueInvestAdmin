import api from './api'

//****************************实时价格WebSocket****************************
// CoinGecko 免费实时价格获取
export const fetchRealTimePrice = (params?: {
    symbols?: string
    vs_currency?: string
}) => {
    return api.get('realtime_price', { params })
}

// 同步实时价格到后端数据库
export const syncRealTimePrice = (data?: {
    coin_ids?: number[]
}) => {
    return api.post('realtime_price_sync', data)
}