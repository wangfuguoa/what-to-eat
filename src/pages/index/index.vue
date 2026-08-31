<template>
  <view class="page">
    <!-- 顶部 -->
    <view class="app-header">
      <view class="brand">
        <text class="logo">😋</text>
        <view>
          <text class="brand-title">吃什么</text>
          <text class="brand-sub">转一转，今天不纠结</text>
        </view>
      </view>
      <view class="header-actions">
        <button class="btn ghost" @tap="openAdd">＋ 加菜</button>
        <button class="btn ghost" @tap="openSettings">⚙ 设置</button>
      </view>
    </view>

    <!-- 筛选 -->
    <view class="card">
      <text class="card-title">按主食筛选</text>
      <view class="chips">
        <view v-for="t in staples" :key="'s'+t" class="chip" :class="{ active: state.selStaples.includes(t) }" @tap="toggleStaple(t)">{{ t }}</view>
      </view>
      <text class="card-title">按味道筛选</text>
      <view class="chips">
        <view v-for="t in tastes" :key="'t'+t" class="chip" :class="{ active: state.selTastes.includes(t) }" @tap="toggleTaste(t)">{{ t }}</view>
      </view>
      <text class="hint">同一类里选多个表示「任意一个即可」；主食和味道之间是「都要符合」。</text>
    </view>

    <!-- 转盘 -->
    <view class="card wheel-card">
      <canvas canvas-id="wheel" id="wheel" class="wheel" :style="{ width: canvasSize + 'px', height: canvasSize + 'px' }"></canvas>
      <button class="btn primary big" :disabled="state.spinning" @tap="onSpin">🎡 转一转</button>
      <text class="pool-meta">可抽 {{ poolCount }} 道</text>
    </view>

    <!-- 随机池 -->
    <view class="card">
      <view class="section-head">
        <text class="card-title">随机池</text>
        <text class="muted">手动标记可排除</text>
      </view>
      <view class="food-list">
        <view v-if="poolCount === 0" class="empty">没有符合条件的食物，试着放宽筛选</view>
        <view v-for="f in currentPool" :key="f.id" class="food-card">
          <view class="food-main">
            <text class="food-name">{{ f.name }}</text>
            <text class="food-meta">{{ f.staples.join(' / ') }} · {{ f.tastes.join(' ') }}</text>
          </view>
          <view class="food-actions">
            <button class="btn small ghost" @tap="markUnwanted(f.id)">不想吃</button>
            <button class="btn small ghost danger" @tap="onDelete(f.id)">删</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 标记 -->
    <view class="card">
      <view class="section-head">
        <text class="card-title">我的标记</text>
        <button class="btn small ghost" @tap="clearAllMarks">清除全部</button>
      </view>
      <text class="muted">当前标记 {{ activeMarks.length }} 个</text>
      <view class="marks-list">
        <view v-if="activeMarks.length === 0" class="empty">还没有标记，抽中或手动标记后会显示在这里</view>
        <view v-for="m in activeMarks" :key="m.id" class="mark-row" :class="m.status === 'eaten' ? 'm-eaten' : 'm-unwanted'">
          <view class="mark-dot"></view>
          <view class="mark-info">
            <text class="mark-name">{{ m.name }}</text>
            <text class="mark-small">{{ m.status === 'eaten' ? '最近吃过' : '不想吃' }} · 剩余 {{ m.remain }}</text>
          </view>
          <button class="btn small ghost" @tap="onUnmark(m.id)">取消</button>
        </view>
      </view>
    </view>

    <!-- 结果弹窗 -->
    <view v-if="resultVisible" class="overlay" @tap.self="closeResult">
      <view class="modal result-modal">
        <button class="modal-close" @tap="closeResult">×</button>
        <text class="result-badge">🎉 就吃这个</text>
        <text class="result-name">{{ resultFood && resultFood.name }}</text>
        <view class="tags">
          <text v-for="t in resultFood.staples" :key="'rs'+t" class="tag">{{ t }}</text>
          <text v-for="t in resultFood.tastes" :key="'rt'+t" class="tag alt">{{ t }}</text>
        </view>
        <text v-if="resultFood.note" class="note">{{ resultFood.note }}</text>
        <text class="mark-line">已标记：最近吃过</text>
        <view class="modal-actions">
          <button class="btn" @tap="chooseTakeout">🛵 点外卖</button>
          <button class="btn primary" @tap="chooseCook">🍳 自己做</button>
        </view>
        <view v-if="resultGuide" class="guide" :class="{ good: resultGuideGood }">{{ resultGuide }}</view>
        <view class="recipe-block">
          <text class="recipe-title">做法教程</text>
          <view v-if="resultRecipe.length">
            <view v-for="(step, i) in resultRecipe" :key="'step'+i" class="recipe-step">{{ i + 1 }}. {{ step }}</view>
          </view>
          <text v-else class="hint">暂无教程，可搜「{{ resultFood && resultFood.name }} 做法」</text>
        </view>
      </view>
    </view>

    <!-- 添加菜弹窗 -->
    <view v-if="addVisible" class="overlay" @tap.self="closeAdd">
      <view class="modal">
        <button class="modal-close" @tap="closeAdd">×</button>
        <text class="modal-title">添加一道菜</text>
        <view class="field">
          <text class="field-label">菜名</text>
          <input class="input" v-model="form.name" placeholder="如：麻辣香锅" />
        </view>
        <view class="field">
          <text class="field-label">主食</text>
          <view class="chips">
            <view v-for="t in staples" :key="'fs'+t" class="chip" :class="{ active: form.staples.includes(t) }" @tap="toggleFormStaple(t)">{{ t }}</view>
          </view>
        </view>
        <view class="field">
          <text class="field-label">味道</text>
          <view class="chips">
            <view v-for="t in tastes" :key="'ft'+t" class="chip" :class="{ active: form.tastes.includes(t) }" @tap="toggleFormTaste(t)">{{ t }}</view>
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
        <view class="modal-actions">
          <button class="btn ghost" @tap="closeAdd">取消</button>
          <button class="btn primary" @tap="saveFood">保存</button>
        </view>
      </view>
    </view>

    <!-- 设置弹窗 -->
    <view v-if="settingsVisible" class="overlay" @tap.self="closeSettings">
      <view class="modal">
        <button class="modal-close" @tap="closeSettings">×</button>
        <text class="modal-title">设置</text>
        <view class="field-row">
          <text class="field-label">标记记忆</text>
          <input class="input small" type="number" v-model="settingsForm.memoryValue" min="1" />
          <picker mode="selector" :range="units" @change="onUnitChange">
            <view class="picker">{{ settingsForm.memoryUnit }}</view>
          </picker>
        </view>
        <view class="check-line" @tap="settingsForm.includeMarked = !settingsForm.includeMarked">
          <view class="checkbox" :class="{ on: settingsForm.includeMarked }"></view>
          <text>把已标记的也放进转盘</text>
        </view>
        <button class="btn primary" @tap="submitSettings">保存设置</button>
        <text class="hint">标记过的菜会在记忆时长内被排除，可随时在下方取消。</text>
      </view>
    </view>

    <view class="toast" :class="{ show: toastShow }">{{ toastMsg }}</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
