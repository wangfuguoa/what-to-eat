<template>
  <view class="page">
    <view class="app-header">
      <view class="brand">
        <text class="logo">📖</text>
        <view class="brand-text">
          <text class="brand-title">菜谱</text>
          <text class="brand-sub">搜一搜，挑一挑</text>
        </view>
      </view>
      <button class="tool-btn" @tap="openAdd">＋ 添加</button>
    </view>

    <!-- 子页切换 -->
    <view class="sub-tabs">
      <view v-for="t in SUB_TABS" :key="t.key" class="sub-tab" :class="{ active: poolState.tab === t.key }" @tap="setTab(t.key)">{{ t.icon }} {{ t.label }}</view>
    </view>

    <!-- 搜索 + 分类（非科普） -->
    <view v-if="poolState.tab !== 'science'" class="search">
      <text class="search-icon">🔍</text>
      <input class="search-input" v-model="poolState.search" placeholder="搜索菜名，如：土豆" />
    </view>
    <view v-if="poolState.tab !== 'science'" class="chips category">
      <view class="chip" :class="{ active: !poolState.category }" @tap="setCategory('')">全部</view>
      <view v-for="c in CATEGORY_OPTIONS" :key="c" class="chip" :class="{ active: poolState.category === c }" @tap="setCategory(c)">{{ c }}</view>
    </view>

    <!-- 随机池 -->
    <view v-if="poolState.tab === 'rand'" class="card">
      <view class="section-head">
        <text class="card-title">随机池</text>
        <text class="muted">{{ list.length }} 道</text>
      </view>
      <view v-if="!list.length" class="empty">没有符合条件的菜</view>
      <view v-for="f in list" :key="f.id" class="food-card">
        <view class="food-main">
          <text class="food-name">{{ f.name }}</text>
          <text class="food-meta">{{ poolMeta(f) }}</text>
        </view>
        <view class="food-actions">
          <button class="btn small ghost fav" @tap="favFood(f.id)">{{ isFavorite(f.id) ? '♥' : '♡' }}</button>
          <button class="btn small ghost" @tap="markUnwanted(f.id)">不想吃</button>
          <button class="btn small ghost danger" @tap="onDelete(f.id)">删</button>
        </view>
      </view>
    </view>

    <!-- 收藏 -->
    <view v-else-if="poolState.tab === 'fav'" class="card">
      <view class="section-head">
        <text class="card-title">收藏</text>
        <text class="muted">{{ list.length }} 道</text>
      </view>
      <view v-if="!list.length" class="empty">还没有收藏的菜</view>
      <view v-for="f in list" :key="f.id" class="food-card">
        <view class="food-main">
          <text class="food-name">{{ f.name }}</text>
          <text class="food-meta">{{ poolMeta(f) }}</text>
        </view>
        <view class="food-actions">
          <button class="btn small ghost fav" @tap="favFood(f.id)">{{ isFavorite(f.id) ? '♥' : '♡' }}</button>
          <button class="btn small ghost danger" @tap="onDelete(f.id)">删</button>
        </view>
      </view>
    </view>

    <!-- 菜谱大全 -->
    <view v-else-if="poolState.tab === 'all'" class="card">
      <view class="section-head">
        <text class="card-title">菜谱大全</text>
        <text class="muted">{{ list.length }} 道</text>
      </view>
      <view v-if="!list.length" class="empty">没有符合条件的菜</view>
      <view v-for="f in list" :key="f.id" class="food-card recipe-card">
        <view class="food-main">
          <text class="food-name">{{ f.name }}</text>
          <text class="food-meta">{{ poolMeta(f) }}{{ f.calories ? ' · ' + f.calories + ' kcal' : '' }}</text>
        </view>
        <view class="food-actions">
          <button class="btn small ghost" @tap="toggleExpand(f.id)">{{ poolState.expandId === f.id ? '收起' : '展开' }}</button>
          <button class="btn small ghost" @tap="addToRandom(f.id)">{{ isInPool(f.id) ? '✓ 随机池' : '＋随机池' }}</button>
          <button class="btn small ghost fav" @tap="favFood(f.id)">{{ isFavorite(f.id) ? '♥' : '♡' }}</button>
        </view>
        <view v-if="poolState.expandId === f.id" class="recipe-block">
          <text class="recipe-title">做法</text>
          <template v-if="f.recipe && f.recipe.length">
            <text v-for="(s, i) in f.recipe" :key="'rc'+i" class="recipe-step">{{ i + 1 }}. {{ s }}</text>
          </template>
          <text v-else class="recipe-step">暂无教程，去搜「{{ f.name }} 做法」。</text>
          <view v-if="f.nutrition" class="guide"><text>营养：{{ f.nutrition }}</text></view>
        </view>
      </view>
    </view>

    <!-- 科普 -->
    <view v-else class="card science-card">
      <view class="section-head">
        <text class="card-title">吃饭小科普</text>
        <text class="muted">点亮 ★ 关注，可置顶</text>
      </view>
      <view v-for="s in scienceList" :key="s.id" class="science-item" :class="{ lit: isLit(s.id), pinned: isPinned(s.id) }">
        <view class="science-head">
          <text class="science-icon">{{ s.i }}</text>
          <text class="science-title">{{ s.t }}</text>
          <button class="btn small ghost fav" @tap="toggleScience(s.id)">{{ isLit(s.id) ? '★' : '☆' }}</button>
          <button v-if="isLit(s.id)" class="btn small ghost pin" @tap="togglePin(s.id)">{{ isPinned(s.id) ? '📍' : '置顶' }}</button>
        </view>
        <text class="science-body">{{ s.b }}</text>
      </view>
    </view>

    <!-- 添加 -->
    <view v-if="addVisible" class="overlay" @tap.self="closeAdd">
      <view class="modal">
        <button class="modal-close" @tap="closeAdd">×</button>
        <text class="modal-title">添加一道菜</text>
        <view class="field">
          <text class="field-label">菜名</text>
          <input class="input" v-model="form.name" placeholder="如：麻辣香锅" />
        </view>
        <view class="field">
          <text class="field-label">分类</text>
          <view class="chips">
            <view v-for="c in CATEGORY_OPTIONS" :key="'act'+c" class="chip" :class="{ active: form.category === c }" @tap="form.category = c">{{ c }}</view>
          </view>
        </view>
        <view class="field">
          <text class="field-label">主食</text>
          <view class="chips">
            <view v-for="t in STAPLES" :key="'af'+t" class="chip" :class="{ active: form.staples.includes(t) }" @tap="toggleFormStaple(t)">{{ t }}</view>
          </view>
        </view>
        <view class="field">
          <text class="field-label">味道</text>
          <view class="chips">
            <view v-for="t in TASTES" :key="'aft'+t" class="chip" :class="{ active: form.tastes.includes(t) }" @tap="toggleFormTaste(t)">{{ t }}</view>
          </view>
        </view>
        <view class="field">
          <text class="field-label">一句话介绍（可选）</text>
          <input class="input" v-model="form.note" placeholder="如：加班必备" />
        </view>
        <view class="field">
          <text class="field-label">做法步骤（可选，每行一步）</text>
          <textarea class="textarea" v-model="form.recipe" placeholder="蒜末爆香&#10;下食材翻炒" />
        </view>
        <button class="btn primary" @tap="saveFood">保存</button>
      </view>
    </view>

    <view class="toast" :class="{ show: toastShow }">{{ toastMsg }}</view>
  </view>
