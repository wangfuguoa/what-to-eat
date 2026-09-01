<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="app-header">
      <view class="brand">
        <text class="logo">🍱</text>
        <view class="brand-text">
          <text class="brand-title">吃什么</text>
          <text class="brand-sub">今天别再纠结了</text>
        </view>
      </view>
      <button class="vip-pill" :class="{ on: isVip() }" @tap="openVip">{{ isVip() ? '💎 VIP' : '💎 升级' }}</button>
    </view>

    <!-- 推荐玩法 -->
    <view class="card hero">
      <view class="hero-top">
        <text class="hero-title">今日推荐</text>
        <view class="mode-tabs">
          <view v-for="m in RECOMMEND_MODES" :key="m.key" class="mode-tab" :class="{ active: mode === m.key }" @tap="switchMode(m.key)">{{ m.icon }} {{ m.label }}</view>
        </view>
      </view>

      <!-- 转盘 -->
      <view v-if="mode === 'wheel'" class="hero-wheel-wrap">
        <canvas canvas-id="heroWheel" id="heroWheel" class="hero-wheel" :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"></canvas>
        <view class="hero-wheel-pulse" :class="{ spin: heroSpinning }"></view>
        <view class="wheel-center" @tap="toggleWheel">
          <text class="wheel-center-main">{{ heroSpinning ? '再点停下' : '点我转' }}</text>
          <text class="wheel-center-sub">点击开始 / 停止</text>
        </view>
      </view>

      <!-- 抽签 -->
      <view v-else-if="mode === 'draw'" class="hero-draw" @tap="toggleDraw">
        <view class="qiantong" :class="{ shake: drawing }">
          <view class="qian" v-for="i in 4" :key="'q'+i" :style="{ transform: 'rotate(' + ((i - 2.5) * 8) + 'deg)' }">
            <text class="qian-word">吃</text>
          </view>
          <view class="qian m" :class="{ out: drawing }">「食」</view>
        </view>
        <text class="hero-btn-sub">{{ drawing ? '抽签中…' : '点一下抽一签' }}</text>
      </view>

      <!-- 翻牌 -->
      <view v-else class="hero-flip">
        <view class="flip-grid">
          <view v-for="(c, i) in flipCards" :key="i" class="flip-card" :class="{ revealed: flipRevealed === i }" @tap="flipCard(i)">
            <view class="flip-inner">
              <view class="flip-face back">
                <text class="flip-back-mark">?</text>
                <text class="flip-back-txt">翻牌</text>
              </view>
              <view class="flip-face front">
                <text class="flip-name">{{ c.name }}</text>
                <text class="flip-cat">{{ c.category }}</text>
              </view>
            </view>
          </view>
        </view>
        <text class="hero-btn-sub">选一张，翻开你的好运菜</text>
      </view>

      <!-- 推荐结果 -->
      <view v-if="recommendResult" class="hero-result" :class="{ confirmed: resultConfirmed }">
        <view class="hero-result-badge">{{ resultConfirmed ? '✅ 已入菜单' : '🎉 就吃这个' }}</view>
        <text class="hero-result-name">{{ recommendResult.name }}</text>
        <view class="tags">
          <text v-for="t in recommendResult.staples" :key="'hrs'+t" class="tag">{{ t }}</text>
          <text v-for="t in recommendResult.tastes" :key="'hrt'+t" class="tag alt">{{ t }}</text>
          <text class="tag cat">{{ recommendResult.category }}</text>
        </view>
        <text v-if="recommendResult.note" class="note">{{ recommendResult.note }}</text>
        <view class="action-row">
          <button class="btn primary big" @tap="chooseIt">🍚 就它了</button>
          <button class="btn ghost big" @tap="addAndRespin">➕ 加菜</button>
          <button class="btn ghost big" @tap="recomposeAction">🔀 重组</button>
        </view>
      </view>

      <!-- 转盘限量 -->
      <view class="pool-limit">
        <text class="pool-limit-label">转盘限量</text>
        <button class="limit-btn" @tap="decLimit">−</button>
        <input class="limit-input" type="number" :value="state.poolLimit" @blur="onLimitBlur" @confirm="onLimitBlur" />
        <button class="limit-btn" @tap="incLimit">＋</button>
        <text class="pool-limit-label">道 · 可抽 {{ dishPool.length }} 道</text>
      </view>
    </view>

    <!-- 五层筛选 -->
    <view class="card filter-card">
      <view class="filter-head">
        <text class="filter-title">① 怎么吃 <text class="req">必选</text></text>
        <button class="spin-mini" @tap="moduleSpin('how')">🎲 转一转</button>
      </view>
      <view class="chips">
        <view v-for="k in HOW_OPTIONS" :key="'how'+k" class="chip" :class="{ active: state.howToEat === k }" @tap="setHowToEat(k)">{{ k }}</view>
      </view>
      <text class="hint">选择后会自动筛选适合这种方式吃的菜</text>
    </view>

    <view class="card filter-card">
      <view class="filter-head">
        <text class="filter-title">② 吃饭目的 <text class="opt">可选</text></text>
        <button class="spin-mini" @tap="moduleSpin('purpose')">🎲 转一转</button>
      </view>
      <view class="chips">
        <view class="chip" :class="{ active: state.selPurpose.length === 0 }" @tap="clearPurpose">不选择</view>
        <view v-for="k in PURPOSE_OPTIONS" :key="'pur'+k" class="chip" :class="{ active: state.selPurpose.includes(k) }" @tap="togglePurpose(k)">{{ k }}</view>
      </view>
    </view>

    <view class="card filter-card">
      <view class="filter-head">
        <text class="filter-title">③ 菜系 <text class="opt">可选</text></text>
        <button class="spin-mini" @tap="moduleSpin('cuisine')">🎲 转一转</button>
      </view>
      <view class="chips">
        <view class="chip" :class="{ active: state.selCuisine.length === 0 }" @tap="clearCuisine">不选择</view>
        <view v-for="k in CUISINE_OPTIONS" :key="'cui'+k" class="chip" :class="{ active: state.selCuisine.includes(k) }" @tap="toggleCuisine(k)">{{ k }}</view>
      </view>
    </view>

    <view class="card filter-card">
      <view class="filter-head">
        <text class="filter-title">④ 主食搭配 <text class="opt">可选</text></text>
        <button class="spin-mini" @tap="moduleSpin('staple')">🎲 转一转</button>
      </view>
      <view class="chips">
        <view class="chip" :class="{ active: state.selStaples.length === 0 }" @tap="clearStaples">不选择</view>
        <view v-for="k in STAPLES" :key="'sta'+k" class="chip" :class="{ active: state.selStaples.includes(k) }" @tap="toggleStaple(k)">{{ k }}</view>
      </view>
    </view>

    <view class="card filter-card">
      <view class="filter-head">
        <text class="filter-title">⑤ 味道 <text class="opt">可选</text></text>
        <button class="spin-mini" @tap="moduleSpin('taste')">🎲 转一转</button>
      </view>
      <view class="chips">
        <view class="chip" :class="{ active: state.selTastes.length === 0 }" @tap="clearTastes">不选择</view>
        <view v-for="k in TASTES" :key="'tas'+k" class="chip" :class="{ active: state.selTastes.includes(k) }" @tap="toggleTaste(k)">{{ k }}</view>
      </view>
    </view>

    <!-- 今日菜单 -->
    <view class="card">
      <view class="section-head">
        <text class="card-title">今日菜单</text>
        <text class="muted">{{ state.menu.length }} 道</text>
      </view>
      <view v-if="!state.menu.length" class="empty">选好的菜会自动放在这里，点「菜谱」看做法</view>
      <view v-for="m in state.menu" :key="m.id" class="menu-row">
        <view class="menu-main">
          <text class="food-name">{{ m.name }}</text>
          <text class="food-meta">{{ (m.how || []).join(' / ') + (m.note ? ' · ' + m.note : '') }}</text>
        </view>
        <view class="food-actions">
          <button class="btn small ghost" @tap="openRecipe(m)">🍳 菜谱</button>
          <button class="btn small ghost danger" @tap="removeMenu(m.id)">删</button>
        </view>
      </view>
    </view>

    <!-- 菜谱弹窗 -->
    <view v-if="recipeVisible" class="overlay" @tap.self="closeRecipe">
      <view class="modal">
        <button class="modal-close" @tap="closeRecipe">×</button>
        <text class="modal-title">{{ recipeFood && recipeFood.name }}</text>
        <view class="tags">
          <text v-for="t in (recipeFood.staples || [])" :key="'rsx'+t" class="tag">{{ t }}</text>
          <text v-for="t in (recipeFood.tastes || [])" :key="'rtx'+t" class="tag alt">{{ t }}</text>
          <text v-if="recipeFood" class="tag cat">{{ recipeFood.category }}</text>
        </view>
        <view v-if="recipeFood && recipeFood.recipe && recipeFood.recipe.length" class="recipe-block">
          <text class="recipe-title">做法教程</text>
          <text v-for="(s, i) in recipeFood.recipe" :key="'st'+i" class="recipe-step">{{ i + 1 }}. {{ s }}</text>
        </view>
        <view v-else class="guide">
          <text>这道菜更适合「{{ howSuggest }}」。<br />去搜「{{ recipeFood && recipeFood.name }} 做法」就能找到教程。</text>
        </view>
        <button class="btn primary" @tap="closeRecipe">知道啦</button>
      </view>
    </view>

    <!-- VIP 弹窗 -->
    <view v-if="vipVisible" class="overlay" @tap.self="closeVip">
      <view class="modal">
        <button class="modal-close" @tap="closeVip">×</button>
        <text class="modal-title">💎 VIP 会员</text>
        <view class="vip-status" :class="{ on: isVip() }">
          <text class="vip-badge">{{ isVip() ? '已开通' : '未开通' }}</text>
          <text v-if="isVip()" class="vip-expire">{{ vipExpireText }}</text>
          <text v-else class="muted">使用兑换码开通，解锁更多高级玩法</text>
        </view>
        <view class="field">
          <text class="field-label">兑换码</text>
          <input class="input vip-input" v-model="vipCode" maxlength="32" confirm-type="done" @confirm="redeem" :focus="vipFocus" placeholder="请输入兑换码，如 VIP2026" />
        </view>
        <button class="btn primary" @tap="redeem" :disabled="vipBusy">{{ vipBusy ? '兑换中…' : '立即兑换' }}</button>
      </view>
    </view>

    <view class="toast" :class="{ show: toastShow }">{{ toastMsg }}</view>
  </view>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch, getCurrentInstance, nextTick } from 'vue'
