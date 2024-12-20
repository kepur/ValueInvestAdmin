import api from './api'
export const fetchAuditLogs=()=>{
    return api.get('auditlogs')
}