</template>
<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  state, poolState, CATEGORY_OPTIONS, STAPLES, TASTES,
  currentPool, visibleFoods, isFavorite, toggleFavorite, markFood, unmarkFood,
    findFood, deleteFood, addCustomFood, isInPool, addToPool, removeFromPool
} from '@/store/food'
import { saveToCloud } from '@/utils/sync'

const SUB_TABS = [
  { key: 'rand', label: '随机池', icon: '🎲' },
  { key: 'fav', label: '收藏', icon: '⭐' },
  { key: 'all', label: '菜谱大全', icon: '📖' },
  { key: 'science', label: '科普', icon: '💡' }
]
const SCIENCE_TIPS = [
  { id: 's1', i: '🥗', t: '每餐搭配', b: '一餐最好有主食+蛋白质+蔬菜，比例约 1:1:2，既饱腹又营养均衡。' },
  { id: 's2', i: '🕐', t: '细嚼慢咽', b: '每口咀嚼 20 次左右，给大脑时间接收“吃饱”信号，避免吃撑。' },
  { id: 's3', i: '🥛', t: '饭前喝汤', b: '饭前一小碗清汤能增加饱腹感，减少主食摄入，对控卡有帮助。' },
  { id: 's4', i: '🔥', t: '少油少盐', b: '每天盐不超过 5g，油 25-30g，重口味容易加重身体负担。' },
  { id: 's5', i: '🧊', t: '少喝冰饮', b: '饭后或空腹大量冰饮刺激肠胃，建议常温或少喝含糖饮料。' },
  { id: 's6', i: '🌙', t: '别熬夜吃', b: '临近睡觉进餐食物难消化，最好睡前 2-3 小时吃完晚餐。' },
  { id: 's7', i: '🍗', t: '蛋白质优先', b: '每餐来一拳蛋白质（蛋/肉/鱼/豆），更能扛饿，减少乱吃零食。' },
  { id: 's8', i: '🌾', t: '膳食纤维', b: '多吃粗粮、蔬菜、豆类，膳食纤维助肠道蠕动，还能稳住血糖。' },
  { id: 's9', i: '🍽️', t: '七分饱刚好', b: '吃到七八分饱就停下，比吃撑更舒服，也更利于控制体重。' },
  { id: 's10', i: '📵', t: '专心吃饭', b: '吃饭时别边刷手机边吃，容易不知不觉吃多，也更难察觉“饱”。' }
]

