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

export const fetchUserLikes = () => {
  return api.get('user_likes')
}

export const deleteUserLike = (id: number) => {
  return api.delete(`user_likes/${id}`)
}

export const fetchUserPoints = () => {
  return api.get('user_points')
}

export const createUserPoint = (data: { user_id: number; points: number; reason: string }) => {
  return api.post('user_points', data)
}

export const deleteUserPoint = (id: number) => {
  return api.delete(`user_points/${id}`)
}