import {
  state, currentPool, activeMarks, STAPLES, TASTES, WHEEL_COLORS,
  initStore, toggleFilter, markFood, unmarkFood, clearMarks, saveSettings,
  addCustomFood, deleteFood, spin, spinStep, stopResult, findFood, remainText
} from '@/store/food'

const instance = getCurrentInstance()
const staples = STAPLES
const tastes = TASTES
const units = ['天', '周', '月']

const sys = uni.getSystemInfoSync()
const canvasSize = Math.min(340, (sys.windowWidth || 375) - 48)

const resultVisible = ref(false)
const addVisible = ref(false)
const settingsVisible = ref(false)
const toastShow = ref(false)
const toastMsg = ref('')
let toastTimer = null

const resultFood = ref(null)
const resultRecipe = ref([])
const resultGuide = ref('')
const resultGuideGood = ref(false)

const form = ref({ name: '', staples: [], tastes: [], note: '', recipe: '' })
const settingsForm = ref({ memoryValue: 3, memoryUnit: '天', includeMarked: false })

const poolCount = computed(() => currentPool.value.length)

function toast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

function raf(fn) {
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(fn)
  else setTimeout(fn, 16)
}

function getCtx() {
  return uni.createCanvasContext('wheel', instance ? instance.proxy : null)
}

function drawWheel() {
  const ctx = getCtx()
  const size = canvasSize
  const cx = size / 2, cy = size / 2, r = size / 2 - 6
  ctx.clearRect(0, 0, size, size)
  const arr = currentPool.value
  state.wheelPool = arr
  if (!arr.length) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.setFillStyle('#eee'); ctx.fill()
    ctx.setFillStyle('#999'); ctx.setFontSize(14); ctx.setTextAlign('center')
    ctx.fillText('没菜了', cx, cy)
    drawPointer(ctx, cx, cy, size)
    ctx.draw()
    return
  }
  const n = arr.length
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
    ctx.setFontSize(Math.max(11, Math.min(14, (r * 0.9 / n) * 2)))
    ctx.setShadow(0, 0, 3, 'rgba(0,0,0,0.3)')
    ctx.fillText(shortName(arr[i].name), r - 10, 4)
    ctx.restore()
  }
  ctx.beginPath(); ctx.arc(cx, cy, 17, 0, Math.PI * 2); ctx.setFillStyle('#fff'); ctx.fill()
  ctx.setFillStyle('#333'); ctx.setFontSize(9); ctx.setTextAlign('center')
  ctx.fillText('吃!', cx, cy + 3)
  drawPointer(ctx, cx, cy, size)
  ctx.draw()
}

