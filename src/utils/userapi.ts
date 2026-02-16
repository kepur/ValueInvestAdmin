import api from './api'
// Fetch all users
export const fetchUsers = () => {
  return api.get('users')
}

// Create a new user
export const createUser = (data: {
  username: string
  email: string
  password: string
  roles: string[]
}) => {
  return api.post('users', data)
}

// Update an existing user
export const updateUser = (id: number, data: any) => {
  return api.put(`users/${id}`, data)
}

// Delete a user
export const deleteUser = (id: number) => {
  return api.delete(`users/${id}`)
}

// 获取当前用户个人信息
export const fetchUserProfile = () => {
  return api.get('user/profile')
}

// 更新当前用户个人信息
export const updateUserProfile = (data: {
  email?: string
  phone?: string
  telegram_id?: string
  avatar?: string
  password?: string
}) => {
  return api.put('user/profile', data)
}

// Fetch all roles
export const fetchAllRoles = () => {
  return api.get('roles')
}

export const fetchUserCollects = () => {
  return api.get('user_collects')
}

export const deleteUserCollect = (id: number) => {
  return api.delete(`user_collects/${id}`)
}