import {
  state, STAPLES, TASTES, HOW_OPTIONS, PURPOSE_OPTIONS,
  CUISINE_OPTIONS, RECOMMEND_MODES, WHEEL_COLORS,
  initStore, setHowToEat, togglePurpose, toggleCuisine, toggleFilter,
  setPurpose, setCuisine, setStaples, setTastes, spinModule,
  setPoolLimit, setRecommendMode, pickRecommend, resultFromAngle,
  addToMenu, removeFromMenu, recomposeDishPool, resetDishPool, markFood,
  addHistory, isVip, findFood
} from '@/store/food'
import { saveToCloud, refreshVip } from '@/utils/sync'
import { callApi } from '@/utils/cloudbase'

const instance = getCurrentInstance()
const sys = uni.getSystemInfoSync()
const canvasSize = Math.min(320, (sys.windowWidth || 375) - 72)

const recipeVisible = ref(false)
const recipeFood = ref(null)
const vipVisible = ref(false)
const vipCode = ref('')
const vipBusy = ref(false)
const vipFocus = ref(false)
const toastShow = ref(false)
const toastMsg = ref('')
const resultConfirmed = ref(false)
const drawing = ref(false)
const flipCards = ref([])
const flipRevealed = ref(null)
const geoHint = ref('')

let toastTimer = null
let heroAnimId = null

