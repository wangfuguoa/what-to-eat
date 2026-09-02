// CloudBase 统一封装：匿名登录 + 调用云函数
import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'codex-d2glhcz9z707d54bb'

let app = null
let authed = false
const AUTH_TOKEN_KEY = 'eatpick_auth_token'

export function getAuthToken() {
  try { return uni.getStorageSync(AUTH_TOKEN_KEY) || '' } catch (e) { return '' }
}

export function setAuthToken(token) {
  try { uni.setStorageSync(AUTH_TOKEN_KEY, token || '') } catch (e) { /* ignore */ }
}

export function clearAuthToken() {
  setAuthToken('')
}

function getApp() {
  if (!app) {
    app = cloudbase.init({ env: ENV_ID })
  }
  return app
}

export async function ensureLogin() {
  if (authed) return getApp()
  const _app = getApp()
  try {
    // 先尝试获取当前登录态
    const auth = _app.auth()
    const state = await auth.getLoginState()
    if (state) {
      authed = true
      return _app
    }
    // 匿名登录
    await auth.anonymousAuthProvider().signIn()
    authed = true
    return _app
  } catch (e) {
    console.warn('[cloudbase] 登录失败，将使用本地模式', e)
    return _app
  }
}

export async function callApi(action, data = {}) {
  const _app = await ensureLogin()
  const authToken = getAuthToken()
  try {
    const res = await _app.callFunction({
      name: 'eatpick-api',
      data: Object.assign({ action }, data, authToken ? { authToken } : {})
    })
    const result = res && res.result
    if (result && result.ok === false) {
      throw new Error(result.msg || '请求失败')
    }
    return result ? result.data : null
  } catch (e) {
    console.warn('[cloudbase] callFunction 失败', action, e)
    throw e
  }
}
