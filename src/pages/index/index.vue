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
      <button class="vip-pill" :class="{ on: isVip() }" @tap="openVipSheet">{{ isVip() ? '👑 VIP' : '💎 开通VIP' }}</button>
    </view>

    <!-- 推荐玩法 -->
    <view class="card hero">
      <view class="hero-top">
        <text class="hero-title">今日推荐</text>
        <view class="mode-tabs">
          <view v-for="k in homeModes" :key="k" class="mode-tab" :class="{ active: mode === k, locked: isModeVip(k) && !isVip() }" @tap="switchMode(k)">{{ (modeByKey(k) || {}).icon }} {{ (modeByKey(k) || {}).label }}{{ isModeVip(k) && !isVip() ? ' 🔒' : '' }}</view>
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
      <view v-else-if="mode === 'draw'" class="hero-draw" @tap="toggleDraw" :style="{ '--sk-bg': (skin && skin.bg) || '#f6d9a0', '--sk-ink': (skin && skin.ink) || '#4a2f1b' }">
        <view class="qiantong" :class="{ shake: drawing }">
          <view class="qian" v-for="i in 4" :key="'q'+i" :style="{ transform: 'rotate(' + ((i - 2.5) * 8) + 'deg)' }">
            <text class="qian-word">吃</text>
          </view>
          <view class="qian m" :class="{ out: drawing }">「食」</view>
        </view>
        <text class="hero-btn-sub">{{ drawing ? '抽签中…' : '点一下抽一签' }}</text>
      </view>

      <!-- 掷骰 -->
      <view v-else-if="mode === 'dice'" class="hero-dice" @tap="toggleDice" :style="{ '--sk-dbg': (skin && skin.bg) || '#fff', '--sk-dfg': (skin && skin.fg) || '#333' }">
        <view class="dice-face" :class="{ rolling: drawing }"><text class="dice-dot">{{ diceFace }}</text></view>
        <text class="hero-btn-sub">{{ drawing ? '掷骰中…' : '点一下掷骰子' }}</text>
      </view>

      <!-- 转蛋 -->
      <view v-else-if="mode === 'capsule'" class="hero-capsule" @tap="toggleCapsule" :style="{ '--sk-cbg': (skin && skin.bg) || '#ff8a66', '--sk-cball': (skin && skin.ball) || '#ffd54f' }">
        <view class="capsule-machine"><view class="capsule-ball" :class="{ drop: drawing }"></view></view>
        <text class="hero-btn-sub">{{ drawing ? '掉蛋中…' : '点一下扭蛋' }}</text>
      </view>

      <!-- 飞镖 -->
      <view v-else-if="mode === 'dart'" class="hero-dart" @tap="toggleDart" :style="{ '--sk-tbg': (skin && skin.bg) || '#c0392b', '--sk-tring': (skin && skin.ring) || '#f1c40f' }">
        <view class="dart-target" :class="{ throb: drawing }">
          <view class="dart-ring r1"></view>
          <view class="dart-ring r2"></view>
          <view class="dart-ring r3"></view>
          <view class="dart-bull"><text class="dart-bull-txt">{{ drawing ? '…' : '🎯' }}</text></view>
          <view class="dart-throw" :class="{ out: drawing }">🗡</view>
        </view>
        <text class="hero-btn-sub">{{ drawing ? '投掷中…' : '点一下掷飞镖' }}</text>
      </view>

      <!-- 翻牌 -->
      <view v-else-if="mode === 'flip'" class="hero-flip" :style="{ '--sk-back': (skin && skin.backBg) || '#2d2a26', '--sk-fg': (skin && skin.backFg) || '#fff' }">
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
      <view v-if="recommendResult" class="hero-result" :class="{ confirmed: resultConfirmed, pop: resultPop }">
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
          <button class="btn ghost big" @tap="addAndRespin">➕ 再转加菜</button>
          <button class="btn ghost big" @tap="recomposeAction">🔀 随机池重组</button>
        </view>
      </view>

      <!-- 随机池限量 -->
      <view class="pool-limit">
        <text class="pool-limit-label nowrap">随机池限量</text>
        <button class="limit-btn" @tap="decLimit">−</button>
        <input class="limit-input" type="number" :value="state.poolLimit" @blur="onLimitBlur" @confirm="onLimitBlur" />
        <button class="limit-btn" @tap="incLimit">＋</button>
        <text class="pool-limit-label nowrap">道 · 可抽 {{ dishPool.length }} 道</text>
      </view>
    </view>

    <!-- 筛选提示条 -->
    <view class="hint-bar">
      <text class="hint-bar-icon">🧭</text>
      <view class="hint-bar-text">
        <text class="hint-bar-title">下面按条件选，每个模块都能「转一转」</text>
        <text class="hint-bar-sub">①怎么吃必选 · 其余可选 · 转完自动填结果</text>
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
        <view class="filter-actions">
          <button class="fold-btn" @tap="toggleFold('purpose')">{{ expanded.purpose ? '▾ 收起' : '▸ 展开' }}</button>
          <button class="spin-mini" @tap="moduleSpin('purpose')">🎲 转一转</button>
        </view>
      </view>
      <view v-if="expanded.purpose" class="chips">
        <view class="chip" :class="{ active: state.selPurpose.length === 0 }" @tap="clearPurpose">不选择</view>
        <view v-for="k in PURPOSE_OPTIONS" :key="'pur'+k" class="chip" :class="{ active: state.selPurpose.includes(k) }" @tap="togglePurpose(k)">{{ k }}</view>
      </view>
    </view>

    <view class="card filter-card">
      <view class="filter-head">
        <text class="filter-title">③ 菜系 · 味道 <text class="opt">可选</text></text>
        <view class="filter-actions">
          <button class="fold-btn" @tap="toggleFold('cuisineTaste')">{{ expanded.cuisineTaste ? '▾ 收起' : '▸ 展开' }}</button>
          <button class="spin-mini" @tap="moduleSpin('cuisineTaste')">🎲 转一转</button>
        </view>
      </view>
      <view v-if="expanded.cuisineTaste" class="chips-group">
        <text class="chips-label">菜系</text>
        <view class="chips">
          <view class="chip" :class="{ active: state.selCuisine.length === 0 }" @tap="clearCuisine">不选择</view>
          <view v-for="k in CUISINE_OPTIONS" :key="'cui'+k" class="chip" :class="{ active: state.selCuisine.includes(k) }" @tap="toggleCuisine(k)">{{ k }}</view>
        </view>
        <text class="chips-label">味道</text>
        <view class="chips">
          <view class="chip" :class="{ active: state.selTastes.length === 0 }" @tap="clearTastes">不选择</view>
          <view v-for="k in TASTES" :key="'tas'+k" class="chip" :class="{ active: state.selTastes.includes(k) }" @tap="toggleTaste(k)">{{ k }}</view>
        </view>
      </view>
    </view>

    <view class="card filter-card">
      <view class="filter-head">
        <text class="filter-title">④ 主食搭配 <text class="opt">可选</text></text>
        <view class="filter-actions">
          <button class="fold-btn" @tap="toggleFold('staple')">{{ expanded.staple ? '▾ 收起' : '▸ 展开' }}</button>
          <button class="spin-mini" @tap="moduleSpin('staple')">🎲 转一转</button>
        </view>
      </view>
      <view v-if="expanded.staple" class="chips">
        <view class="chip" :class="{ active: state.selStaples.length === 0 }" @tap="clearStaples">不选择</view>
        <view v-for="k in STAPLES" :key="'sta'+k" class="chip" :class="{ active: state.selStaples.includes(k) }" @tap="toggleStaple(k)">{{ k }}</view>
      </view>
    </view>

    <!-- 今日菜单 -->
    <!-- 今日菜单（含记录） -->
    <view class="card">
      <view class="section-head">
        <text class="card-title">🍱 今日菜单</text>
        <button class="btn small ghost" @tap="clearDaily">清空</button>
      </view>
      <view class="daily-summary">
        <text v-if="state.settings.showCalories" class="daily-total">今日累计 <text class="daily-num">{{ dailyCalories }}</text> kcal</text>
        <text v-else class="daily-total">今日吃过的菜已记录</text>
      </view>
      <view v-if="!state.dailyRecords.length" class="empty">选好菜点「就它了」会自动记录到这里，看营养和卡路里</view>
      <view v-for="d in state.dailyRecords" :key="'d'+d.id+d.ts" class="menu-row">
        <view class="menu-main">
          <text class="food-name">{{ d.name }}</text>
          <text class="food-meta">{{ dailyMeta(d) }}</text>
        </view>
        <view class="food-actions">
          <button class="btn small ghost" @tap="openRecipe(findFood(d.id) || d)">🍳 菜谱</button>
          <button class="btn small ghost danger" @tap="removeDaily(d.id)">删</button>
        </view>
      </view>
    </view>

    <!-- 最近吃过 -->
    <view class="card">
      <view class="section-head">
        <text class="card-title">🕘 最近吃过</text>
        <button class="btn small ghost" @tap="confirmClearHistory">清空</button>
      </view>
      <view v-if="!recentEaten.length" class="empty">还没有记录，点「就它了」会记到这里</view>
      <view v-if="!recentEaten.length && state.history.length" class="empty">该周期内暂无记录（可调大周期）</view>
      <view class="recent-list" :class="{ grow: recentExpanded }">
        <view v-for="h in shownRecent" :key="'rh'+h.id+h.ts" class="mark-row">
          <view class="mark-dot"></view>
          <view class="mark-info">
            <text class="mark-name">{{ h.name }}</text>
            <text class="mark-small">{{ formatTime(h.ts) }}</text>
          </view>
        </view>
      </view>
      <button v-if="recentEaten.length > 5" class="btn small ghost expand-btn" @tap="recentExpanded = !recentExpanded">{{ recentExpanded ? '收起 ▲' : '查看更多 ▼' }}</button>
    </view>

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

    <!-- 欢迎/推荐弹窗 -->
    <view v-if="welcomeVisible" class="overlay popup-overlay" @tap.self="closeWelcome">
      <view class="modal welcome-modal">
        <button class="modal-close" @tap="closeWelcome">×</button>
        <text class="welcome-badge">✨ 今日推荐</text>
        <text class="welcome-name">{{ welcomeFood && welcomeFood.name }}</text>
        <view class="tags">
          <text v-for="t in (welcomeFood.staples || [])" :key="'ws'+t" class="tag">{{ t }}</text>
          <text v-for="t in (welcomeFood.tastes || [])" :key="'wt'+t" class="tag alt">{{ t }}</text>
          <text v-if="welcomeFood" class="tag cat">{{ welcomeFood.category }}</text>
        </view>
        <view v-if="state.settings.popupChips.fortune" class="popup-chip">
          <text class="popup-chip-ic">🔮</text>
          <view class="popup-chip-body"><text class="popup-chip-t">今日运势</text><text class="popup-chip-d">{{ fortuneText }}</text></view>
        </view>
        <view v-if="state.settings.popupChips.pairing && welcomeFood" class="popup-chip">
          <text class="popup-chip-ic">🍹</text>
          <view class="popup-chip-body"><text class="popup-chip-t">搭配建议</text><text class="popup-chip-d">{{ pairingText }}</text></view>
        </view>
        <view v-if="state.settings.popupChips.tips" class="popup-chip">
          <text class="popup-chip-ic">💚</text>
          <view class="popup-chip-body"><text class="popup-chip-t">健康小贴士</text><text class="popup-chip-d">{{ healthTipText }}</text></view>
        </view>
        <text v-if="state.settings.showCalories && welcomeFood && welcomeFood.calories" class="fortune-sub">{{ welcomeFood.calories }} kcal · {{ welcomeFood.nutrition }}</text>
        <view class="welcome-actions">
          <button class="btn primary big" @tap="startAdventure">🎡 就它了</button>
          <button class="btn ghost" @tap="goMine">⚙️ 个性化</button>
        </view>
      </view>
    </view>

    <!-- VIP 特权面板 -->
    <view v-if="vipSheetVisible" class="overlay" @tap.self="closeVipSheet">
      <view class="modal">
        <button class="modal-close" @tap="closeVipSheet">×</button>
        <text class="modal-title">👑 VIP 特权</text>
        <view v-for="pp in VIP_PERKS" :key="pp.t" class="vip-perk">
          <text class="vip-perk-icon">{{ pp.i }}</text>
          <view class="vip-perk-body">
            <text class="vip-perk-t">{{ pp.t }}</text>
            <text class="vip-perk-d">{{ pp.d }}</text>
          </view>
        </view>
        <view class="guide"><text>更多功能与样式，可到「我的 → 个性化」解锁。</text></view>
        <button class="btn primary" @tap="goMine">去「我的 · 个性化」</button>
        <button class="btn ghost" @tap="openVip" v-if="!isVip()">兑换码开通</button>
      </view>
    </view>

    <view class="toast" :class="{ show: toastShow }">{{ toastMsg }}</view>
  </view>