const mode = computed(() => state.recommendMode)
const heroSpinning = computed(() => state.recommendSpinning)
const recommendResult = computed(() => state.recommendResult)
const dishPool = computed(() => state.dishPool)

const howSuggest = computed(() => {
  const r = recipeFood.value
  if (!r) return '自己做'
  return (r.how && r.how.length) ? r.how[0] : '自己做'
})

const vipExpireText = computed(() => {
  const v = state.vip
  if (!v || !v.expireAt) return ''
  const d = new Date(v.expireAt)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return '到期 ' + d.getFullYear() + '-' + mm + '-' + dd
})

function toast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

function raf(fn) {
  if (typeof requestAnimationFrame !== 'undefined') return requestAnimationFrame(fn)
  return setTimeout(fn, 16)
}
function caf(id) {
  if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(id)
  else clearTimeout(id)
}

function getCtx() {
  return uni.createCanvasContext('heroWheel', instance ? instance.proxy : null)
}

function shortName(name) {
  name = String(name)
  return name.length > 5 ? name.slice(0, 5) + '…' : name
}

function drawWheel() {
  const ctx = getCtx()
  const size = canvasSize
  const cx = size / 2, cy = size / 2, r = size / 2 - 8
  ctx.clearRect(0, 0, size, size)
  const arr = dishPool.value
  if (!arr.length) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.setFillStyle('#f1f1f3'); ctx.fill()
    ctx.setFillStyle('#999'); ctx.setFontSize(14); ctx.setTextAlign('center')
    ctx.fillText('没菜了', cx, cy)
    ctx.draw()
    return
  }
  const n = Math.min(arr.length, 28)
  const slice = (Math.PI * 2) / n
  for (let i = 0; i < n; i++) {
    const a = state.wheelAngle + i * slice
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a, a + slice)
    ctx.closePath()
    ctx.setFillStyle(WHEEL_COLORS[i % WHEEL_COLORS.length])
    ctx.fill()
    ctx.setStrokeStyle('#fff')
    ctx.setLineWidth(1.5)
    ctx.stroke()
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(a + slice / 2)
    ctx.setTextAlign('right')
    ctx.setFillStyle('#fff')
    ctx.setFontSize(Math.max(10, Math.min(14, (r * 0.9 / n) * 2)))
    ctx.fillText(shortName(arr[i].name), r - 10, 4)
    ctx.restore()
  }
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.setFillStyle('#fff'); ctx.fill()
  ctx.setFillStyle('#333'); ctx.setFontSize(9); ctx.setTextAlign('center')
  ctx.fillText('吃!', cx, cy + 3)
  ctx.draw()
}

