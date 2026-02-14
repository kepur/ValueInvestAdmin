import api from './api'

//****************************评分管理****************************
// 获取投资价值评估列表
export const fetchInvestmentScores = (params?: {
    page?: number
    pageSize?: number
    coin_id?: number
}) => {
    return api.get('/investment_scores', { params })
}
