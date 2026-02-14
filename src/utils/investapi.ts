import api from './api'

//****************************策略管理****************************
// 获取周期类型列表
export const fetchCycleTypes = () => {
    return api.get('/cycle_types')
}

// 创建周期类型
export const createCycleType = (data: {
    name: string
    description?: string
    duration: number
    duration_unit?: string
}) => api.post('/cycle_types', data)

// 修改周期类型
export const updateCycleType = (id: number, data: {
    name?: string
    description?: string
    duration?: number
    duration_unit?: string
}) => api.put(`/cycle_types/${id}`, data)

// 删除周期类型
export const deleteCycleType = (id: number) => api.delete(`/cycle_types/${id}`)

//****************************投资策略****************************
// 获取策略列表
export const fetchStrategies = (params?: {
    page?: number
    pageSize?: number
    search?: string
}) => {
    return api.get('/strategies', { params })
}

// 创建策略
export const createStrategy = (data: {
    name: string
    cycle_type_id: number
    coin_type_id: number
    buy_levels?: number[]
    stop_loss?: number
    wait_zone?: string
    rebound_targets?: number[]
    volatility_coefficient?: number
    priority?: number
    action?: string
    conditions?: any
    is_global?: boolean
}) => api.post('/strategies', data)

// 修改策略
export const updateStrategy = (id: number, data: any) => api.put(`/strategies/${id}`, data)

// 删除策略
export const deleteStrategy = (id: number) => api.delete(`/strategies/${id}`)

//****************************投资组合分析****************************
// 获取投资组合分析
export const fetchPortfolioAnalysis = (params?: {
    trade_type?: string
}) => {
    return api.get('/portfolio_analysis', { params })
}

//****************************投资分配****************************
// 获取投资分配列表
export const fetchInvestmentAllocations = (params?: {
    page?: number
    pageSize?: number
}) => {
    return api.get('/investment_allocations', { params })
}

// 创建投资分配
export const createInvestmentAllocation = (data: {
    total_investment: number
    trade_type_id: number
    total_return?: number
    diversification_score?: number
}) => api.post('/investment_allocations', data)

// 修改投资分配
export const updateInvestmentAllocation = (id: number, data: any) =>
    api.put(`/investment_allocations/${id}`, data)

// 删除投资分配
export const deleteInvestmentAllocation = (id: number) =>
    api.delete(`/investment_allocations/${id}`)

//****************************投资计划****************************
// 获取投资计划
export const fetchInvestmentPlans = () => {
    return api.get('/investment_plans')
}

// 创建投资计划
export const createInvestmentPlan = (data: {
    cycle_period: string
    start_date: string
    target_amount: number
    stages: any[]
}) => api.post('/investment_plans', data)

// 删除投资计划
export const deleteInvestmentPlan = (id: number) => api.delete(`/investment_plans/${id}`)