function runHeroAnim() {
  const step = () => {
    if (!state.recommendSpinning) return
    state.wheelAngle += 0.06 + Math.random() * 0.01
    drawWheel()
    heroAnimId = raf(step)
  }
  step()
}
function clearHeroAnim() {
  if (heroAnimId) { caf(heroAnimId); heroAnimId = null }
}

function toggleWheel() {
  if (!dishPool.value.length) { toast('没有符合条件的菜，先放宽筛选'); return }
  if (state.recommendSpinning) {
    state.recommendSpinning = false
    clearHeroAnim()
    const item = resultFromAngle(dishPool.value, state.wheelAngle)
    if (item) { state.recommendResult = item; resultConfirmed.value = false }
  } else {
    state.recommendResult = null
    resultConfirmed.value = false
    state.recommendSpinning = true
    clearHeroAnim()
    runHeroAnim()
  }
}

function toggleDraw() {
  if (drawing.value) return
  if (!dishPool.value.length) { toast('没有符合条件的菜，先放宽筛选'); return }
  drawing.value = true
  state.recommendResult = null
  resultConfirmed.value = false
  setTimeout(() => {
    drawing.value = false
    state.recommendResult = pickRecommend(dishPool.value)
  }, 900)
}

function generateFlips() {
  flipRevealed.value = null
  const pool = dishPool.value.slice()
  const cards = []
  for (let i = 0; i < 4; i++) {
    if (!pool.length) break
    const j = Math.floor(Math.random() * pool.length)
    cards.push(pool.splice(j, 1)[0])
  }
  while (cards.length < 4) cards.push({ id: 'pad' + cards.length, name: '神秘菜', category: '待解锁', how: [], staples: [], tastes: [], pad: true })
  flipCards.value = cards
}

function flipCard(i) {
  const c = flipCards.value[i]
  if (!c || flipRevealed.value !== null) return
  if (c.pad) { toast('这张牌还没菜，选别的试试'); return }
  flipRevealed.value = i
  state.recommendResult = c
  resultConfirmed.value = false
}

function switchMode(k) {
  if (mode.value === k) return
  setRecommendMode(k)
  state.recommendResult = null
  resultConfirmed.value = false
  flipRevealed.value = null
  drawing.value = false
  if (k === 'wheel') nextTick(drawWheel)
  else if (k === 'flip') generateFlips()
}

function moduleSpin(kind) {
  const v = spinModule(kind)
  if (v) toast('已为你选择：' + v)
}