const addVisible = ref(false)
const form = ref({ name: '', category: '小吃', staples: [], tastes: [], note: '', recipe: '' })
const toastShow = ref(false)
const toastMsg = ref('')
let toastTimer = null

const savedScience = ref([])

const list = computed(() => {
  let arr = []
  if (poolState.tab === 'fav') arr = visibleFoods().filter(f => isFavorite(f.id))
  else if (poolState.tab === 'all') arr = visibleFoods()
  else arr = currentPool.value
  if (poolState.category) arr = arr.filter(f => f.category === poolState.category)
  const q = poolState.search.trim()
  if (q) arr = arr.filter(f => f.name.indexOf(q) !== -1)
  return arr
})

function toast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}
function setTab(k) { poolState.tab = k; if (k !== 'all') poolState.expandId = '' }
function setCategory(c) { poolState.category = c }
function poolMeta(f) {
  const parts = []
  if (f.category) parts.push(f.category)
  if (f.staples && f.staples.length) parts.push(f.staples.join(' / '))
  if (f.tastes && f.tastes.length) parts.push(f.tastes.join(' '))
  return parts.join(' · ')
}
function favFood(id) {
  toggleFavorite(id)
  toast(isFavorite(id) ? '已收藏' : '已取消收藏')
  saveToCloud()
}
function markUnwanted(id) {
  markFood(id, 'unwanted')
  toast('已标记「不想吃」')
  saveToCloud()
}
function onDelete(id) {
  const f = findFood(id)
  uni.showModal({
    title: '提示', content: '删除「' + (f ? f.name : '') + '」？',
    success: (res) => { if (res.confirm) { deleteFood(id); toast('已删除'); saveToCloud() } }
  })
}
function toggleExpand(id) {
  poolState.expandId = poolState.expandId === id ? '' : id
}
  function addToRandom(id) {
    if (!isInPool(id)) { addToPool(id); toast('已加入随机池') }
    else { removeFromPool(id); toast('已移出随机池') }
    saveToCloud()
  }
  function loadScience() {
    try {
      const raw = uni.getStorageSync('eatpick_science_fav')
      const arr = raw ? JSON.parse(raw) : []
      savedScience.value = Array.isArray(arr) ? arr.map(x => (typeof x === 'string'
        ? { id: x, ts: 0, pinned: false, pinnedAt: 0 }
        : { id: x.id, ts: Number(x.ts) || 0, pinned: !!x.pinned, pinnedAt: Number(x.pinnedAt) || 0 })) : []
    } catch (e) { savedScience.value = [] }
  }
  function saveScience() {
    try { uni.setStorageSync('eatpick_science_fav', JSON.stringify(savedScience.value)) } catch (e) {}
  }
  const scienceList = computed(() => {
    const lit = savedScience.value
    const pinned = lit.filter(x => x.pinned).sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0))
    const on = lit.filter(x => !x.pinned).sort((a, b) => (a.ts || 0) - (b.ts || 0))
    const off = SCIENCE_TIPS.filter(s => !lit.some(x => x.id === s.id))
    return [...pinned, ...on, ...off]
  })
  function isLit(id) { return savedScience.value.some(x => x.id === id) }
  function isPinned(id) { const x = savedScience.value.find(y => y.id === id); return !!(x && x.pinned) }
  function toggleScience(id) {
    const i = savedScience.value.findIndex(x => x.id === id)
    if (i >= 0) savedScience.value.splice(i, 1)
    else savedScience.value.push({ id, ts: Date.now(), pinned: false, pinnedAt: 0 })
    saveScience()
  }
  function togglePin(id) {
    const x = savedScience.value.find(y => y.id === id)
    if (!x) return
    x.pinned = !x.pinned
    x.pinnedAt = x.pinned ? Date.now() : 0
    saveScience()
  }
