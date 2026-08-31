// 云端同步：把 store 的 data 同步到 CloudBase；本地始终优先可用（降级模式）
import { state, setVip } from '@/store/food'
import { callApi, ensureLogin } from './cloudbase'

const CLOUD_SYNC_KEY = 'eatpick_cloud_last_sync'

let inflight = false
let initialized = false

function snapshot() {
  return {
    favorites: state.favorites || [],
    history: state.history || [],
    customFoods: state.custom || [],
    marks: state.marks || {},
    settings: state.settings || {}
  }
}

export async function initCloudSync() {
  if (initialized) return
  initialized = true
  try {
    await ensureLogin()
    // 尝试从云端拉取并合并到本地（云优先，本地无数据时填充）
    const data = await callApi('getUserData')
    if (data) mergeFromCloud(data)
    // 再上报一次，确保云端有最新
    await saveToCloud()
  } catch (e) {
    console.warn('[sync] 初始化云端同步失败（本地模式继续）', e)
  }
}

function mergeFromCloud(data) {
  // 仅当本地为空时用云端填充，避免覆盖用户刚改的数据
  if (!state.custom || state.custom.length === 0) {
    if (Array.isArray(data.customFoods) && data.customFoods.length) state.custom = data.customFoods
  }
  if (!state.marks || Object.keys(state.marks).length === 0) {
    if (data.marks && typeof data.marks === 'object') state.marks = data.marks
  }
  if (!state.favorites || state.favorites.length === 0) {
    if (Array.isArray(data.favorites) && data.favorites.length) state.favorites = data.favorites
  }
  if (!state.history || state.history.length === 0) {
    if (Array.isArray(data.history) && data.history.length) state.history = data.history
  }
  // VIP 以服务端为准
  if (data.vip && typeof data.vip === 'object') setVip(data.vip)
}

export async function saveToCloud() {
  if (inflight) return
  inflight = true
  try {
    const snap = snapshot()
    await callApi('saveUserData', { data: snap })
    try { uni.setStorageSync(CLOUD_SYNC_KEY, Date.now()) } catch (e) {}
  } catch (e) {
    console.warn('[sync] 保存到云端失败', e)
  } finally {
    inflight = false
  }
}

// 供页面在关键操作后调用（抽中、标记、增删、设置）
export function cloudSyncMarks() { saveToCloud() }

// 供页面在兑换/刷新后拉取最新 VIP 状态（服务端权威）
export async function refreshVip() {
  const data = await callApi('getUserData')
  if (data && data.vip && typeof data.vip === 'object') setVip(data.vip)
  return state.vip
}
