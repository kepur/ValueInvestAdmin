import api from './api'

//****************************实时价格****************************
// 获取实时价格
export const fetchRealTimePrice = (params?: {
  symbols?: string
  vs_currency?: string
}) => {
  return api.get('realtime_price', { params })
}

// 同步实时价格到数据库
export const syncRealTimePrice = (data?: {
  coin_ids?: number[]
}) => {
  return api.post('realtime_price_sync', data)
}

//****************************市场价格数据****************************
// 获取当前市场价格
export const fetchCurrentMarketPrice = (params?: {
  coin_id?: number
}) => {
  return api.get('current_market_price', { params })
}

// 获取历史市场价格
export const fetchHistoricalMarketPrice = (params: {
  coin_id: number
  page?: number
  page_size?: number
  interval?: string
  sort?: string
}) => {
  return api.get('historical_market_price', { params })
}

// 获取所有市场数据
export const fetchAllMarketData = (params: {
  coin_id: number
  interval?: string
  sort?: string
}) => {
  return api.get('all_market_data', { params })
}

//****************************K线数据****************************
// 获取K线蜡烛图数据
export const fetchKlineData = (params: {
  coin_id?: number
  symbol?: string
  interval?: string
  limit?: number
  start_time?: string
  end_time?: string
  sort?: string
}) => {
  return api.get('kline_data', { params })
}
