import { reactive, computed } from 'vue'
import { BUILTIN_FOODS, EXTRA_FOODS, FOOD_META, NUTRITION_META } from '@/data/foods'

export const STAPLES = ['米饭', '面条', '馒头', '包子', '饺子', '饼', '粥', '粉', '无']
export const TASTES = ['酸', '甜', '苦', '辣', '咸', '鲜', '香', '麻', '清淡']
export const HOW_OPTIONS = ['点外卖', '出去吃', '自己做']
export const HOW_TAGS = { '点外卖': '外卖', '出去吃': '外出', '自己做': '自己做' }
export const PURPOSE_OPTIONS = ['减肥', '增肌', '平衡', '术后', '高蛋白', '低卡']
export const CUISINE_OPTIONS = ['川菜', '鲁菜', '粤菜', '苏菜', '闽菜', '浙菜', '湘菜', '徽菜', '家常', '其他']
export const CATEGORY_OPTIONS = ['肉菜', '素菜', '主食', '汤羹', '小吃', '甜品']
export const RECOMMEND_MODES = [
  { key: 'wheel', label: '转盘', icon: '🎡' },
  { key: 'draw', label: '抽签', icon: '🥢' },
  { key: 'flip', label: '翻牌', icon: '🎴' },
  { key: 'dice', label: '掷骰', icon: '🎲', vipOnly: true },
  { key: 'capsule', label: '转蛋', icon: '🎁', vipOnly: true },
  { key: 'dart', label: '飞镖', icon: '🎯', vipOnly: true }
]
export const WHEEL_COLORS = ['#ff6b6b', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#ff9f43', '#f368e0', '#00d2d3', '#ee5253', '#10ac84', '#48dbfb', '#ffd32a']

// 主页玩法皮肤：每种玩法多套可切换样式
export const MODE_SKINS = {
  wheel: [
    { key: 'classic', label: '经典', colors: ['#ff6b6b', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#ff9f43', '#f368e0', '#00d2d3', '#ee5253', '#10ac84', '#48dbfb', '#ffd32a'] },
    { key: 'neon', label: '霓虹', colors: ['#8ec5fc', '#e0c3fc', '#fbc2eb', '#a1c4fd', '#c2e9fb', '#d4fc79', '#96e6a1', '#fddb92', '#f7a7c4', '#c2e9fb', '#a1c4fd', '#8ec5fc'] },
    { key: 'forest', label: '森林', colors: ['#2f4858', '#33658a', '#86bbd8', '#f6ae2d', '#f26419', '#4f6d7a', '#6d9f71', '#c8d5b9', '#a89968', '#8cb369', '#5b8e7d', '#bc4b51'] },
    { key: 'gold', label: '鎏金', vipOnly: true, colors: ['#0f172a', '#b8860b', '#d4af37', '#ffd700', '#8a5a00', '#3b2f2f', '#e0b64f', '#1e1e2f', '#c9a227', '#6b4423', '#f5d76e', '#2c1e05'] }
  ],
  draw: [
    { key: 'classic', label: '竹签', bg: '#f6d9a0', ink: '#4a2f1b' },
    { key: 'neon', label: '霓虹', bg: '#2c3e50', ink: '#f8f9fa' },
    { key: 'pink', label: '桃花', bg: '#ffe3ec', ink: '#a83a5b' },
    { key: 'jade', label: '翡翠', vipOnly: true, bg: '#e8f5e9', ink: '#0f5132' }
  ],
  flip: [
    { key: 'classic', label: '经典', backBg: '#2d2a26', backFg: '#fff' },
    { key: 'neon', label: '霓虹', backBg: '#1b2a4a', backFg: '#ffd766' },
    { key: 'pink', label: '桃花', backBg: '#ff9db8', backFg: '#7a1f3d' },
    { key: 'moon', label: '月光', vipOnly: true, backBg: '#1a1a2e', backFg: '#f5d76e' }
  ],
  dice: [
    { key: 'classic', label: '白骰', bg: '#fff', fg: '#333' },
    { key: 'neon', label: '霓虹', bg: '#1b2a4a', fg: '#ffd766' },
    { key: 'lucky', label: '鸿运', bg: '#c0392b', fg: '#ffd700' },
    { key: 'crystal', label: '水晶', vipOnly: true, bg: '#5b2a86', fg: '#e0c3fc' }
  ],
  capsule: [
    { key: 'classic', label: '粉蛋', bg: '#ff8fb1', ball: '#ffd54f' },
    { key: 'neon', label: '蓝蛋', bg: '#4a6cf7', ball: '#7bd3ff' },
    { key: 'mint', label: '薄荷', bg: '#10ac84', ball: '#feca57' },
    { key: 'gold', label: '鎏金', vipOnly: true, bg: '#b8860b', ball: '#fff8dc' }
  ],
  dart: [
    { key: 'classic', label: '红黑', bg: '#c0392b', ring: '#f1c40f' },
    { key: 'neon', label: '蓝紫', bg: '#2c3e50', ring: '#8e44ad' },
    { key: 'lucky', label: '鸿运', bg: '#7a4a00', ring: '#ffd700' },
    { key: 'rose', label: '玫瑰', vipOnly: true, bg: '#880e4f', ring: '#f48fb1' }
  ]
}

const MS = { 天: 86400000, 周: 7 * 86400000, 月: 30 * 86400000 }
const LS = {
  custom: 'eatpick_custom_foods',
  hidden: 'eatpick_hidden_ids',
  marks: 'eatpick_marks',
  settings: 'eatpick_settings',
  favorites: 'eatpick_favorites',
  history: 'eatpick_history',
  vip: 'eatpick_vip',
  how: 'eatpick_how',
  purpose: 'eatpick_purpose',
  cuisine: 'eatpick_cuisine',
    poolLimit: 'eatpick_pool_limit',
    menu: 'eatpick_menu',
    recMode: 'eatpick_rec_mode',
    theme: 'eatpick_theme',
    account: 'eatpick_account',
    eatenCounts: 'eatpick_eaten_counts',
    inPool: 'eatpick_in_pool',
    modeSkins: 'eatpick_mode_skins'
  }

function load(key, fallback) {
  try {
    const raw = uni.getStorageSync(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}

function save(key, val) {
  try {
    uni.setStorageSync(key, JSON.stringify(val))
  } catch (e) { /* ignore */ }
}

export const state = reactive({
  custom: [],
  hidden: [],
  marks: {},
    favorites: [],
    history: [],
    vip: null,
    account: { loggedIn: false, username: '' },
    eatenCounts: {},
    inPool: [],
    modeSkins: {},
    settings: { memoryValue: 3, memoryUnit: '天', includeMarked: false, showWelcomePopup: true, showCalories: true, welcomeCycle: 'daily', popupChips: { fortune: true, pairing: false, tips: false }, homeModes: ['wheel', 'draw', 'flip'] },
    dailyRecords: [],
  howToEat: '点外卖',
  selPurpose: [],
  selCuisine: [],
  selStaples: [],
  selTastes: [],
  poolLimit: 30,
  theme: 'orange',
  menu: [],
  recommendMode: 'wheel',
  recommendResult: null,
  recommendSpinning: false,
  spinning: false,
  wheelAngle: 0,
  wheelPool: [],
  dishPool: [],
  lastResultId: null
})

function mergeMeta(f) {
  const m = FOOD_META[f.id] || {}
  const n = NUTRITION_META[f.id] || {}
  const how = f.how || m.how || (f.recipe && f.recipe.length ? ['自己做'] : ['外卖', '外出'])
  const purpose = f.purpose || m.purpose || ['通用']
  const cuisine = f.cuisine || m.cuisine || '家常'
  const category = f.category || m.category || '小吃'
  return Object.assign({}, f, {
    how, purpose, cuisine, category,
    calories: f.calories || n.calories || 0,
    nutrition: f.nutrition || n.nutrition || ''
  })
}

function allFoods() {
  return BUILTIN_FOODS.concat(EXTRA_FOODS).concat(state.custom).map(mergeMeta)
}

function visibleFoods() {
  return allFoods().filter(f => state.hidden.indexOf(f.id) === -1)
}

function activeMarksMap() {
  const now = Date.now()
  const out = {}
  for (const id in state.marks) {
    const m = state.marks[id]
    if (m && m.expireAt && m.expireAt > now) out[id] = m
  }
  return out
}

function isMarked(id) {
  return !!activeMarksMap()[id]
}

function purgeExpired() {
  const now = Date.now()
  let changed = false
  for (const id in state.marks) {
    if (!state.marks[id].expireAt || state.marks[id].expireAt <= now) {
      delete state.marks[id]
      changed = true
    }
  }
  const ids = new Set(allFoods().map(f => f.id))
  for (const id in state.marks) {
    if (!ids.has(id)) {
      delete state.marks[id]
      changed = true
    }
  }
  if (changed) save(LS.marks, state.marks)
}

function expireFromNow(status) {
  const base = status === 'unwanted' ? state.settings.memoryValue : Math.max(1, state.settings.memoryValue)
  return Date.now() + base * (MS[state.settings.memoryUnit] || 86400000)
}

export const currentPool = computed(() => {
  const active = activeMarksMap()
  const howTag = HOW_TAGS[state.howToEat]
    return visibleFoods().filter(f => {
      if (!state.inPool.includes(f.id)) return false
      if (state.howToEat && howTag && f.how.indexOf(howTag) === -1) return false
    if (state.selPurpose.length) {
      const ok = state.selPurpose.some(p => f.purpose.includes(p) || f.purpose.includes('通用'))
      if (!ok) return false
    }
    if (state.selCuisine.length) {
      const ok = state.selCuisine.some(c => f.cuisine === c)
      if (!ok) return false
    }
    const okStaple = state.selStaples.length === 0 || f.staples.some(t => state.selStaples.includes(t))
    const okTaste = state.selTastes.length === 0 || f.tastes.some(t => state.selTastes.includes(t))
    if (!okStaple || !okTaste) return false
    if (!state.settings.includeMarked && active[f.id]) return false
    if (!dietAvoidPass(f)) return false
    return true
  })
})

const SEA_FOOD_RE = /(鱼|虾|蟹|贝|蛤|鱿|螺|蚝|鲍|龙虾|三文鱼|带鱼|鲈鱼)/
function dietAvoidPass(f) {
  const a = state.settings.dietAvoid || []
  if (a.includes('不吃辣') && f.tastes && f.tastes.includes('辣')) return false
  if (a.includes('素食') && f.category === '肉菜') return false
  if (a.includes('不吃海鲜') && f.name && SEA_FOOD_RE.test(f.name)) return false
  return true
}

function remainText(id) {
  const m = state.marks[id]
  if (!m) return '已到期'
  const msLeft = m.expireAt - Date.now()
  if (msLeft <= 0) return '已到期'
  const day = Math.ceil(msLeft / 86400000)
  return day >= 1 ? day + '天' : Math.ceil(msLeft / 3600000) + '小时'
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const t = a[i]; a[i] = a[j]; a[j] = t
  }
  return a
}

function persist() {
  save(LS.custom, state.custom)
  save(LS.hidden, state.hidden)
  save(LS.marks, state.marks)
  save(LS.settings, state.settings)
  save(LS.how, state.howToEat)
  save(LS.purpose, state.selPurpose)
  save(LS.cuisine, state.selCuisine)
  save(LS.poolLimit, state.poolLimit)
  save(LS.menu, state.menu)
  save(LS.recMode, state.recommendMode)
}

export function initStore() {
  state.custom = load(LS.custom, [])
  state.hidden = load(LS.hidden, [])
  state.marks = load(LS.marks, {})
  const s = load(LS.settings, {})
    const defaults = { memoryValue: 3, memoryUnit: '天', includeMarked: false, showWelcomePopup: true, showCalories: true, showNutrition: true, welcomeCycle: 'daily', popupChips: { fortune: true, pairing: false, tips: false }, homeModes: ['wheel', 'draw', 'flip'], nickname: '', avatar: '😊', city: '', dietAvoid: [], tastePref: [], dietGoal: '', notify: true }
  state.settings = Object.assign({}, defaults, s)
  delete state.settings.showFortune
  delete state.settings.welcomePopupClosed
  delete state.settings.vipPopupExtra
  state.settings.popupChips = Object.assign({}, defaults.popupChips, s.popupChips || {})
  // 仅当旧结构里还没有 popupChips 时，才用旧 showFortune 迁移，避免覆盖用户新值
  if (typeof s.showFortune === 'boolean' && !s.popupChips) state.settings.popupChips.fortune = s.showFortune
  state.settings.homeModes = validHomeModes(state.settings.homeModes)
  state.dailyRecords = load(LS.daily, [])
    state.favorites = load(LS.favorites, [])
    state.history = load(LS.history, [])
    state.eatenCounts = load(LS.eatenCounts, {})
    const defaultPool = BUILTIN_FOODS.map(f => f.id)
    state.inPool = load(LS.inPool, defaultPool)
    if (!Array.isArray(state.inPool) || !state.inPool.length) state.inPool = defaultPool.slice()
    state.modeSkins = load(LS.modeSkins, {})
    state.vip = load(LS.vip, null)
    state.account = load(LS.account, { loggedIn: false, username: '' })
    state.howToEat = load(LS.how, HOW_OPTIONS[0])
  state.selPurpose = load(LS.purpose, [])
  state.selCuisine = load(LS.cuisine, [])
  state.poolLimit = Math.max(1, Number(load(LS.poolLimit, 30)) || 30)
  state.menu = load(LS.menu, [])
  state.recommendMode = load(LS.recMode, 'wheel')
  purgeExpired()
  resetDishPool()
}

export function toggleFilter(type, label) {
  const arr = type === 'staple' ? state.selStaples : state.selTastes
  const idx = arr.indexOf(label)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(label)
  resetDishPool()
}

export function setHowToEat(v) {
  state.howToEat = v
  save(LS.how, v)
  resetDishPool()
}

export function togglePurpose(label) {
  const arr = state.selPurpose
  const idx = arr.indexOf(label)
  if (idx >= 0) arr.splice(idx, 1); else arr.push(label)
  save(LS.purpose, arr)
  resetDishPool()
}

export function toggleCuisine(label) {
  const arr = state.selCuisine
  const idx = arr.indexOf(label)
  if (idx >= 0) arr.splice(idx, 1); else arr.push(label)
  save(LS.cuisine, arr)
  resetDishPool()
}

export function setPoolLimit(n) {
  const v = Math.min(100, Math.max(3, parseInt(n, 10) || 30))
  state.poolLimit = v
  save(LS.poolLimit, v)
  resetDishPool()
  return v
}

export function setRecommendMode(mode) {
  state.recommendMode = mode
  state.recommendResult = null
  save(LS.recMode, mode)
}

export function samplePool() {
  const arr = shuffle(currentPool.value)
  const limit = Math.max(1, state.poolLimit)
  return arr.slice(0, Math.min(limit, arr.length))
}

export function resetDishPool() {
  state.dishPool = samplePool()
  state.recommendResult = null
  state.recommendSpinning = false
  return state.dishPool
}

export function recomposeDishPool() {
  // 重组：重新取样 + 打乱位置
  state.dishPool = samplePool()
  state.recommendResult = null
  state.recommendSpinning = false
  return state.dishPool
}

export function menuHas(id) {
  return state.menu.some(m => m.id === id)
}

export function addToMenu(food) {
  if (!food) return false
  if (menuHas(food.id)) return false
  state.menu.push({ id: food.id, name: food.name, how: food.how, recipe: food.recipe || [], note: food.note || '' })
  save(LS.menu, state.menu)
  return true
}

export function removeFromMenu(id) {
  state.menu = state.menu.filter(m => m.id !== id)
  save(LS.menu, state.menu)
}

export function spinModule(kind) {
  let v = null
  if (kind === 'how') {
    v = HOW_OPTIONS[Math.floor(Math.random() * HOW_OPTIONS.length)]
    setHowToEat(v)
    return v
  }
  if (kind === 'purpose') {
    v = PURPOSE_OPTIONS[Math.floor(Math.random() * PURPOSE_OPTIONS.length)]
    state.selPurpose = [v]
    save(LS.purpose, state.selPurpose)
    resetDishPool()
    return v
  }
  if (kind === 'cuisine') {
    v = CUISINE_OPTIONS[Math.floor(Math.random() * CUISINE_OPTIONS.length)]
    state.selCuisine = [v]
    save(LS.cuisine, state.selCuisine)
    resetDishPool()
    return v
  }
  if (kind === 'staple') {
    v = STAPLES[Math.floor(Math.random() * STAPLES.length)]
    state.selStaples = [v]
    resetDishPool()
    return v
  }
  if (kind === 'taste') {
    v = TASTES[Math.floor(Math.random() * TASTES.length)]
    state.selTastes = [v]
    resetDishPool()
    return v
  }
  return null
}

export function pickRecommend(pool) {
  const arr = pool || state.dishPool
  if (!arr.length) return null
  const prefs = state.settings.tastePref || []
  if (prefs.length) {
    const matched = arr.filter(f => f.tastes && f.tastes.some(t => prefs.includes(t)))
    if (matched.length && Math.random() < 0.7) {
      return matched[Math.floor(Math.random() * matched.length)]
    }
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

export function resultFromAngle(arr, angle) {
  if (!arr || !arr.length) return null
  const pointer = -Math.PI / 2
  const n = arr.length
  const slice = (Math.PI * 2) / n
  let delta = (pointer - angle) % (Math.PI * 2)
  if (delta < 0) delta += Math.PI * 2
  let idx = Math.floor(delta / slice)
  if (idx >= n) idx = n - 1
  return arr[idx]
}

export function markFood(id, status) {
  state.marks[id] = { status, expireAt: expireFromNow(status) }
  save(LS.marks, state.marks)
}

export function unmarkFood(id) {
  delete state.marks[id]
  save(LS.marks, state.marks)
}

export function clearMarks() {
  state.marks = {}
  save(LS.marks, state.marks)
}

export function isFavorite(id) {
  return state.favorites.indexOf(id) !== -1
}

export function toggleFavorite(id) {
  const idx = state.favorites.indexOf(id)
  if (idx >= 0) state.favorites.splice(idx, 1)
  else state.favorites.push(id)
  save(LS.favorites, state.favorites)
}

  export function addHistory(item) {
    if (!item) return
    const entry = { id: item.id, name: item.name, ts: Date.now() }
    const idx = state.history.findIndex(h => h.id === item.id)
    if (idx >= 0) state.history.splice(idx, 1)
    state.history.unshift(entry)
    if (state.history.length > 30) state.history.length = 30
    state.eatenCounts[item.id] = (state.eatenCounts[item.id] || 0) + 1
    save(LS.eatenCounts, state.eatenCounts)
    save(LS.history, state.history)
  }

  export function clearEatenCounts() {
    state.eatenCounts = {}
    save(LS.eatenCounts, state.eatenCounts)
  }

export function clearHistory() {
  state.history = []
  save(LS.history, state.history)
}

export function isVip() {
  const v = state.vip
  return !!(v && v.status === 'active' && v.expireAt && v.expireAt > Date.now())
}

  export function setVip(vip) {
    state.vip = vip || null
    save(LS.vip, state.vip)
  }

  export function setAccount(acc) {
    state.account = acc || { loggedIn: false, username: '' }
    save(LS.account, state.account)
  }

  export function clearAccount() {
    setAccount({ loggedIn: false, username: '' })
  }

export function saveSettings(settings) {
  state.settings = Object.assign({}, state.settings, settings)
  save(LS.settings, state.settings)
  purgeExpired()
}

const HOME_BASE = ['wheel', 'draw', 'flip']
export const VIP_POPUP_CHIPS = ['pairing', 'tips']
export function validHomeModes(list) {
  const keys = RECOMMEND_MODES.map(m => m.key)
  const out = []
  for (const k of (list || [])) if (keys.includes(k) && !out.includes(k)) out.push(k)
  for (const k of HOME_BASE) if (!out.includes(k)) out.push(k)
  while (out.length < 3) out.push(HOME_BASE[out.length % HOME_BASE.length])
  return out.slice(0, 3)
}
export function replaceHomeMode(oldKey, newKey) {
  if (oldKey === newKey) return
  const arr = state.settings.homeModes.slice()
  const i = arr.indexOf(oldKey)
  if (i < 0) return
  arr[i] = newKey
  state.settings.homeModes = validHomeModes(arr)
  saveSettings({})
}
export function setPopupChip(key, val) {
  state.settings.popupChips = Object.assign({}, state.settings.popupChips, { [key]: !!val })
  saveSettings({})
}

export function setProfile(p) {
  const s2 = Object.assign({}, state.settings, {
    nickname: p.nickname !== undefined ? String(p.nickname).slice(0, 12) : state.settings.nickname,
    avatar: p.avatar !== undefined ? p.avatar : state.settings.avatar,
    city: p.city !== undefined ? String(p.city).slice(0, 20) : state.settings.city
  })
  saveSettings(s2)
}

export const DIET_AVOID = ['不吃辣', '不吃海鲜', '素食', '过敏原']
export const TASTE_PREFS = ['辣', '清淡', '甜', '咸']
export const DIET_GOALS = ['减脂', '增肌', '控糖', '均衡']
const GOAL_PURPOSE = { '减脂': '减肥', '增肌': '增肌', '控糖': '低卡', '均衡': '平衡' }
export function setDietAvoid(arr) { saveSettings({ dietAvoid: arr.slice() }) }
export function setTastePref(arr) { saveSettings({ tastePref: arr.slice() }) }
export function setDietGoal(g) {
  const goal = DIET_GOALS.includes(g) ? g : ''
  saveSettings({ dietGoal: goal })
  const purpose = GOAL_PURPOSE[goal]
  if (purpose) {
    state.selPurpose = [purpose]
    save(LS.purpose, state.selPurpose)
    resetDishPool()
  }
}
export function isNutrition() { return state.settings.showNutrition !== false }
export function resetAllData() {
  try { uni.clearStorageSync() } catch (e) { /* ignore */ }
  initStore()
  return true
}

export function setModeSkin(mode, skinKey) {
  const skins = MODE_SKINS[mode] || []
  const s = skins.find(x => x.key === skinKey)
  if (!s) return
  if (s.vipOnly && !isVip()) return
  state.modeSkins = Object.assign({}, state.modeSkins, { [mode]: skinKey })
  save(LS.modeSkins, state.modeSkins)
}

export function getModeSkin(mode) {
  const skins = MODE_SKINS[mode] || []
  if (!skins.length) return null
  const key = state.modeSkins[mode]
  const s = skins.find(x => x.key === key)
  if (s && s.vipOnly && !isVip()) return skins[0]
  return s || skins[0]
}

export function slug(s) {
  return String(s).replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '').slice(0, 12)
}

export function addCustomFood(food) {
  const id = slug(food.name) + '-' + Date.now().toString(36)
  if (!food.staples.length) food.staples = ['无']
  if (!food.tastes.length) food.tastes = ['咸']
  const f = { id, name: food.name, staples: food.staples, tastes: food.tastes, note: food.note || '', recipe: food.recipe || [], how: food.how || (food.recipe && food.recipe.length ? ['自己做'] : ['外卖', '外出']), purpose: food.purpose || ['通用'], cuisine: food.cuisine || '家常', category: food.category || '小吃' }
  state.custom.push(f)
  save(LS.custom, state.custom)
  resetDishPool()
  return id
}

export function deleteFood(id) {
  const f = visibleFoods().find(x => x.id === id)
  if (!f) return
  if (state.hidden.indexOf(id) === -1) state.hidden.push(id)
  delete state.marks[id]
  save(LS.hidden, state.hidden)
  save(LS.marks, state.marks)
  resetDishPool()
}

export function spin(pool) {
  if (state.spinning) return null
  const arr = pool || currentPool.value
  if (arr.length === 0) return null
  state.spinning = true
  const start = state.wheelAngle
  const target = start + Math.PI * 2 * (6 + Math.random() * 4)
  const t0 = Date.now()
  const dur = 3200
  state.wheelPool = arr
  const ease = t => 1 - Math.pow(1 - t, 3)
  return { start, target, dur, t0, ease, arr }
}

export function spinStep(prev, nowMs) {
  const t = Math.min(1, (nowMs - prev.t0) / prev.dur)
  state.wheelAngle = prev.start + (prev.target - prev.start) * prev.ease(t)
  if (t < 1) return { done: false, t }
  state.spinning = false
  return { done: true, t }
}

export function stopResult(prev) {
  const arr = prev.arr || state.wheelPool
  if (!arr.length) return null
  const item = resultFromAngle(arr, state.wheelAngle)
  state.lastResultId = item.id
  markFood(item.id, 'eaten')
  addHistory(item)
  return item
}

export function findFood(id) {
  return visibleFoods().find(f => f.id === id)
}

export const activeMarks = computed(() => {
  const active = activeMarksMap()
  return Object.keys(active).map(id => {
    const f = visibleFoods().find(x => x.id === id)
    if (!f) return null
    return { id, name: f.name, status: active[id].status, remain: remainText(id), food: f }
  }).filter(Boolean)
})

export { allFoods, visibleFoods, isMarked, remainText }
export function setPurpose(arr) {
  state.selPurpose = arr.slice()
  save(LS.purpose, state.selPurpose)
  resetDishPool()
}

export function setCuisine(arr) {
  state.selCuisine = arr.slice()
  save(LS.cuisine, state.selCuisine)
  resetDishPool()
}

export function setStaples(arr) {
  state.selStaples = arr.slice()
  resetDishPool()
}

export const THEMES = [
  { key: 'orange', label: '暖橙', accent: '#ff6b35', soft: '#ffe7dc', bg: '#FFF6EE' },
  { key: 'green', label: '薄荷绿', accent: '#22a06b', soft: '#dcf5ea', bg: '#F1FBF5' },
  { key: 'blue', label: '星空蓝', accent: '#2f8dd0', soft: '#e3f1fc', bg: '#F0F7FE' },
  { key: 'pink', label: '蜜桃粉', accent: '#e85d8a', soft: '#ffe3ec', bg: '#FFF1F6' }
]

export const themeMeta = computed(() => THEMES.find(t => t.key === state.theme) || THEMES[0])

export function applyTheme() {
  const m = themeMeta.value
  if (typeof document !== 'undefined') {
    const d = document.documentElement
    d.style.setProperty('--accent', m.accent)
    d.style.setProperty('--accent-soft', m.soft)
    d.style.setProperty('--bg', m.bg)
  }
}

export function getTheme() { return state.theme }

export function setTheme(k) {
  if (!THEMES.some(t => t.key === k)) return
  state.theme = k
  save(LS.theme, state.theme)
  applyTheme()
}

export function setTastes(arr) {
  state.selTastes = arr.slice()
  resetDishPool()
}

export function addDailyRecord(food) {
  if (!food) return
  const entry = { id: food.id, name: food.name, calories: food.calories || 0, nutrition: food.nutrition || '', ts: Date.now() }
  const idx = state.dailyRecords.findIndex(d => d.id === food.id)
  if (idx >= 0) state.dailyRecords.splice(idx, 1)
  state.dailyRecords.unshift(entry)
  if (state.dailyRecords.length > 30) state.dailyRecords.length = 30
  save(LS.daily, state.dailyRecords)
}

export function clearDailyRecords() {
  state.dailyRecords = []
  save(LS.daily, state.dailyRecords)
}

export const todayCalories = computed(() => state.dailyRecords.reduce((sum, d) => sum + (d.calories || 0), 0))

export function isModeVip(modeKey) {
  const m = RECOMMEND_MODES.find(x => x.key === modeKey)
  return !!(m && m.vipOnly)
}
export function removeDailyRecord(id) {
  state.dailyRecords = state.dailyRecords.filter(d => d.id !== id)
  save(LS.daily, state.dailyRecords)
}
export const poolState = reactive({ tab: 'rand', category: '', search: '', expandId: '' })
export function addToPool(id) {
  const i = state.hidden.indexOf(id)
  if (i >= 0) state.hidden.splice(i, 1)
  if (state.inPool.indexOf(id) === -1) {
    state.inPool.push(id)
    save(LS.inPool, state.inPool)
  }
  save(LS.hidden, state.hidden)
  resetDishPool()
}

export function removeFromPool(id) {
  const i = state.inPool.indexOf(id)
  if (i >= 0) {
    state.inPool.splice(i, 1)
    save(LS.inPool, state.inPool)
  }
  resetDishPool()
}

export function isInPool(id) {
  return state.inPool.indexOf(id) !== -1
}
