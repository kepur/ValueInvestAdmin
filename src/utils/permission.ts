import api from './api'

// 权限列表 API
// Fetch all permissions
export const fetchAllPermissions = () => {
  return api.get('permissions')
}
//创建权限 API
export const createPermission = (data: 
  {  
    name: string; 
    description: string;
}) =>api.post('permissions', data)
//删除权限 API
export const deletePermission = (id: number) => api.delete(`/permissions/${id}`)

// 更新权限 API
export const updatePermission = (id: number, 
  data: { 
    name: string;
    description: string 
  }) =>api.put(`/permissions/${id}`, data)