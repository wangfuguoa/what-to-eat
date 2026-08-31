import { reactive, computed } from 'vue'
import { BUILTIN_FOODS } from '@/data/foods'

export const STAPLES = ['米饭', '面条', '馒头', '包子', '饺子', '饼', '粥', '粉', '无']
export const TASTES = ['酸', '甜', '苦', '辣', '咸', '鲜', '香', '麻', '清淡']
export const WHEEL_COLORS = ['#ff6b6b', '#feca57', '#1dd1a1', '#54a0ff', '#5f27cd', '#ff9f43', '#f368e0', '#00d2d3', '#ee5253', '#10ac84', '#48dbfb', '#ffd32a']

const MS = { 天: 86400000, 周: 7 * 86400000, 月: 30 * 86400000 }
const LS = {
  custom: 'eatpick_custom_foods',
  hidden: 'eatpick_hidden_ids',
  marks: 'eatpick_marks',
  settings: 'eatpick_settings'
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
  settings: { memoryValue: 3, memoryUnit: '天', includeMarked: false },
  selStaples: [],
  selTastes: [],
  spinning: false,
  wheelAngle: 0,
  wheelPool: [],
  lastResultId: null
})

function allFoods() {
  return BUILTIN_FOODS.concat(state.custom)
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
  return visibleFoods().filter(f => {
    const okStaple = state.selStaples.length === 0 || f.staples.some(t => state.selStaples.includes(t))
    const okTaste = state.selTastes.length === 0 || f.tastes.some(t => state.selTastes.includes(t))
    if (!okStaple || !okTaste) return false
    if (!state.settings.includeMarked && active[f.id]) return false
    return true
  })
})

function remainText(id) {
  const m = state.marks[id]
  if (!m) return '已到期'
  const msLeft = m.expireAt - Date.now()
  if (msLeft <= 0) return '已到期'
  const day = Math.ceil(msLeft / 86400000)
  return day >= 1 ? day + '天' : Math.ceil(msLeft / 3600000) + '小时'
}

function persist() {
  save(LS.custom, state.custom)
  save(LS.hidden, state.hidden)
  save(LS.marks, state.marks)
  save(LS.settings, state.settings)
}

export function initStore() {
  state.custom = load(LS.custom, [])
  state.hidden = load(LS.hidden, [])
  state.marks = load(LS.marks, {})
  const s = load(LS.settings, {})
  state.settings = Object.assign({ memoryValue: 3, memoryUnit: '天', includeMarked: false }, s)
  purgeExpired()
}

export function toggleFilter(type, label) {
  const arr = type === 'staple' ? state.selStaples : state.selTastes
  const idx = arr.indexOf(label)
  if (idx >= 0) arr.splice(idx, 1)
  else arr.push(label)
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

export function saveSettings(settings) {
  state.settings = Object.assign({}, state.settings, settings)
  save(LS.settings, state.settings)
  purgeExpired()
}

export function slug(s) {
  return String(s).replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '').slice(0, 12)
}

export function addCustomFood(food) {
  const id = slug(food.name) + '-' + Date.now().toString(36)
  if (!food.staples.length) food.staples = ['无']
  if (!food.tastes.length) food.tastes = ['咸']
  state.custom.push({ id, name: food.name, staples: food.staples, tastes: food.tastes, note: food.note || '', recipe: food.recipe || [] })
  save(LS.custom, state.custom)
  return id
}

export function deleteFood(id) {
  const f = visibleFoods().find(x => x.id === id)
  if (!f) return
  if (state.hidden.indexOf(id) === -1) state.hidden.push(id)
  delete state.marks[id]
  save(LS.hidden, state.hidden)
  save(LS.marks, state.marks)
}

export function spin() {
  if (state.spinning) return null
  const arr = currentPool.value
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
  const pointer = -Math.PI / 2
  const n = arr.length
  const slice = (Math.PI * 2) / n
  let delta = (pointer - state.wheelAngle) % (Math.PI * 2)
  if (delta < 0) delta += Math.PI * 2
  let idx = Math.floor(delta / slice)
  if (idx >= n) idx = n - 1
  const item = arr[idx]
  state.lastResultId = item.id
  markFood(item.id, 'eaten')
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