function drawPointer(ctx, cx, cy, size) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(cx, 2)
  ctx.lineTo(cx - 8, 16)
  ctx.lineTo(cx + 8, 16)
  ctx.closePath()
  ctx.setFillStyle('#333')
  ctx.fill()
  ctx.restore()
}

function shortName(name) {
  name = String(name)
  return name.length > 5 ? name.slice(0, 5) + '…' : name
}

function onSpin() {
  const prev = spin()
  if (!prev) { toast('没有符合条件的食物'); return }
  const stepFn = () => {
    const res = spinStep(prev, Date.now())
    drawWheel()
    if (res.done) {
      const item = stopResult(prev)
      if (item) showResult(item)
    } else {
      raf(stepFn)
    }
  }
  raf(stepFn)
}

function showResult(f) {
  resultFood.value = f
  resultRecipe.value = f.recipe || []
  resultGuide.value = ''
  resultGuideGood.value = false
  resultVisible.value = true
  saveToCloud()
}

function closeResult() { resultVisible.value = false }

function chooseTakeout() {
  const f = resultFood.value
  if (!f) return
  resultGuideGood.value = false
  resultGuide.value = '去 美团 / 饿了么 搜「' + f.name + '」直接下单，省钱又省心。'
}

function chooseCook() {
  const f = resultFood.value
  if (!f) return
  if (f.recipe && f.recipe.length) {
    resultGuideGood.value = true
    resultGuide.value = '来吧，按下面步骤自己做：'
  } else {
    resultGuideGood.value = false
    resultGuide.value = '这道菜教程先欠着，去搜「' + f.name + ' 做法」就能找到。'
  }
}

function toggleStaple(t) { toggleFilter('staple', t) }
function toggleTaste(t) { toggleFilter('taste', t) }

function markUnwanted(id) {
  markFood(id, 'unwanted')
  toast('已标记「不想吃」，' + remainText(id) + '内不再出现')
  saveToCloud()
}

function onUnmark(id) {
  unmarkFood(id)
  toast('已取消标记')
  saveToCloud()
}

function clearAllMarks() {
  uni.showModal({
    title: '提示',
    content: '确定清除所有标记吗？',
    success: (res) => {
      if (res.confirm) { clearMarks(); toast('已清除所有标记'); saveToCloud() }
    }
  })
}

function onDelete(id) {
  const f = findFood(id)
  uni.showModal({
    title: '提示',
    content: '删除「' + (f ? f.name : '') + '」？',
    success: (res) => {
      if (res.confirm) { deleteFood(id); toast('已删除'); saveToCloud() }
    }
  })
}

function openAdd() {
  form.value = { name: '', staples: [], tastes: [], note: '', recipe: '' }
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
  addCustomFood({ name, staples: [...form.value.staples], tastes: [...form.value.tastes], note: form.value.note.trim(), recipe })
  closeAdd()
  toast('已添加「' + name + '」')
  saveToCloud()
}

function openSettings() {
  settingsForm.value = { memoryValue: state.settings.memoryValue, memoryUnit: state.settings.memoryUnit, includeMarked: state.settings.includeMarked }
  settingsVisible.value = true
}
function closeSettings() { settingsVisible.value = false }
function onUnitChange(e) {
  settingsForm.value.memoryUnit = units[Number(e.detail.value)]
}
function submitSettings() {
  const v = Math.max(1, parseInt(settingsForm.value.memoryValue, 10) || 3)
  saveSettings({ memoryValue: v, memoryUnit: settingsForm.value.memoryUnit, includeMarked: !!settingsForm.value.includeMarked })
  closeSettings()
  toast('设置已保存')
  saveToCloud()
}

onMounted(() => {
  initStore()
  settingsForm.value = { memoryValue: state.settings.memoryValue, memoryUnit: state.settings.memoryUnit, includeMarked: state.settings.includeMarked }
  drawWheel()
})

watch(currentPool, () => drawWheel())
</script>

