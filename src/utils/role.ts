import api from './api'

// Fetch all roles
export const fetchRoles = () => {
  return api.get('roles')
}

// Create a new role
export const createRole = (data: { name: string; description: string; permissions: string[] }) => {
  return api.post('roles', data)
}

// Update an existing role
export const updateRole = (id: number, data: any) => {
  return api.put(`roles/${id}`, data)
}

// Delete a role
export const deleteRole = (id: number) => {
  return api.delete(`roles/${id}`)
}

// Fetch all permissions
export const fetchAllPermissions = () => {
  return api.get('permissions')
}
