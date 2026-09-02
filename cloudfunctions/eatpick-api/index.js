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
  const wxContext = cloud.getWXContext() || {}
  const OPENID = wxContext.OPENID || ''
  const action = event.action

  try {
    switch (action) {
      case 'login-anon':
        return ok({ openid: OPENID })

      case 'register':
        return await register(event.username, event.password)

      case 'login':
        return await login(event.username, event.password)

      case 'logout':
        return await logout(event.authToken)

      case 'getUserData':
        return await getUserData(event, OPENID)

      case 'saveUserData':
        return await saveUserData(event, OPENID)

      case 'redeemVip':
        return await redeemVip(event, OPENID)

      default:
        return err('unknown action: ' + action)
    }
  } catch (e) {
    console.error('[eatpick-api]', action, e)
    return err(e.message || 'server error')
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
  return { key: openid || 'anon_unknown', account: null }
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
    vip: normalizeVip(doc.vip, now)
  } : {
    favorites: [], history: [], customFoods: [], marks: {}, vip: { status: 'none', expireAt: 0, plan: null }
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
  if (data.marks && typeof data.marks === 'object') payload.marks = data.marks
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
      favorites: [], history: [], customFoods: [], marks: {},
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
