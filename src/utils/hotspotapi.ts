import api from './api'

// 获取热点新闻列表（标准化）
export const fetchHotspots = (params?: {
    page?: number
    pageSize?: number
    coin_id?: number
    platform?: string
    start_date?: string
    end_date?: string
    search?: string
}) => api.get('hotspots', { params })

// 获取热点情绪分析数据
export const fetchHotspotSentiment = (params?: {
    days?: number
    top_n?: number
}) => api.get('hotspot_sentiment', { params })