</template>
<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, watch, getCurrentInstance, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  state, STAPLES, TASTES, HOW_OPTIONS, PURPOSE_OPTIONS,
  CUISINE_OPTIONS, RECOMMEND_MODES, WHEEL_COLORS, getModeSkin,
  initStore, setHowToEat, togglePurpose, toggleCuisine, toggleFilter,
  setPurpose, setCuisine, setStaples, setTastes, spinModule,
  setPoolLimit, setRecommendMode, pickRecommend, resultFromAngle,
  addToMenu, removeFromMenu, recomposeDishPool, resetDishPool, markFood,
  addHistory, isVip, findFood, addDailyRecord, clearDailyRecords,
  removeDailyRecord, todayCalories, isModeVip, poolState, clearHistory
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
let welcomeAutoShown = false
const resultConfirmed = ref(false)
const drawing = ref(false)
const flipCards = ref([])
const flipRevealed = ref(null)
const geoHint = ref('')
const recentExpanded = ref(false)
const vipSheetVisible = ref(false)
const welcomeVisible = ref(false)
const welcomeFood = ref(null)
const fortuneText = ref('')
const resultPop = ref(false)
const diceFace = ref('🎯')

const VIP_PERKS = [
  { i: '🧩', t: '弹窗显示控制', d: '自由增删欢迎弹窗里的搭配建议、健康小贴士等模块' },
  { i: '🎮', t: '额外抽取玩法', d: '解锁掷骰子、扭蛋，惊喜感更强' },
  { i: '🔁', t: '主页玩法替换', d: '把首页三个玩法之一换成 VIP 专属玩法' }
]

