import api from './api'

//****************************策略管理****************************
// 获取周期类型列表
export const fetchCycleTypes = () => {
    return api.get('cycle_types')
}

// 创建周期类型
export const createCycleType = (data: {
    name: string
    description?: string
    duration: number
    duration_unit?: string
}) => api.post('cycle_types', data)

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
    return api.get('strategies', { params })
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
}) => api.post('strategies', data)

// 修改策略
export const updateStrategy = (id: number, data: any) => api.put(`/strategies/${id}`, data)

// 删除策略
export const deleteStrategy = (id: number) => api.delete(`/strategies/${id}`)

//****************************策略模板（多周期矩阵）****************************
// 获取策略模板列表
export const fetchStrategyTemplates = (params?: {
    page?: number
    pageSize?: number
    search?: string
    active_only?: string
}) => api.get('strategy_templates', { params })

// 获取策略模板详情（含完整周期+规则）
export const fetchStrategyTemplateDetail = (id: number) => api.get(`strategy_templates/${id}`)

// 创建策略模板
export const createStrategyTemplate = (data: any) => api.post('strategy_templates', data)

// 更新策略模板
export const updateStrategyTemplate = (id: number, data: any) => api.put(`strategy_templates/${id}`, data)

// 删除策略模板
export const deleteStrategyTemplate = (id: number) => api.delete(`strategy_templates/${id}`)

// 校验策略模板参数
export const validateStrategyTemplate = (data: any) => api.post('strategy_templates/validate', data)

//****************************投资组合分析****************************
// 获取投资组合分析
export const fetchPortfolioAnalysis = (params?: {
    trade_type?: string
}) => {
    return api.get('portfolio_analysis', { params })
}

//****************************投资分配****************************
// 获取投资分配列表
export const fetchInvestmentAllocations = (params?: {
    page?: number
    pageSize?: number
}) => {
    return api.get('investment_allocations', { params })
}

// 创建投资分配
export const createInvestmentAllocation = (data: {
    total_investment: number
    trade_type_id: number
    total_return?: number
    diversification_score?: number
}) => api.post('investment_allocations', data)

// 修改投资分配
export const updateInvestmentAllocation = (id: number, data: any) =>
    api.put(`/investment_allocations/${id}`, data)

// 删除投资分配
export const deleteInvestmentAllocation = (id: number) =>
    api.delete(`/investment_allocations/${id}`)

//****************************投资计划****************************
// 获取投资计划
export const fetchInvestmentPlans = () => {
    return api.get('investment_plans')
}

// 创建投资计划
export const createInvestmentPlan = (data: {
    cycle_period: string
    start_date: string
    target_amount: number
    stages: any[]
}) => api.post('investment_plans', data)

// 删除投资计划
export const deleteInvestmentPlan = (id: number) => api.delete(`/investment_plans/${id}`)

//****************************交易窗口（时序分段）****************************
// 获取交易窗口列表
export const fetchTradeWindows = (params?: {
    page?: number
    pageSize?: number
    search?: string
    window_type?: string
    enabled_only?: string
}) => api.get('trade_windows', { params })

// 创建交易窗口
export const createTradeWindow = (data: any) => api.post('trade_windows', data)

// 获取交易窗口详情
export const fetchTradeWindowDetail = (id: number) => api.get(`trade_windows/${id}`)

// 更新交易窗口
export const updateTradeWindow = (id: number, data: any) => api.put(`trade_windows/${id}`, data)

// 删除交易窗口
export const deleteTradeWindow = (id: number) => api.delete(`trade_windows/${id}`)

// 冲突预检
export const checkTradeWindowConflict = (data: {
    time_start: string
    time_end: string
    weekdays?: number[]
    exclude_id?: number
}) => api.post('trade_windows/conflict_check', data)

// 获取当前活跃窗口
export const fetchActiveWindows = () => api.get('trade_windows/active')

// 获取路由决策
export const fetchRouteDecision = (mode?: string) =>
    api.get('trade_windows/route', { params: { mode } })

// 获取窗口策略绑定
export const fetchWindowBindings = (windowId: number) =>
    api.get(`trade_windows/${windowId}/bindings`)

// 绑定策略到窗口
export const bindTemplateToWindow = (windowId: number, data: {
    template_id: number
    priority_override?: number
}) => api.post(`trade_windows/${windowId}/bindings`, data)

// 解绑策略
export const unbindTemplateFromWindow = (windowId: number, templateId: number) =>
    api.delete(`trade_windows/${windowId}/bindings/${templateId}`)

//****************************自动交易配置****************************
// 获取自动交易配置列表
export const fetchAutoTradeConfigs = (params?: {
    page?: number
    pageSize?: number
    trade_type_id?: number
}) => api.get('auto_trade_configs', { params })

// 创建自动交易配置
export const createAutoTradeConfig = (data: any) => api.post('auto_trade_configs', data)

// 获取自动交易配置详情
export const fetchAutoTradeConfigDetail = (id: number) => api.get(`auto_trade_configs/${id}`)

// 更新自动交易配置
export const updateAutoTradeConfig = (id: number, data: any) => api.put(`auto_trade_configs/${id}`, data)

// 删除自动交易配置
export const deleteAutoTradeConfig = (id: number) => api.delete(`auto_trade_configs/${id}`)

// 启停自动交易配置
export const toggleAutoTradeConfig = (id: number, enabled: boolean) =>
    api.post(`auto_trade_configs/${id}/toggle`, { enabled })

// 恢复风控暂停
export const resumeAutoTradeConfig = (id: number) => api.post(`auto_trade_configs/${id}/resume`)

// 获取配置的策略绑定列表
export const fetchAutoTradeBindings = (configId: number) =>
    api.get(`auto_trade_configs/${configId}/bindings`)

// 添加策略绑定
export const addAutoTradeBinding = (configId: number, data: {
    template_id: number
    weight?: number
    enabled?: boolean
    priority?: number
}) => api.post(`auto_trade_configs/${configId}/bindings`, data)

// 更新策略绑定
export const updateAutoTradeBinding = (configId: number, bindingId: number, data: {
    weight?: number
    enabled?: boolean
    priority?: number
}) => api.put(`auto_trade_configs/${configId}/bindings/${bindingId}`, data)

// 删除策略绑定
export const deleteAutoTradeBinding = (configId: number, bindingId: number) =>
    api.delete(`auto_trade_configs/${configId}/bindings/${bindingId}`)

// 获取风控实时指标
export const fetchRiskStatus = (configId: number) =>
    api.get(`auto_trade_configs/${configId}/risk_status`)

// 获取熔断事件历史
export const fetchCircuitEvents = (configId: number, params?: {
    page?: number
    pageSize?: number
    event_type?: string
}) => api.get(`auto_trade_configs/${configId}/circuit_events`, { params })

//****************************回测****************************
// 获取所有币种
export const fetchAllCoins = () => api.get('coins_all')

// 运行策略回测
export const runBacktest = (data: {
    template_id: number
    coin_ids: number[]
    start_date: string
    end_date: string
    initial_capital?: number
    experiments?: Array<{
        name: string
        buy_level_multiplier?: number
        stop_loss_multiplier?: number
    }>
}) => api.post('backtests', data)