function confirmDish(food) {
  if (!food || food.pad) return
  const added = addToMenu(food)
  markFood(food.id, 'eaten')
  addHistory(food)
  saveToCloud()
  toast(added ? '已加入菜单 🍚' : '这道菜已在菜单里')
}

function chooseIt() {
  if (!recommendResult.value) return
  confirmDish(recommendResult.value)
  resultConfirmed.value = true
}

function autoReplay() {
  state.recommendResult = null
  resultConfirmed.value = false
  if (mode.value === 'wheel') {
    state.recommendSpinning = true
    clearHeroAnim()
    runHeroAnim()
  } else if (mode.value === 'draw') {
    toggleDraw()
  } else {
    generateFlips()
  }
}

function addAndRespin() {
  if (!recommendResult.value) return
  confirmDish(recommendResult.value)
  autoReplay()
}

function recomposeAction() {
  recomposeDishPool()
  toast('已重组转盘，换了几道菜')
  autoReplay()
}

function openRecipe(m) {
  const full = findFood(m.id) || m
  recipeFood.value = full
  recipeVisible.value = true
}
function closeRecipe() { recipeVisible.value = false }

function incLimit() { setPoolLimit(state.poolLimit + 5) }
function decLimit() { setPoolLimit(Math.max(3, state.poolLimit - 5)) }
function onLimitBlur(e) { setPoolLimit(e.detail.value) }

function toggleStaple(t) { toggleFilter('staple', t) }
function toggleTaste(t) { toggleFilter('taste', t) }
function clearPurpose() { setPurpose([]) }
function clearCuisine() { setCuisine([]) }
function clearStaples() { setStaples([]) }
function clearTastes() { setTastes([]) }

function removeMenu(id) {
  removeFromMenu(id)
  toast('已从菜单移除')
  saveToCloud()
}

function openVip() { vipVisible.value = true; vipFocus.value = true }
function closeVip() { vipVisible.value = false; vipFocus.value = false }
async function redeem() {
  const code = vipCode.value.trim()
  if (!code) { toast('请输入兑换码'); return }
  vipBusy.value = true
  try {
    await callApi('redeemVip', { code })
    await refreshVip()
    vipCode.value = ''
    vipVisible.value = false
    toast('兑换成功，已升级 VIP')
  } catch (e) {
    toast((e && e.message) || '兑换码无效')
  } finally {
    vipBusy.value = false
  }
}

function tryGeo() {
  if (typeof uni.getLocation !== 'function') return
  uni.getLocation({
    type: 'wgs84',
    success: (res) => {
      const city = res && res.address && res.address.city
      geoHint.value = city ? '定位 · ' + city : ''
    },
    fail: () => {}
  })
}

onUnmounted(() => { clearHeroAnim() })

onMounted(() => {
  initStore()
  if (!state.dishPool.length) resetDishPool()
  const first = pickRecommend(state.dishPool)
  state.recommendResult = first || null
  resultConfirmed.value = false
  if (mode.value === 'flip') generateFlips()
  else if (mode.value === 'wheel') nextTick(drawWheel)
  tryGeo()
})