let toastTimer = null
let heroAnimId = null

const mode = computed(() => state.recommendMode)
const heroSpinning = computed(() => state.recommendSpinning)
const recommendResult = computed(() => state.recommendResult)
const dishPool = computed(() => state.dishPool)
const dailyCalories = computed(() => todayCalories.value)
const homeModes = computed(() => state.settings.homeModes || ['wheel', 'draw', 'flip'])
function modeByKey(k) { return RECOMMEND_MODES.find(m => m.key === k) }
const skin = computed(() => getModeSkin(mode.value))
const MS = { 天: 86400000, 周: 7 * 86400000, 月: 30 * 86400000 }
const expanded = reactive({ purpose: false, cuisineTaste: false, staple: false })
function toggleFold(k) { expanded[k] = !expanded[k] }
const recentEaten = computed(() => {
  const ms = MS[state.settings.memoryUnit || '天'] || 86400000
  const windowMs = (state.settings.memoryValue || 3) * ms
  const cutoff = Date.now() - windowMs
  return state.history.filter(h => h.ts >= cutoff)
})
const shownRecent = computed(() => recentExpanded.value ? recentEaten.value : recentEaten.value.slice(0, 5))
const pairingText = ref('')
const healthTipText = ref('')

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
  const skinWheel = getModeSkin('wheel')
  const colors = (skinWheel && skinWheel.colors) || WHEEL_COLORS
  for (let i = 0; i < n; i++) {
    const a = state.wheelAngle + i * slice
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, a, a + slice)
    ctx.closePath()
    ctx.setFillStyle(colors[i % colors.length])
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

