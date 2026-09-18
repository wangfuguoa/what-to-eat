const crypto = require('crypto')
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 腾讯云 CloudBase 服务端 SDK：数据库操作与控制台/CLI 同一库
const tcb = require('@cloudbase/node-sdk')
const tcbApp = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })
const db = tcbApp.database()
const _ = db.command

// 数据集合
const COLLECTIONS = {
  users: 'users',        // 用户文档：_openid, favorites[], history[], customFoods[], marks{}, vip{status,expireAt,plan}
  vipcodes: 'vipcodes',  // 兑换码：code, plan, used, usedBy
  accounts: 'accounts'   // 账号：username, salt, passwordHash, token, createdAt, updatedAt
}

// 提前创建集合（幂等，集合已存在则忽略）
async function ensureCollections() {
  for (const name of Object.values(COLLECTIONS)) {
    try { await db.createCollection(name) } catch (e) { /* 已存在则忽略 */ }
  }
}

exports.main = async (event = {}) => {
  // 兼容两种调用来源：CloudBase SDK 调用（直接带 event.action）与 HTTP 网关调用（event.body 里带 JSON）
  const isHttp = !(event && typeof event.action === 'string') &&
    !!(event && (typeof event.body === 'string' || typeof event.httpMethod === 'string' || typeof event.path === 'string' || event.requestContext))

  let payload = event
  if (isHttp) {
    const method = String(event.httpMethod || 'POST').toUpperCase()
    if (method === 'OPTIONS') return httpResponse(204, {})
    const query = event.queryStringParameters || {}
    if (event.body && typeof event.body === 'object') {
      payload = event.body
    } else {
      try { payload = event.body ? JSON.parse(event.body) : {} } catch (e) { payload = {} }
    }
    if (!payload || typeof payload !== 'object') payload = {}
    if (!payload.action && query.action) payload = Object.assign({}, query, payload)
  }

  let OPENID = ''
  try { OPENID = (cloud.getWXContext() || {}).OPENID || '' } catch (e) { OPENID = '' }
  const action = payload.action

  let result
  try {
    switch (action) {
      case 'login-anon':
        result = ok({ openid: OPENID }); break
      case 'register':
        result = await register(payload.username, payload.password); break
      case 'login':
        result = await login(payload.username, payload.password); break
      case 'logout':
        result = await logout(payload.authToken); break
      case 'getUserData':
        result = await getUserData(payload, OPENID); break
      case 'saveUserData':
        result = await saveUserData(payload, OPENID); break
      case 'redeemVip':
        result = await redeemVip(payload, OPENID); break
      default:
        result = err('unknown action: ' + action)
    }
  } catch (e) {
    console.error('[eatpick-api]', action, e)
    result = err(e.message || 'server error')
  }
  return isHttp ? httpResponse(200, result) : result
}

// HTTP 网关响应：带 CORS 头，便于任意域名下的网页直接调用
function httpResponse(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify(obj)
  }
}

function ok(data) { return { ok: true, data } }
function err(msg, code = 500) { return { ok: false, code, msg } }

// ---------- 账号：注册 / 登录 / 登出 ----------

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha512').toString('hex')
}

async function register(username, password) {
  await ensureCollections()
  username = String(username || '').trim()
  if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{2,20}$/.test(username)) {
    return err('用户名需为2-20位中英文、数字或下划线', 400)
  }
  if (!String(password || '').length || String(password).length < 6) {
    return err('密码至少6位', 400)
  }

  const accounts = db.collection(COLLECTIONS.accounts)
  const dup = await accounts.where({ username }).get()
  if (dup.data && dup.data[0]) return err('用户名已存在', 409)

  const salt = crypto.randomBytes(16).toString('hex')
  const passwordHash = hashPassword(password, salt)
  const token = crypto.randomBytes(24).toString('hex')
  const res = await accounts.add({
    username, salt, passwordHash, token,
    createdAt: db.serverDate(), updatedAt: db.serverDate()
  })
  return ok({ _id: res.id, username, token })
}

async function login(username, password) {
  await ensureCollections()
  username = String(username || '').trim()
  if (!username || !String(password || '').length) return err('请输入用户名和密码', 400)

  const accounts = db.collection(COLLECTIONS.accounts)
  const res = await accounts.where({ username }).get()
  const acc = res.data && res.data[0]
  if (!acc) return err('账号不存在', 404)
  if (hashPassword(password, acc.salt) !== acc.passwordHash) return err('用户名或密码错误', 401)

  const token = crypto.randomBytes(24).toString('hex')
  await accounts.doc(acc._id).update({ token, updatedAt: db.serverDate() })
  return ok({ _id: acc._id, username: acc.username, token })
}

async function logout(authToken) {
  if (!authToken) return ok({ loggedOut: false })
  await ensureCollections()
  const accounts = db.collection(COLLECTIONS.accounts)
  const res = await accounts.where({ token: authToken }).get()
  if (res.data && res.data[0]) {
    await accounts.doc(res.data[0]._id).update({ token: '', updatedAt: db.serverDate() })
  }
  return ok({ loggedOut: true })
}

