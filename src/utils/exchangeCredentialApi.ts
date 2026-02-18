/**
 * T-0533 交易所凭证 API（新增/验证/启停/掩码显示）
 */
import api from './api'

export interface ExchangeCredentialItem {
  id: number
  exchange: string
  user_id: number | null
  name: string | null
  environment: string
  enabled: boolean
  permission_snapshot: Record<string, unknown> | null
  created_at: string | null
  api_key_encrypted?: string
  api_secret_encrypted?: string
}

export const fetchExchangeCredentials = () =>
  api.get<{ data: ExchangeCredentialItem[] }>('exchange_credentials')

export const createExchangeCredential = (data: {
  exchange: string
  name?: string
  environment?: string
  api_key: string
  api_secret?: string
  validate?: boolean
}) => api.post('exchange_credentials', data)

export const updateExchangeCredential = (id: number, data: {
  name?: string
  enabled?: boolean
  environment?: string
  api_key?: string
  api_secret?: string
}) => api.put(`exchange_credentials/${id}`, data)

export const deleteExchangeCredential = (id: number) =>
  api.delete(`exchange_credentials/${id}`)

export const verifyExchangeCredential = (id: number) =>
  api.post<{ valid: boolean; error?: string; permission_snapshot?: Record<string, unknown> }>(`exchange_credentials/${id}/verify`)