function toggleDice() {
  if (drawing.value) return
  if (!dishPool.value.length) { toast('没有符合条件的菜，先放宽筛选'); return }
  drawing.value = true
  diceFace.value = '🎲'
  state.recommendResult = null
  resultConfirmed.value = false
  setTimeout(() => {
    drawing.value = false
    diceFace.value = '🎯'
    state.recommendResult = pickRecommend(dishPool.value)
  }, 800)
}

function toggleCapsule() {
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

function toggleDart() {
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

function switchMode(k) {
  if (k !== mode.value && isModeVip(k) && !isVip()) { toast('VIP 专属玩法，开通后可切换'); openVipSheet(); return }
  if (mode.value === k) return
  setRecommendMode(k)
  state.recommendResult = null
  resultConfirmed.value = false
  flipRevealed.value = null
  drawing.value = false
  if (k === 'wheel') nextTick(drawWheel)
  else if (k === 'flip') generateFlips()
  else if (k === 'dice') { diceFace.value = '🎲' }
  else if (k === 'capsule') { drawing.value = false }
  else if (k === 'dart') { drawing.value = false }
}

function moduleSpin(kind) {
  if (kind === 'cuisineTaste') {
    const pickCuisine = Math.random() < 0.5
    const v = pickCuisine ? spinModule('cuisine') : spinModule('taste')
    if (v) toast(pickCuisine ? '已为你选菜系：' + v : '已为你选味道：' + v)
    return
  }
  const v = spinModule(kind)
  if (v) toast('已为你选择：' + v)
}

function confirmDish(food) {
  if (!food || food.pad) return
  const added = addToMenu(food)
  markFood(food.id, 'eaten')
  addHistory(food)
  addDailyRecord(food)
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
  } else if (mode.value === 'dice') {
    toggleDice()
  } else if (mode.value === 'capsule') {
    toggleCapsule()
  } else if (mode.value === 'dart') {
    toggleDart()
  } else {
    generateFlips()
  }
}

function addAndRespin() {
  if (!recommendResult.value) return
  confirmDish(recommendResult.value)
  resetDishPool()
  autoReplay()
}

function recomposeAction() {
  recomposeDishPool()
  toast('已重组转盘，换了几道菜')
  autoReplay()
}

function openRecipe(m) {
  const full = findFood(m.id) || m
  poolState.tab = 'all'
  poolState.expandId = full.id
  poolState.search = ''
  recipeVisible.value = false
  uni.switchTab({ url: '/pages/pool/pool' })
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

function openVipSheet() { vipSheetVisible.value = true }
function closeVipSheet() { vipSheetVisible.value = false }
function showWelcome() {
  if (!state.settings.showWelcomePopup) return
  if (!state.dishPool || !state.dishPool.length) resetDishPool()
  const food = pickRecommend(state.dishPool)
  if (!food) return
  const cycle = state.settings.welcomeCycle || 'daily'
  if (cycle === 'daily') {
    const today = new Date().toDateString()
    let last = ''
    try { last = uni.getStorageSync('eatpick_welcome_last') || '' } catch (e) {}
    if (last === today) return
    try { uni.setStorageSync('eatpick_welcome_last', today) } catch (e) {}
  } else {
    if (welcomeAutoShown) return
  }
  welcomeFood.value = food
  fortuneText.value = getFortune()
  pairingText.value = getPairing(food)
  healthTipText.value = getHealthTip()
  welcomeAutoShown = true
  setTimeout(() => { welcomeVisible.value = true }, 300)
}
function getFortune() {
  const list = ['好运连连，今天想吃啥都香！','宜吃清淡，肠胃更舒服。','适合吃点辣，开胃又解腻。','多吃蛋白质，元气一整天。','今天适合尝鲜，来道新口味。','注意饮食均衡，别贪凉。']
  return list[Math.floor(Math.random() * list.length)]
}
const PAIRING_MAP = {
  '肉菜': '配一杯柠檬水或冰红茶，清爽解腻',
  '素菜': '配一杯豆浆或绿茶，清淡爽口',
  '主食': '配一小份凉拌菜或酸梅汤，开胃又顶饱',
  '汤羹': '配两个小笼包或烧饼，暖胃更管饱',
  '小吃': '配一杯柠檬茶，解馋不腻',
  '甜品': '配一杯温水或热茶，中和甜味更舒服'
}
function getPairing(f) {
  if (!f) return '配一杯温水，慢慢吃更舒服'
  return PAIRING_MAP[f.category] || '配一杯温水或清茶，慢慢吃更舒服'
}
const HEALTH_TIPS = ['少油少盐更健康，每天盐别超5g。','饭前一小碗汤，能帮你少吃半碗饭。','每口咀嚼20次，给大脑时间喊停。','饭后别立即午睡，散散步更助消化。','多喝温水少喝冰饮，肠胃更舒服。','睡前2小时别吃太饱，睡眠更安稳。']
function getHealthTip() { return HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)] }
function closeWelcome() { welcomeVisible.value = false }
function startAdventure() {
  welcomeVisible.value = false
  const f = welcomeFood.value
  if (f) { confirmDish(f); return }
  if (mode.value === 'wheel') toggleWheel()
  else if (mode.value === 'draw') toggleDraw()
  else if (mode.value === 'dice') toggleDice()
  else if (mode.value === 'capsule') toggleCapsule()
  else if (mode.value === 'dart') toggleDart()
  else flipCard(0)
}
function goMine() {
  welcomeVisible.value = false
  vipSheetVisible.value = false
  uni.switchTab({ url: '/pages/mine/mine' })
}
function clearDaily() {
  uni.showModal({
    title: '提示', content: '确定清空今日记录吗？',
    success: (res) => {
      if (res.confirm) { clearDailyRecords(); toast('已清空'); saveToCloud() }
    }
  })
}
  function removeDaily(id) { removeDailyRecord(id); toast('已移除'); saveToCloud() }
  function dailyMeta(d) {
  let s = ''
  if (d.nutrition) s += d.nutrition
  if (state.settings.showCalories && d.calories) s += (s ? ' · ' : '') + d.calories + ' kcal'
  if (!s && state.settings.showCalories) s = '热量暂缺'
  return s
}

