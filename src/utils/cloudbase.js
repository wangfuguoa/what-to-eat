// CloudBase 统一封装：匿名登录 + 调用云函数
import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'codex-d2glhcz9z707d54bb'

// HTTP 网关：把云函数 eatpick-api 暴露成普通 HTTPS 接口
// 好处：不依赖「身份认证 / Web 安全域名」白名单，未备案也能跑
const HTTP_API = 'https://codex-d2glhcz9z707d54bb-1427137188.ap-shanghai.app.tcloudbase.com/api'

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

// 设备匿名 ID：HTTP 网关拿不到微信 openid，用它区分每个未登录用户的数据
const ANON_ID_KEY = 'eatpick_anon_id'
function getAnonId() {
  try {
    let id = uni.getStorageSync(ANON_ID_KEY)
    if (!id) {
      id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
      uni.setStorageSync(ANON_ID_KEY, id)
    }
    return String(id)
  } catch (e) { return '' }
}

function getApp() {
  if (!app) {
    app = cloudbase.init({ env: ENV_ID })
  }
  return app
}

// 是否使用 HTTP 网关通道
// H5 / App：直连 HTTP 接口（当前唯一可用通道，免登录、免白名单）
// 微信小程序：仍走 SDK（小程序的网络请求需要配置 request 合法域名，后续上线时再统一）
function useHttpTransport() {
  // #ifdef MP-WEIXIN
  return false
  // #endif
  // #ifndef MP-WEIXIN
  return true
  // #endif
  return false
}

// 通过 HTTP 网关调用（uni.request 在 H5 / App / 小程序通用）
function httpCall(payload) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: HTTP_API,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: payload,
      timeout: 20000,
      success: (res) => {
        let body = res && res.data
        if (typeof body === 'string') {
          try { body = JSON.parse(body) } catch (e) { body = null }
        }
        if (!body || typeof body !== 'object') {
          const e = new Error('接口返回异常(' + ((res && res.statusCode) || '?') + ')')
          e.transport = true
          return reject(e)
        }
        if (body.ok === false) {
          const e = new Error(body.msg || '请求失败')
          e.biz = true
          e.code = body.code
          return reject(e)
        }
        resolve(body.data)
      },
      fail: (err) => {
        const e = new Error((err && err.errMsg) || '网络请求失败')
        e.transport = true
        reject(e)
      }
    })
  })
}

export async function ensureLogin() {
  if (useHttpTransport()) return null
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
  const authToken = getAuthToken()
  const anonId = getAnonId()
  const payload = Object.assign(
    { action },
    data,
    authToken ? { authToken } : {},
    anonId ? { anonId } : {}
  )

  if (useHttpTransport()) {
    try {
      return await httpCall(payload)
    } catch (e) {
      // 业务错误（账号密码错、兑换码无效等）直接抛出，不重复请求
      if (e && e.biz) throw e
      console.warn('[cloudbase] HTTP 接口不可用，回退 SDK', action, e && e.message)
    }
  }

  const _app = await ensureLogin()
  try {
    const res = await _app.callFunction({
      name: 'eatpick-api',
      data: payload
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
