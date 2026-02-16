import api from './api'
export const fetchAuditLogs=()=>{
    return api.get('auditlogs')
}

export const fetchSystemProcessStatus = () => {
    return api.get('system/process')
}

export const fetchNotificationSettings = () => {
    return api.get('notification_settings')
}

export const saveNotificationSettings = (settings: Array<{
    type: string
    channel: string
    enabled: boolean
}>) => {
    return api.put('notification_settings', { settings })
}

// 发送定向通知
export const sendNotification = (data: {
    user_id?: number
    notification_type?: string
    title: string
    body: string
    html_body?: string
    tg_text?: string
}) => {
    return api.post('notify', data)
}

// 广播到 Telegram 群组
export const broadcastNotification = (data: {
    title: string
    body: string
    tg_text?: string
}) => {
    return api.post('notify/broadcast', data)
}

// 测试通知渠道
export const testNotification = (data: {
    channel: string
    target?: string
}) => {
    return api.post('notify/test', data)
}
