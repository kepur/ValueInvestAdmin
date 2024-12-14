import api from './api'

// 小说 API
export const fetchNovels = () => api.get('/novels')
export const createNovel = (data: { name: string; description: string; author_id: number }) =>
  api.post('/novels', data)
export const updateNovel = (id: number, data: { name: string; description: string }) =>
  api.put(`/novels/${id}`, data)
export const deleteNovel = (id: number) => api.delete(`/novels/${id}`)

// 小说章节 API
export const fetchNovelChapters = () => api.get('/novel_chapters')
export const createNovelChapter = (data: { novel_id: number; title: string; content: string }) =>
  api.post('/novel_chapters', data)
export const updateNovelChapter = (id: number, data: { title: string; content: string }) =>
  api.put(`/novel_chapters/${id}`, data)
export const deleteNovelChapter = (id: number) => api.delete(`/novel_chapters/${id}`)

// 小说风格 API
export const fetchNovelStyles = () => api.get('/novel_styles')
export const createNovelStyle = (data: { name: string }) => api.post('/novel_styles', data)
export const deleteNovelStyle = (id: number) => api.delete(`/novel_styles/${id}`)