watch(dishPool, () => {
  if (mode.value === 'wheel') drawWheel()
  else if (mode.value === 'flip') generateFlips()
})
watch(mode, (m) => { if (m === 'wheel') nextTick(drawWheel) })
</script>
<style>
.page { min-height: 100vh; background: var(--bg); padding: 16px 14px 30px; box-sizing: border-box; }
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.brand { display: flex; align-items: center; gap: 10px; }
.logo { font-size: 32px; }
.brand-title { font-size: 22px; font-weight: 800; color: #2d2a26; display: block; line-height: 1.1; }
.brand-sub { font-size: 12px; color: #9a8f83; display: block; }
.vip-pill { border: 1px solid #f0d6a0; background: #fff8e8; color: #d48806; font-size: 13px; font-weight: 700; border-radius: 999px; padding: 7px 14px; line-height: 1; }
.vip-pill.on { border-color: #ffcf00; background: #fffbe6; color: #b8860b; }

.card { background: #fff; border-radius: 18px; padding: 16px; margin-bottom: 14px; box-shadow: 0 4px 18px rgba(160, 120, 70, 0.06); }

.hero { border: 1px solid #ffe1cf; background: linear-gradient(180deg, #fff 0%, #fff6ee 100%); }
.hero-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.hero-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.mode-tabs { display: flex; gap: 4px; background: #f4ece3; border-radius: 999px; padding: 3px; }
.mode-tab { font-size: 12px; color: #8a7b6c; padding: 5px 10px; border-radius: 999px; }
.mode-tab.active { background: var(--accent); color: #fff; font-weight: 700; }

.hero-wheel-wrap { position: relative; display: flex; justify-content: center; padding: 8px 0 6px; }
.hero-wheel { border-radius: 50%; box-shadow: 0 6px 20px rgba(255, 107, 53, 0.18); }
.hero-wheel-pulse { position: absolute; top: 50%; left: 50%; width: 60px; height: 60px; margin: -30px 0 0 -30px; border: 2px solid var(--accent); border-radius: 50%; opacity: 0; pointer-events: none; }
.hero-wheel-pulse.spin { animation: pulse 1.2s ease-out infinite; }
@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
.wheel-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: #fff; border-radius: 999px; padding: 12px 8px; box-shadow: 0 3px 10px rgba(0,0,0,0.15); z-index: 2; min-width: 88px; }
.wheel-center-main { font-size: 15px; font-weight: 800; color: var(--accent); display: block; }
.wheel-center-sub { font-size: 10px; color: #b0a49a; display: block; }

.hero-draw { display: flex; flex-direction: column; align-items: center; padding: 22px 0 14px; }
.qiantong { position: relative; width: 110px; height: 150px; }
.qian { position: absolute; bottom: 6px; width: 26px; height: 96px; background: linear-gradient(#f7d8a0, #e6b36a); border-radius: 8px 8px 4px 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.12); border: 1px solid #d9a858; }
.qian-word { position: absolute; top: 60px; left: 0; right: 0; text-align: center; font-size: 16px; color: #a5531d; font-weight: 700; }
.qian.m { background: linear-gradient(#d88b3a, #b16a24); width: 46px; height: 42px; border-radius: 10px 10px 26px 26px; bottom: 4px; left: 32px; display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; color: #fff; font-size: 15px; font-weight: 800; }
.qian.m.out { animation: drawUp 0.9s ease; }
@keyframes drawUp { 0% { transform: translateY(0) rotate(0); } 40% { transform: translateY(-46px) rotate(-10deg); } 100% { transform: translateY(0) rotate(0); } }
.qiantong.shake { animation: shake 0.4s ease; }
@keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.hero-btn-sub { margin-top: 12px; font-size: 13px; color: #9a8f83; text-align: center; }

.hero-flip { padding: 14px 0 6px; }
.flip-grid { display: flex; gap: 10px; justify-content: center; }
.flip-card { width: 78px; height: 108px; perspective: 800px; }
.flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.5s; transform-style: preserve-3d; }
.flip-card.revealed .flip-inner { transform: rotateY(180deg); }
.flip-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 3px 10px rgba(0,0,0,0.1); }
.flip-face.back { background: linear-gradient(150deg, #f5c77a, #e08a3c); color: #fff; }
.flip-back-mark { font-size: 30px; font-weight: 800; }
.flip-back-txt { font-size: 11px; margin-top: 4px; opacity: 0.85; }
.flip-face.front { background: #fff; border: 1px solid #ffd7c2; transform: rotateY(180deg); }
.flip-name { font-size: 13px; font-weight: 800; color: var(--accent); text-align: center; padding: 0 4px; }
.flip-cat { font-size: 10px; color: #b0a49a; margin-top: 4px; }

.hero-result { margin-top: 14px; border-top: 1px dashed #eedecf; padding-top: 12px; }
.hero-result-badge { font-size: 13px; font-weight: 800; color: var(--accent); text-align: center; display: block; }
.hero-result.confirmed .hero-result-badge { color: #1a9e5c; }
.hero-result-name { font-size: 26px; font-weight: 800; color: #2d2a26; text-align: center; display: block; margin: 8px 0; }
.tags { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; }
.tag { background: #f2ece4; border-radius: 999px; padding: 3px 10px; font-size: 12px; color: #6b5d4e; }
.tag.alt { background: var(--accent-soft); color: var(--accent); }
.tag.cat { background: #e8f4ff; color: #2f8dd0; }
.note { font-size: 13px; color: #9a8f83; text-align: center; display: block; margin: 8px 0; }
.action-row { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }

.pool-limit { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; }
.pool-limit-label { font-size: 12px; color: #9a8f83; }
.limit-btn { width: 34px; height: 34px; border-radius: 50%; border: 1px solid #e6d8c8; background: #fff; font-size: 18px; color: var(--accent); line-height: 1; padding: 0; }
.limit-input { width: 54px; height: 34px; text-align: center; border: 1px solid #e6d8c8; border-radius: 8px; font-size: 15px; font-weight: 700; color: #2d2a26; }

.filter-card { }
.filter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.filter-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.req { font-size: 10px; color: #fff; background: var(--accent); border-radius: 999px; padding: 2px 6px; margin-left: 6px; vertical-align: middle; }
.opt { font-size: 10px; color: #d48806; background: #fff3d6; border-radius: 999px; padding: 2px 6px; margin-left: 6px; vertical-align: middle; }
.spin-mini { border: 1px solid #ffd7c2; background: #fff; color: var(--accent); font-size: 12px; border-radius: 999px; padding: 6px 11px; line-height: 1; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid #e6d8c8; background: #fff; border-radius: 999px; padding: 7px 14px; font-size: 13px; color: #6b5d4e; }
.chip.active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.hint { font-size: 12px; color: #b0a49a; margin-top: 8px; display: block; }

.section-head { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.muted { font-size: 12px; color: #b0a49a; }
.empty { color: #b0a49a; padding: 14px 0; text-align: center; font-size: 13px; }
.menu-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f4ece3; }
.menu-main { flex: 1; padding-right: 8px; }
.food-name { font-size: 15px; font-weight: 700; color: #2d2a26; display: block; }
.food-meta { font-size: 12px; color: #9a8f83; display: block; margin-top: 2px; }
.food-actions { display: flex; gap: 6px; }

.btn { border-radius: 999px; font-size: 14px; padding: 9px 16px; border: none; line-height: 1; transition: transform 0.1s; }
.btn:active { transform: scale(0.96); }
.btn.primary { background: linear-gradient(150deg, #ff8a50, var(--accent)); color: #fff; box-shadow: 0 4px 12px rgba(255,107,53,0.3); }
.btn.ghost { background: #fff; border: 1px solid #e6d8c8; color: #6b5d4e; }
.btn.small { font-size: 12px; padding: 6px 10px; }
.btn.big { padding: 10px 14px; font-size: 13px; }
.btn.danger { color: #e74c3c; border-color: #f3c0bb; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #fff; border-radius: 18px; padding: 20px; width: 100%; max-width: 400px; position: relative; max-height: 85vh; overflow-y: auto; }
.modal-close { position: absolute; top: 10px; right: 12px; background: #f0ece7; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; color: #6b5d4e; line-height: 1; }
.modal-title { font-size: 18px; font-weight: 800; display: block; margin-bottom: 12px; color: #2d2a26; }
.field { margin-bottom: 12px; }
.field-label { font-size: 13px; color: #8a7b6c; display: block; margin-bottom: 4px; }
.input { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; width: 100%; box-sizing: border-box; }
.recipe-block { border-top: 1px solid #f4ece3; padding-top: 10px; margin-top: 8px; }
.recipe-title { font-size: 14px; font-weight: 700; display: block; margin-bottom: 6px; color: #2d2a26; }
.recipe-step { font-size: 14px; color: #6b5d4e; line-height: 1.8; display: block; }
.guide { background: #f0f8ff; border-radius: 12px; padding: 12px; font-size: 14px; color: #3b6a8a; margin: 8px 0; }
.vip-status { border: 1px solid #f0d6a0; background: #fff8e8; border-radius: 14px; padding: 14px; margin-bottom: 12px; }
.vip-status.on { border-color: #ffcf00; background: #fffbe6; }
.vip-badge { font-size: 18px; font-weight: 800; color: #d48806; display: block; }
.vip-expire { font-size: 13px; color: #9a8f83; display: block; margin-top: 4px; }
.vip-input { font-size: 16px; min-height: 44px; padding: 12px; box-sizing: border-box; }
.toast { position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%); background: rgba(0,0,0,0.82); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 14px; opacity: 0; transition: opacity 0.2s; z-index: 200; pointer-events: none; max-width: 80vw; text-align: center; }
.toast.show { opacity: 1; }
</style>