function openAdd() {
  form.value = { name: '', category: '小吃', staples: [], tastes: [], note: '', recipe: '' }
  addVisible.value = true
}
function closeAdd() { addVisible.value = false }
function toggleFormStaple(t) {
  const i = form.value.staples.indexOf(t)
  if (i >= 0) form.value.staples.splice(i, 1); else form.value.staples.push(t)
}
function toggleFormTaste(t) {
  const i = form.value.tastes.indexOf(t)
  if (i >= 0) form.value.tastes.splice(i, 1); else form.value.tastes.push(t)
}
function saveFood() {
  const name = form.value.name.trim()
  if (!name) { toast('请输入菜名'); return }
  const recipe = form.value.recipe.split('\n').map(x => x.trim()).filter(Boolean)
  addCustomFood({ name, staples: [...form.value.staples], tastes: [...form.value.tastes], note: form.value.note.trim(), recipe, category: form.value.category, how: recipe.length ? ['自己做'] : ['外卖', '外出'] })
  closeAdd()
  toast('已添加「' + name + '」')
  saveToCloud()
}

onShow(() => {
  loadScience()
  if (poolState.expandId) poolState.tab = 'all'
})
</script>
<style>
.page { min-height: 100vh; background: var(--bg); padding: 16px 14px 40px; box-sizing: border-box; }
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.brand { display: flex; align-items: center; gap: 10px; }
.logo { font-size: 30px; }
.brand-title { font-size: 21px; font-weight: 800; color: #2d2a26; display: block; line-height: 1.1; }
.brand-sub { font-size: 12px; color: #9a8f83; display: block; }
.tool-btn { margin: 0; border: 1px solid #ddd; background: #fff; padding: 8px 12px; border-radius: 10px; font-size: 13px; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
.sub-tabs { display: flex; gap: 5px; background: #f4ece3; border-radius: 999px; padding: 4px; margin-bottom: 14px; }
.sub-tab { flex: 1; text-align: center; font-size: 12px; color: #8a7b6c; padding: 8px 0; border-radius: 999px; }
.sub-tab.active { background: var(--accent); color: #fff; font-weight: 700; }
.search { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e6d8c8; border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; }
.search-icon { font-size: 16px; }
.search-input { flex: 1; font-size: 14px; border: none; background: transparent; color: #2d2a26; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid #e6d8c8; background: #fff; border-radius: 999px; padding: 7px 14px; font-size: 13px; color: #6b5d4e; }
.chip.active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.category { margin-bottom: 12px; }
.card { background: #fff; border-radius: 18px; padding: 16px; margin-bottom: 14px; box-shadow: 0 4px 18px rgba(160,120,70,0.06); }
.section-head { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.muted { font-size: 12px; color: #b0a49a; }
.empty { color: #b0a49a; padding: 14px 0; text-align: center; font-size: 13px; }
.food-card { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f4ece3; flex-wrap: wrap; }
.food-main { flex: 1; padding-right: 8px; min-width: 0; }
.food-name { font-size: 15px; font-weight: 700; color: #2d2a26; display: block; }
.food-meta { font-size: 12px; color: #9a8f83; display: block; margin-top: 2px; }
.food-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.recipe-card { align-items: flex-start; }
.recipe-block { width: 100%; border-top: 1px solid #f4ece3; padding-top: 10px; margin-top: 8px; }
.recipe-title { font-size: 14px; font-weight: 700; display: block; margin-bottom: 6px; color: #2d2a26; }
.recipe-step { font-size: 14px; color: #6b5d4e; line-height: 1.8; display: block; }
.guide { background: #f0f8ff; border-radius: 12px; padding: 10px; font-size: 13px; color: #3b6a8a; margin-top: 10px; }
.science-item { padding: 12px 0; border-bottom: 1px solid #f4ece3; }
.science-item.lit { background: #fff9ec; border-radius: 12px; padding: 12px; border: 1px solid #ffe6b0; margin: 6px 0; }
.science-item.pinned { background: #fff3e0; border: 1px solid #ffc86a; }
.science-head { display: flex; align-items: center; gap: 8px; }
.science-icon { font-size: 20px; }
.science-title { font-size: 15px; font-weight: 700; color: #2d2a26; flex: 1; }
.science-body { font-size: 13px; color: #6b5d4e; line-height: 1.7; display: block; margin-top: 6px; }
.btn { border-radius: 999px; font-size: 13px; padding: 8px 13px; border: none; line-height: 1; transition: transform 0.1s; }
.btn:active { transform: scale(0.96); }
.btn.primary { background: linear-gradient(150deg, #ff8a50, var(--accent)); color: #fff; box-shadow: 0 4px 12px rgba(255,107,53,0.3); }
.btn.ghost { background: #fff; border: 1px solid #e6d8c8; color: #6b5d4e; }
.btn.small { font-size: 12px; padding: 6px 10px; }
.btn.danger { color: #e74c3c; border-color: #f3c0bb; }
.btn.fav { color: #e85d8a; border-color: #ffd7e2; }
.btn.pin { color: #c9730a; border-color: #f6cf9a; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #fff; border-radius: 18px; padding: 20px; width: 100%; max-width: 400px; position: relative; max-height: 85vh; overflow-y: auto; }
.modal-close { position: absolute; top: 10px; right: 12px; background: #f0ece7; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; color: #6b5d4e; line-height: 1; }
.modal-title { font-size: 18px; font-weight: 800; display: block; margin-bottom: 12px; color: #2d2a26; }
.field { margin-bottom: 12px; }
.field-label { font-size: 13px; color: #8a7b6c; display: block; margin-bottom: 4px; }
.input { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; width: 100%; box-sizing: border-box; }
.textarea { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; width: 100%; box-sizing: border-box; height: 90px; }
.toast { position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%); background: rgba(0,0,0,0.82); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 14px; opacity: 0; transition: opacity 0.2s; z-index: 200; pointer-events: none; max-width: 80vw; text-align: center; }
.toast.show { opacity: 1; }
</style>
