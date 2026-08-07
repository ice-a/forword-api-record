// 前端 API 调用层（Nuxt 中直接用 $fetch，相对路径 /api 指向 Nitro 路由）
const API_BASE = '/api'

function getToken() {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem('admin_pwd') || ''
}

export function fetchStations() {
  return $fetch(`${API_BASE}/stations`)
}

export function verifyPassword(password: string) {
  return $fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    body: { password }
  })
}

export function createStation(data: any) {
  return $fetch(`${API_BASE}/stations`, {
    method: 'POST',
    headers: { 'x-admin-password': getToken() },
    body: data
  })
}

export function updateStation(id: string, data: any) {
  return $fetch(`${API_BASE}/stations/${id}`, {
    method: 'PUT',
    headers: { 'x-admin-password': getToken() },
    body: data
  })
}

export function deleteStation(id: string) {
  return $fetch(`${API_BASE}/stations/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-password': getToken() }
  })
}

export function generateImage(data: any) {
  return $fetch(`${API_BASE}/image/generate`, {
    method: 'POST',
    headers: { 'x-admin-password': getToken() },
    body: data
  })
}

export function refreshModels(id: string) {
  return $fetch(`${API_BASE}/stations/${id}/refresh-models`, {
    method: 'POST',
    headers: { 'x-admin-password': getToken() }
  })
}

// 表单内即时探测模型（无需先保存站点）
export function probeModels(data: { baseURL: string; apiKey?: string; id?: string }) {
  return $fetch<{ models: string[] }>(`${API_BASE}/stations/probe-models`, {
    method: 'POST',
    headers: { 'x-admin-password': getToken() },
    body: data
  })
}

export function healthCheck(id: string) {
  return $fetch(`${API_BASE}/stations/${id}/health`, { method: 'POST' })
}

// 公开：根据探活结果更新状态（active / inactive），访客也可用
export function setStatus(id: string, status: 'active' | 'inactive') {
  return $fetch(`${API_BASE}/stations/${id}/status`, {
    method: 'POST',
    body: { status }
  })
}

export function exportData() {
  return $fetch(`${API_BASE}/export`, {
    headers: { 'x-admin-password': getToken() }
  })
}

export function importData(list: any[]) {
  return $fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: { 'x-admin-password': getToken() },
    body: list
  })
}