<style>
.page { min-height: 100vh; background: #f7f7f9; padding: 16px; box-sizing: border-box; }
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.brand { display: flex; align-items: center; }
.logo { font-size: 32px; margin-right: 8px; }
.brand-title { font-size: 22px; font-weight: 700; color: #ff6b35; display: block; }
.brand-sub { font-size: 12px; color: #888; display: block; }
.header-actions { display: flex; gap: 8px; }
.card { background: #fff; border-radius: 16px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
.card-title { font-size: 15px; font-weight: 700; color: #333; display: block; margin: 6px 0; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.chip { padding: 5px 12px; background: #f0f0f2; border-radius: 999px; font-size: 13px; color: #333; }
.chip.active { background: #ff6b35; color: #fff; }
.hint { font-size: 11px; color: #999; }
.wheel-card { display: flex; flex-direction: column; align-items: center; }
.wheel { margin: 6px auto; }
.btn { border: none; background: #f0f0f2; padding: 10px 14px; border-radius: 10px; font-size: 14px; color: #333; line-height: 1; }
.btn.primary { background: #ff6b35; color: #fff; }
.btn.big { width: 80%; margin-top: 10px; }
.btn.ghost { background: transparent; border: 1px solid #ddd; }
.btn.small { padding: 6px 10px; font-size: 12px; }
.btn.danger { color: #e74c3c; }
.pool-meta { margin-top: 10px; font-size: 13px; color: #666; }
.section-head { display: flex; justify-content: space-between; align-items: center; }
.muted { font-size: 12px; color: #999; }
.empty { color: #999; padding: 14px 0; text-align: center; font-size: 13px; }
.food-list { display: flex; flex-direction: column; }
.food-card { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f2f2f2; }
.food-name { font-size: 15px; font-weight: 600; color: #333; display: block; }
.food-meta { font-size: 12px; color: #888; display: block; margin-top: 2px; }
.food-actions { display: flex; gap: 6px; }
.marks-list { margin-top: 8px; }
.mark-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f2f2f2; }
.m-eaten .mark-dot { background: #1dd1a1; }
.m-unwanted .mark-dot { background: #ee5253; }
.mark-dot { width: 10px; height: 10px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; }
.mark-info { flex: 1; }
.mark-name { font-size: 14px; font-weight: 600; display: block; }
.mark-small { font-size: 12px; color: #999; display: block; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #fff; border-radius: 16px; padding: 20px; width: 100%; max-width: 400px; position: relative; max-height: 85vh; overflow-y: auto; }
.modal-close { position: absolute; top: 10px; right: 12px; background: #f0f0f2; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; color: #666; line-height: 1; }
.result-badge { font-size: 20px; font-weight: 700; color: #ff6b35; display: block; text-align: center; }
.result-name { font-size: 26px; font-weight: 700; display: block; text-align: center; margin: 8px 0; }
.tags { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px; }
.tag { background: #f0f0f2; border-radius: 999px; padding: 3px 10px; font-size: 12px; color: #333; }
.tag.alt { background: #ffe7dc; color: #ff6b35; }
.note { font-size: 13px; color: #888; text-align: center; display: block; margin: 8px 0; }
.mark-line { font-size: 12px; color: #1dd1a1; text-align: center; display: block; margin-bottom: 10px; }
.modal-actions { display: flex; gap: 10px; justify-content: center; margin: 12px 0; }
.guide { background: #f0f8ff; border-radius: 10px; padding: 10px; font-size: 14px; color: #333; margin-bottom: 10px; }
.guide.good { background: #e6fff0; color: #1a7f4b; }
.recipe-block { border-top: 1px solid #f2f2f2; padding-top: 10px; }
.recipe-title { font-size: 14px; font-weight: 700; display: block; margin-bottom: 6px; }
.recipe-step { font-size: 14px; color: #555; line-height: 1.8; }
.modal-title { font-size: 18px; font-weight: 700; display: block; margin-bottom: 12px; }
.field { margin-bottom: 12px; }
.field-label { font-size: 13px; color: #666; display: block; margin-bottom: 4px; }
.input { border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px 10px; font-size: 14px; width: 100%; box-sizing: border-box; }
.input.small { width: 70px; display: inline-block; }
.textarea { border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px 10px; font-size: 14px; width: 100%; box-sizing: border-box; height: 90px; }
.field-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.picker { border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px 12px; font-size: 14px; }
.check-line { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 14px; }
.checkbox { width: 18px; height: 18px; border: 2px solid #ccc; border-radius: 4px; }
.checkbox.on { background: #ff6b35; border-color: #ff6b35; }
.toast { position: fixed; left: 50%; bottom: 80px; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 14px; opacity: 0; transition: opacity 0.2s; z-index: 200; pointer-events: none; }
.toast.show { opacity: 1; }
</style>