async function resolveOwner(event, openid) {
  const token = event.authToken
  if (token) {
    await ensureCollections()
    const accounts = db.collection(COLLECTIONS.accounts)
    const res = await accounts.where({ token }).get()
    if (res.data && res.data[0]) return { key: 'acct_' + res.data[0]._id, account: res.data[0] }
  }
  // 未登录：HTTP 网关调用拿不到微信 openid，用前端生成的设备匿名 ID 区分，避免多人共用一份数据
  if (openid) return { key: openid, account: null }
  const anonId = String(event.anonId || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48)
  return { key: anonId ? 'anon_' + anonId : 'anon_unknown', account: null }
}

// ---------- 用户数据 / VIP ----------

async function getUserData(event, openid) {
  await ensureCollections()
  const owner = await resolveOwner(event, openid)
  const users = db.collection(COLLECTIONS.users)
  const key = owner.key
  let doc = null
  try {
    const res = await users.where({ _openid: key }).get()
    doc = res.data && res.data[0]
  } catch (e) { /* collection missing -> return defaults */ }

  const now = Date.now()
  const data = doc ? {
    favorites: doc.favorites || [],
    history: doc.history || [],
    customFoods: doc.customFoods || [],
    marks: doc.marks || {},
    eatenCounts: doc.eatenCounts || {},
    inPool: doc.inPool || [],
    modeSkins: doc.modeSkins || {},
    vip: normalizeVip(doc.vip, now)
  } : {
    favorites: [], history: [], customFoods: [], marks: {}, eatenCounts: {}, inPool: [], modeSkins: {}, vip: { status: 'none', expireAt: 0, plan: null }
  }
  return ok(Object.assign(data, { ownerType: owner.account ? 'account' : 'anon' }))
}

async function saveUserData(event, openid) {
  await ensureCollections()
  const owner = await resolveOwner(event, openid)
  const users = db.collection(COLLECTIONS.users)
  const key = owner.key
  const payload = {}
  const data = event.data || {}
  if (Array.isArray(data.favorites)) payload.favorites = data.favorites
  if (Array.isArray(data.history)) payload.history = data.history
  if (Array.isArray(data.customFoods)) payload.customFoods = data.customFoods
  if (Array.isArray(data.inPool)) payload.inPool = data.inPool
  if (data.marks && typeof data.marks === 'object') payload.marks = data.marks
  if (data.eatenCounts && typeof data.eatenCounts === 'object') payload.eatenCounts = data.eatenCounts
  if (data.modeSkins && typeof data.modeSkins === 'object') payload.modeSkins = data.modeSkins
  payload.updatedAt = db.serverDate()

  const existing = await users.where({ _openid: key }).get()
  if (existing.data && existing.data[0]) {
    await users.doc(existing.data[0]._id).update(payload)
    return ok({ updated: true })
  }
  await users.add(Object.assign({ _openid: key, createdAt: db.serverDate() }, payload))
  return ok({ updated: false })
}

async function redeemVip(event, openid) {
  await ensureCollections()
  const code = event.code
  if (!code || typeof code !== 'string') return err('兑换码不能为空', 400)

  const owner = await resolveOwner(event, openid)
  const key = owner.key
  const codes = db.collection(COLLECTIONS.vipcodes)
  const res = await codes.where({ code: code.trim(), used: false }).get()
  const target = res.data && res.data[0]
  if (!target) return err('兑换码无效或已使用', 404)

  const plan = target.plan || 'month'
  const days = plan === 'year' ? 365 : plan === 'week' ? 7 : 30
  const now = Date.now()

  await codes.doc(target._id).update({ used: true, usedBy: key, usedAt: db.serverDate() })

  const users = db.collection(COLLECTIONS.users)
  const existing = await users.where({ _openid: key }).get()
  if (existing.data && existing.data[0]) {
    const cur = existing.data[0].vip || {}
    const base = (cur.expireAt && cur.expireAt > now) ? cur.expireAt : now
    await users.doc(existing.data[0]._id).update({
      vip: { status: 'active', plan, expireAt: base + days * 86400000 },
      updatedAt: db.serverDate()
    })
  } else {
    await users.add({
      _openid: key,
      favorites: [], history: [], customFoods: [], marks: {}, eatenCounts: {}, inPool: [], modeSkins: {},
      vip: { status: 'active', plan, expireAt: now + days * 86400000 },
      createdAt: db.serverDate()
    })
  }
  return ok({ vip: { status: 'active', plan, expireAt: now + days * 86400000 } })
}

function normalizeVip(vip, now) {
  if (!vip || vip.status !== 'active' || !vip.expireAt || vip.expireAt <= now) {
    return { status: 'none', expireAt: 0, plan: null }
  }
  return { status: 'active', plan: vip.plan || 'month', expireAt: vip.expireAt }
}
