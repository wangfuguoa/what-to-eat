// 云端同步：把 store 的 data 同步到 CloudBase；本地始终优先可用（降级模式）
import { state, setVip, setAccount, clearAccount } from '@/store/food'
import { callApi, ensureLogin, getAuthToken, setAuthToken, clearAuthToken } from './cloudbase'

const CLOUD_SYNC_KEY = 'eatpick_cloud_last_sync'

let inflight = false
let initialized = false

function snapshot() {
  return {
    favorites: state.favorites || [],
    history: state.history || [],
    menu: state.menu || [],
    customFoods: state.custom || [],
    marks: state.marks || {},
    settings: state.settings || {}
  }
}

export async function initCloudSync(force = false) {
  if (initialized && !force) return
  initialized = true
  try {
    await ensureLogin()
    // 尝试从云端拉取并合并到本地（本地无数据时填充，不覆盖本地）
    const data = await callApi('getUserData')
    if (data) mergeFromCloud(data)
    // 再上报一次，确保云端有最新
    await saveToCloud()
  } catch (e) {
    console.warn('[sync] 初始化云端同步失败（本地模式继续）', e)
  }
}

// ---------- 账号登录 / 注册 / 登出 ----------

export async function loginAccount(username, password) {
  const data = await callApi('login', { username, password })
  if (!data || !data.token) throw new Error('登录失败')
  setAuthToken(data.token)
  setAccount({ loggedIn: true, username: data.username })
  await initCloudSync(true)
  return data
}

export async function registerAccount(username, password) {
  const data = await callApi('register', { username, password })
  if (!data || !data.token) throw new Error('注册失败')
  setAuthToken(data.token)
  setAccount({ loggedIn: true, username: data.username })
  await initCloudSync(true)
  return data
}

export async function logoutAccount() {
  const token = getAuthToken()
  try { if (token) await callApi('logout') } catch (e) { /* 远端登出失败不阻断 */ }
  clearAuthToken()
  clearAccount()
}

function mergeFromCloud(data) {
  // 服务端判定为匿名（账号 token 失效/登出），同步清除本地登录态
  if (data.ownerType === 'anon' && state.account.loggedIn) {
    clearAccount()
  }
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
  if (!state.menu || state.menu.length === 0) {
    if (Array.isArray(data.menu) && data.menu.length) state.menu = data.menu
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

