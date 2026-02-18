/**
 * 上线闸门状态 API (T-0525 / T-0526)
 * 后端实现后改为真实请求，当前支持降级为占位数据
 */
import api from './api'

export type GateStatus = 'pass' | 'warn' | 'fail'

export interface GateItem {
  id: string
  name: string
  nameEn: string
  status: GateStatus
  lastCheckedAt: string | null
  message?: string
  link?: string
  owner?: string
}

export interface GateStatusResponse {
  environment?: 'test' | 'prod'
  allowRelease: boolean
  gates: GateItem[]
  summary?: string
}

const GATE_IDS = [
  { id: 'security', name: '安全', nameEn: 'Security' },
  { id: 'reconciliation', name: '对账', nameEn: 'Reconciliation' },
  { id: 'alert', name: '告警', nameEn: 'Alert' },
  { id: 'shadow', name: '灰度', nameEn: 'Shadow' },
  { id: 'kill_switch', name: 'Kill Switch', nameEn: 'Kill Switch' },
]

function mockGates(): GateItem[] {
  return GATE_IDS.map((g, i) => ({
    ...g,
    status: i === 0 ? 'pass' : (i === 1 ? 'warn' : 'pass') as GateStatus,
    lastCheckedAt: new Date(Date.now() - (i + 1) * 60000).toISOString(),
    message: i === 1 ? '最近 24h 存在未确认对账项' : undefined,
    owner: 'ops',
  }))
}

/**
 * 获取上线闸门状态聚合（T-0525 后端已实现）
 * @param env test | prod，可选
 */
export async function fetchGateStatus(env?: 'test' | 'prod'): Promise<GateStatusResponse> {
  try {
    const res = await api.get<GateStatusResponse>('gates/status', {
      params: env ? { environment: env } : undefined,
    })
    if (res.data && Array.isArray((res.data as GateStatusResponse).gates)) {
      return res.data as GateStatusResponse
    }
  } catch (_) {
    // 降级占位数据
  }
  const gates = mockGates()
  const allowRelease = gates.every((g) => g.status !== 'fail')
  return {
    environment: env || 'test',
    allowRelease,
    gates,
    summary: allowRelease ? '所有闸门通过或警告，可执行发布前检查' : '存在未通过闸门，建议修复后再发布',
  }
}

/** T-0524 系统配置（Kill Switch / Shadow Mode） */
export async function fetchSystemConfig(): Promise<{ global_kill_switch?: string; shadow_mode?: string }> {
  const res = await api.get<{ global_kill_switch?: string; shadow_mode?: string }>('system_config')
  return res.data || {}
}

export async function updateSystemConfig(payload: { global_kill_switch?: boolean; shadow_mode?: boolean }) {
  await api.put('system_config', payload)
}