function confirmClearHistory() {
  uni.showModal({
    title: '提示', content: '确定清空「最近吃过」记录吗？',
    success: (res) => { if (res.confirm) { clearHistory(); toast('已清空'); saveToCloud() } }
  })
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return d.getFullYear() + '-' + mm + '-' + dd + ' ' + hh + ':' + mi
}

function removeMenu(id) {
  removeFromMenu(id)
  toast('已从菜单移除')
  saveToCloud()
}

function openVip() { vipSheetVisible.value = false; vipVisible.value = true; vipFocus.value = true }
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

onShow(() => {
  if ((state.settings.welcomeCycle || 'daily') === 'each') welcomeAutoShown = false
  showWelcome()
  if (mode.value === 'wheel' && !state.recommendSpinning) nextTick(drawWheel)
})

onMounted(() => {
  initStore()
  if (!state.dishPool.length) resetDishPool()
  const first = pickRecommend(state.dishPool)
  state.recommendResult = first || null
  resultConfirmed.value = false
  if (mode.value === 'flip') generateFlips()
  else if (mode.value === 'wheel') nextTick(drawWheel)
  tryGeo()
  showWelcome()
})

watch(dishPool, () => {
  if (mode.value === 'wheel') drawWheel()
  else if (mode.value === 'flip') generateFlips()
})
watch(mode, (m) => { if (m === 'wheel') nextTick(drawWheel) })
watch(() => state.theme, () => { if (mode.value === 'wheel') nextTick(drawWheel) })
watch(() => state.settings.homeModes, (modes) => {
  const list = modes && modes.length ? modes : ['wheel', 'draw', 'flip']
  if (!list.includes(mode.value)) {
    setRecommendMode(list[0])
    state.recommendResult = null
    resultConfirmed.value = false
    flipRevealed.value = null
    if (list[0] === 'wheel') nextTick(drawWheel)
  }
})
watch(recommendResult, (val) => {
  if (val) { resultPop.value = false; nextTick(() => { resultPop.value = true }) }
})
</script>
<style>
.page { min-height: 100vh; background: var(--bg); padding: 16px 14px 30px; box-sizing: border-box; }
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.brand { display: flex; align-items: center; gap: 10px; }
.logo { font-size: 32px; }
.brand-title { font-size: 22px; font-weight: 800; color: #2d2a26; display: block; line-height: 1.1; }
.brand-sub { font-size: 12px; color: #9a8f83; display: block; }
.vip-pill { margin: 0; flex-shrink: 0; border: none; background: linear-gradient(150deg,#ffd766,#ffb300); color: #7a4a00; font-size: 13px; font-weight: 800; border-radius: 999px; padding: 8px 16px; line-height: 1; box-shadow: 0 4px 12px rgba(255,179,0,0.35); }
.vip-pill.on { background: linear-gradient(150deg,#ffb300,#ff8a00); color: #3b2a00; box-shadow: 0 4px 16px rgba(255,138,0,0.4); }

.card { background: #fff; border-radius: 18px; padding: 16px; margin-bottom: 14px; box-shadow: 0 4px 18px rgba(160, 120, 70, 0.06); }

.hero { border: 1px solid #ffe1cf; background: linear-gradient(180deg, #fff 0%, #fff6ee 100%); }
.hero-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.hero-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.mode-tabs { display: flex; gap: 3px; background: #f4ece3; border-radius: 999px; padding: 3px; }
.mode-tab { font-size: 12px; color: #8a7b6c; padding: 5px 11px; border-radius: 999px; white-space: nowrap; }
.mode-tab.active { background: var(--accent); color: #fff; font-weight: 700; }
.mode-tab.locked { opacity: 0.55; }

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
.qian { position: absolute; bottom: 6px; width: 26px; height: 96px; background: linear-gradient(var(--sk-bg, #f7d8a0), var(--sk-bg, #e6b36a)); border-radius: 8px 8px 4px 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.12); border: 1px solid var(--sk-ink, #d9a858); }
.qian-word { position: absolute; top: 60px; left: 0; right: 0; text-align: center; font-size: 16px; color: var(--sk-ink, #a5531d); font-weight: 700; }
.qian.m { background: linear-gradient(var(--sk-bg, #d88b3a), var(--sk-ink, #b16a24)); width: 46px; height: 42px; border-radius: 10px 10px 26px 26px; bottom: 4px; left: 32px; display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; color: #fff; font-size: 15px; font-weight: 800; }
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
.flip-face.back { background: var(--sk-back, #e08a3c); color: var(--sk-fg, #fff); }
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
.action-row { display: flex; gap: 8px; justify-content: center; margin-top: 14px; padding-top: 14px; border-top: 1px solid #f0e2d3; }
.action-row .btn { flex: 1; min-width: 0; }

.pool-limit { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 14px; padding: 6px 4px 0; }
.pool-limit-label { font-size: 12px; color: #9a8f83; }
.limit-btn { width: 34px; height: 34px; border-radius: 50%; border: 1px solid #e6d8c8; background: #fff; font-size: 18px; color: var(--accent); line-height: 1; padding: 0; }
.limit-input { width: 54px; height: 34px; text-align: center; border: 1px solid #e6d8c8; border-radius: 8px; font-size: 15px; font-weight: 700; color: #2d2a26; }

.filter-card { }
.filter-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.filter-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.req { font-size: 10px; color: #fff; background: var(--accent); border-radius: 999px; padding: 2px 6px; margin-left: 6px; vertical-align: middle; }
.opt { font-size: 10px; color: #d48806; background: #fff3d6; border-radius: 999px; padding: 2px 6px; margin-left: 6px; vertical-align: middle; }
.spin-mini { margin: 0 0 0 auto; flex-shrink: 0; border: 1px solid #ffd7c2; background: #fff; color: var(--accent); font-size: 12px; border-radius: 999px; padding: 6px 11px; line-height: 1; }
.filter-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
.fold-btn { border: 1px solid #e6d8c8; background: #f7f1ea; color: #8a7b6c; font-size: 12px; border-radius: 999px; padding: 6px 11px; line-height: 1; flex-shrink: 0; white-space: nowrap; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chips-group { margin-top: 2px; }
.chips-label { font-size: 12px; color: #b0a49a; display: block; margin: 10px 0 6px; font-weight: 700; }
.chip { border: 1px solid #e6d8c8; background: #fff; border-radius: 999px; padding: 7px 14px; font-size: 13px; color: #6b5d4e; }
.chip.active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.hint { font-size: 12px; color: #b0a49a; margin-top: 8px; display: block; }

.section-head { display: flex; justify-content: space-between; align-items: center; }
.field-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.picker-input { border: 1px solid #e6d8c8; border-radius: 12px; padding: 12px 14px; font-size: 16px; width: 100px; height: 46px; box-sizing: border-box; color: #2d2a26; background: #fff; box-shadow: 0 2px 8px rgba(160,120,70,0.06); }
.picker { border: 1px solid #e6d8c8; border-radius: 12px; padding: 12px 14px; font-size: 16px; color: #2d2a26; background: #fff; box-shadow: 0 2px 8px rgba(160,120,70,0.06); }
.card-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.muted { font-size: 12px; color: #b0a49a; }
.empty { color: #b0a49a; padding: 14px 0; text-align: center; font-size: 13px; }
.mark-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f4ece3; }
.mark-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); margin-right: 10px; flex-shrink: 0; }
.mark-info { flex: 1; }
.mark-name { font-size: 14px; font-weight: 600; color: #2d2a26; display: block; }
.mark-small { font-size: 12px; color: #9a8f83; display: block; }
.recent-list { max-height: 236px; overflow: hidden; }
.recent-list.grow { max-height: none; }
.expand-btn { display: block; margin: 10px auto 0; text-align: center; }
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
.btn.big { padding: 11px 6px; font-size: 14px; min-height: 44px; white-space: nowrap; }
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
.hint-bar { display: flex; align-items: center; gap: 10px; background: linear-gradient(120deg, var(--accent-soft), #fff); border: 1px solid #f2e4d6; border-radius: 14px; padding: 12px 14px; margin-bottom: 14px; }
.hint-bar-icon { font-size: 22px; }
.hint-bar-title { font-size: 14px; font-weight: 700; color: #2d2a26; display: block; }
.hint-bar-sub { font-size: 12px; color: #9a8f83; display: block; margin-top: 2px; }
.mode-tab.locked { opacity: 0.55; }

.hero-dice { display: flex; flex-direction: column; align-items: center; padding: 26px 0 14px; }
.dice-face { width: 90px; height: 90px; border-radius: 18px; background: var(--sk-dbg, #fff); border: 2px solid #eee; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 16px rgba(160,120,70,0.12); }
.dice-face.rolling { animation: diceToss .8s ease; }
@keyframes diceToss { 0%{transform:translateY(0) rotate(0);} 30%{transform:translateY(-18px) rotate(120deg);} 60%{transform:translateY(0) rotate(240deg);} 100%{transform:translateY(0) rotate(360deg);} }
.dice-dot { font-size: 44px; color: var(--sk-dfg, #333); }

.hero-capsule { display: flex; flex-direction: column; align-items: center; padding: 22px 0 12px; }
.capsule-machine { width: 110px; height: 130px; background: linear-gradient(var(--sk-cbg, #ff8a66), var(--sk-cbg, #ff6b35)); border-radius: 16px 16px 22px 22px; position: relative; box-shadow: 0 6px 16px rgba(255,107,53,0.2); }
.capsule-ball { width: 54px; height: 54px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, var(--sk-cball, #ffe6b3), var(--sk-cball, #ffb347)); position: absolute; left: 50%; bottom: -12px; margin-left: -27px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
.capsule-ball.drop { animation: ballDrop .9s ease; }
@keyframes ballDrop { 0%{transform:translateY(-70px);opacity:0;} 40%{transform:translateY(0);opacity:1;} 70%{transform:translateY(-18px);} 100%{transform:translateY(0);} }

.hero-dart { display: flex; flex-direction: column; align-items: center; padding: 20px 0 12px; }
.dart-target { position: relative; width: 130px; height: 130px; border-radius: 50%; background: radial-gradient(circle at 50% 50%, var(--sk-tbg, #c0392b) 0%, #fff 95%); border: 6px solid var(--sk-tring, #f1c40f); box-shadow: 0 6px 16px rgba(0,0,0,0.16); display: flex; align-items: center; justify-content: center; }
.dart-target.throb { animation: dartThrob .6s ease; }
@keyframes dartThrob { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
.dart-ring { position: absolute; border-radius: 50%; border: 3px solid rgba(255,255,255,0.75); }
.dart-ring.r1 { width: 92px; height: 92px; }
.dart-ring.r2 { width: 56px; height: 56px; }
.dart-ring.r3 { width: 22px; height: 22px; border-color: rgba(255,255,255,0.95); }
.dart-bull { width: 34px; height: 34px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.2); z-index: 2; }
.dart-bull-txt { font-size: 18px; }
.dart-throw { position: absolute; top: 50%; left: 50%; margin: -20px 0 0 -20px; font-size: 34px; opacity: 0; transform: translate(-50%, -50%); z-index: 3; }
.dart-throw.out { animation: dartFly .9s ease; opacity: 1; }
@keyframes dartFly { 0% { transform: translate(-50%, -50%) scale(.4); opacity: 0; } 40% { transform: translate(-50%, -120%) scale(1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; } }

.hero-result.pop { animation: popIn .5s cubic-bezier(.2,.9,.3,1.3); }
@keyframes popIn { 0%{transform:scale(.92);opacity:.4;} 60%{transform:scale(1.04);} 100%{transform:scale(1);opacity:1;} }

.daily-summary { background: var(--accent-soft); border-radius: 12px; padding: 10px 14px; margin: 10px 0; }
.daily-total { font-size: 14px; color: #6b5d4e; }
.daily-num { font-size: 18px; font-weight: 800; color: var(--accent); }

.fortune { display: block; text-align: center; margin: 10px 0 2px; background: #fff3d6; color: #b8860b; border-radius: 12px; padding: 10px; font-size: 14px; font-weight: 600; }
.popup-chip { display: flex; align-items: flex-start; gap: 10px; text-align: left; background: #fff6ee; border: 1px solid #ffe1cf; border-radius: 12px; padding: 9px 10px; margin-top: 8px; }
.popup-chip-ic { font-size: 20px; line-height: 1.2; }
.popup-chip-body { flex: 1; }
.popup-chip-t { font-size: 12px; font-weight: 800; color: var(--accent); display: block; }
.popup-chip-d { font-size: 13px; color: #5b4d3f; line-height: 1.5; display: block; margin-top: 2px; }
.fortune-sub { display: block; text-align: center; font-size: 12px; color: #9a8f83; margin-bottom: 6px; }
.welcome-modal { text-align: center; }
.welcome-badge { font-size: 16px; font-weight: 800; color: var(--accent); display: block; }
.welcome-name { font-size: 28px; font-weight: 800; color: #2d2a26; display: block; margin: 8px 0; }
.welcome-actions { display: flex; gap: 10px; justify-content: center; margin-top: 14px; }
.popup-overlay { animation: fadeIn .25s ease; }
@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }

.vip-perk { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #f4ece3; }
.vip-perk-icon { font-size: 22px; }
.vip-perk-t { font-size: 14px; font-weight: 700; color: #2d2a26; display: block; }
.vip-perk-d { font-size: 12px; color: #9a8f83; display: block; margin-top: 2px; }
</style>
