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
  vipcodes: 'vipcodes'   // 兑换码：code, plan, used, usedBy
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

      case 'getUserData':
        return await getUserData(OPENID)

      case 'saveUserData':
        return await saveUserData(OPENID, event.data || {})

      case 'redeemVip':
        return await redeemVip(OPENID, event.code)

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

async function getUserData(openid) {
  await ensureCollections()
  const users = db.collection(COLLECTIONS.users)
  let doc = null
  try {
    const res = await users.where({ _openid: openid }).get()
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
  return ok(data)
}

async function saveUserData(openid, data) {
  await ensureCollections()
  const users = db.collection(COLLECTIONS.users)
  const payload = {}
  if (Array.isArray(data.favorites)) payload.favorites = data.favorites
  if (Array.isArray(data.history)) payload.history = data.history
  if (Array.isArray(data.customFoods)) payload.customFoods = data.customFoods
  if (data.marks && typeof data.marks === 'object') payload.marks = data.marks
  payload.updatedAt = db.serverDate()

  const existing = await users.where({ _openid: openid }).get()
  if (existing.data && existing.data[0]) {
    await users.doc(existing.data[0]._id).update(payload)
    return ok({ updated: true })
  }
  await users.add(Object.assign({ _openid: openid, createdAt: db.serverDate() }, payload))
  return ok({ updated: false })
}

async function redeemVip(openid, code) {
  await ensureCollections()
  if (!code || typeof code !== 'string') return err('兑换码不能为空', 400)

  const codes = db.collection(COLLECTIONS.vipcodes)
  const res = await codes.where({ code: code.trim(), used: false }).get()
  const target = res.data && res.data[0]
  if (!target) return err('兑换码无效或已使用', 404)

  const plan = target.plan || 'month'
  const days = plan === 'year' ? 365 : plan === 'week' ? 7 : 30
  const now = Date.now()

  await codes.doc(target._id).update({ used: true, usedBy: openid, usedAt: db.serverDate() })

  const users = db.collection(COLLECTIONS.users)
  const existing = await users.where({ _openid: openid }).get()
  if (existing.data && existing.data[0]) {
    const cur = existing.data[0].vip || {}
    const base = (cur.expireAt && cur.expireAt > now) ? cur.expireAt : now
    await users.doc(existing.data[0]._id).update({
      vip: { status: 'active', plan, expireAt: base + days * 86400000 },
      updatedAt: db.serverDate()
    })
  } else {
    await users.add({
      _openid: openid,
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
