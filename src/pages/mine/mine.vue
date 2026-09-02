<template>
  <view class="page">
    <view class="app-header">
      <view class="brand">
        <text class="logo">👤</text>
        <view class="brand-text">
          <text class="brand-title">我的</text>
          <text class="brand-sub">个性化设置</text>
        </view>
      </view>
    </view>

    <view class="card profile-card">
      <view class="avatar">😊</view>
      <view class="profile-info">
        <text class="nickname">美食爱好者</text>
        <text class="profile-sub">匿名登录 · 数据已云同步</text>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="card-title">💎 VIP 会员</text>
        <button class="btn small ghost" @tap="openVip">兑换码</button>
      </view>
      <view class="vip-status" :class="{ on: isVip() }">
        <text class="vip-badge">{{ isVip() ? '已开通' : '未开通' }}</text>
        <text v-if="isVip()" class="vip-expire">{{ vipExpireText }}</text>
        <text v-else class="muted">兑换码开通，解锁更多高级玩法</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">主题样式</text>
      <view class="theme-grid">
        <view v-for="t in THEMES" :key="t.key" class="theme-item" :class="{ active: state.theme === t.key }" @tap="setTheme(t.key)">
          <view class="theme-swatch" :style="{ background: t.accent }"></view>
          <text class="theme-label">{{ t.label }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">个性化</text>
      <view class="opt-row" @tap="setS('showWelcomePopup', !state.settings.showWelcomePopup)">
        <view class="opt-info"><text class="opt-t">打开欢迎弹窗</text><text class="opt-d">进入首页自动推荐一道菜</text></view>
        <view class="switch" :class="{ on: state.settings.showWelcomePopup }"><view class="knob"></view></view>
      </view>
      <view class="opt-row" @tap="setS('showFortune', !state.settings.showFortune)">
        <view class="opt-info"><text class="opt-t">今日运势</text><text class="opt-d">在弹窗显示当日运势</text></view>
        <view class="switch" :class="{ on: state.settings.showFortune }"><view class="knob"></view></view>
      </view>
      <view class="opt-row" @tap="setS('showCalories', !state.settings.showCalories)">
        <view class="opt-info"><text class="opt-t">显示卡路里</text><text class="opt-d">菜谱与记录展示热量</text></view>
        <view class="switch" :class="{ on: state.settings.showCalories }"><view class="knob"></view></view>
      </view>
      <view class="opt-row" @tap="togglePermanentClose">
        <view class="opt-info"><text class="opt-t">永久关闭弹窗</text><text class="opt-d">不再自动弹出推荐</text></view>
        <view class="switch" :class="{ on: state.settings.welcomePopupClosed }"><view class="knob"></view></view>
      </view>
      <view class="opt-row vip" @tap="toggleVipPopup">
        <view class="opt-info"><text class="opt-t">{{ isVip() ? '弹窗附加信息' : '弹窗附加信息 🔒' }}</text><text class="opt-d">{{ isVip() ? 'VIP 解锁，展示更多推荐信息' : '开通 VIP 后可解锁' }}</text></view>
        <view class="switch" :class="{ on: state.settings.vipPopupExtra, locked: !isVip() }"><view class="knob"></view></view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">标记记忆</text>
      <view class="field-row">
        <input class="picker-input" type="digit" v-model="settingsForm.memoryValueStr" placeholder="3" />
        <picker mode="selector" :range="units" @change="onUnitChange">
          <view class="picker">{{ settingsForm.memoryUnit }}</view>
        </picker>
      </view>
      <text class="hint">标记过的菜会在这个时长内被排除，可随时在首页取消。</text>
      <button class="btn primary" @tap="submitSettings">保存设置</button>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="card-title">🕘 最近吃过</text>
        <button class="btn small ghost" @tap="confirmClearHistory">清空</button>
      </view>
      <view v-if="!state.history.length" class="empty">还没有记录</view>
      <view v-for="h in state.history" :key="'mh' + h.id + h.ts" class="mark-row">
        <view class="mark-dot"></view>
        <view class="mark-info">
          <text class="mark-name">{{ h.name }}</text>
          <text class="mark-small">{{ formatTime(h.ts) }}</text>
        </view>
      </view>
    </view>

    <!-- VIP 兑换 -->
    <view v-if="vipVisible" class="overlay" @tap.self="closeVip">
      <view class="modal">
        <button class="modal-close" @tap="closeVip">×</button>
        <text class="modal-title">💎 VIP 会员</text>
        <view class="vip-status" :class="{ on: isVip() }">
          <text class="vip-badge">{{ isVip() ? '已开通' : '未开通' }}</text>
          <text v-if="isVip()" class="vip-expire">{{ vipExpireText }}</text>
          <text v-else class="muted">使用兑换码开通，享更多功能</text>
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
import { ref, computed, onMounted } from 'vue'
import { state, THEMES, setTheme, isVip, clearHistory, saveSettings } from '@/store/food'
import { saveToCloud, refreshVip } from '@/utils/sync'
import { callApi } from '@/utils/cloudbase'

const units = ['天', '周', '月']
const settingsForm = ref({ memoryValue: 3, memoryUnit: '天', memoryValueStr: '3' })
const vipVisible = ref(false)
const vipCode = ref('')
const vipBusy = ref(false)
const vipFocus = ref(false)
const toastShow = ref(false)
const toastMsg = ref('')
let toastTimer = null

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

function onUnitChange(e) {
  settingsForm.value.memoryUnit = units[Number(e.detail.value)]
}
function submitSettings() {
  const v = Math.max(1, parseInt(settingsForm.value.memoryValueStr, 10) || 3)
  settingsForm.value.memoryValueStr = String(v)
  saveSettings({ memoryValue: v, memoryUnit: settingsForm.value.memoryUnit })
  saveToCloud()
  toast('设置已保存')
}
function setS(k, v) {
  const s2 = Object.assign({}, state.settings)
  s2[k] = !!v
  saveSettings(s2)
  saveToCloud()
}
function togglePermanentClose() { setS('welcomePopupClosed', !state.settings.welcomePopupClosed) }
function toggleVipPopup() {
  if (!isVip()) { toast('开通 VIP 即可解锁此功能'); return }
  setS('vipPopupExtra', !state.settings.vipPopupExtra)
}
function confirmClearHistory() {
  uni.showModal({
    title: '提示', content: '确定清空历史记录吗？',
    success: (res) => { if (res.confirm) { clearHistory(); toast('已清空历史'); saveToCloud() } }
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

onMounted(() => {
  settingsForm.value = { memoryValue: state.settings.memoryValue, memoryUnit: state.settings.memoryUnit, memoryValueStr: String(state.settings.memoryValue) }
})
</script>
<style>
.page { min-height: 100vh; background: var(--bg); padding: 16px 14px 40px; box-sizing: border-box; }
.app-header { margin-bottom: 14px; }
.brand { display: flex; align-items: center; gap: 10px; }
.logo { font-size: 32px; }
.brand-title { font-size: 22px; font-weight: 800; color: #2d2a26; display: block; line-height: 1.1; }
.brand-sub { font-size: 12px; color: #9a8f83; display: block; }
.card { background: #fff; border-radius: 18px; padding: 16px; margin-bottom: 14px; box-shadow: 0 4px 18px rgba(160,120,70,0.06); }
.card-title { font-size: 16px; font-weight: 800; color: #2d2a26; display: block; margin-bottom: 12px; }
.profile-card { display: flex; align-items: center; gap: 14px; }
.avatar { width: 58px; height: 58px; border-radius: 50%; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; font-size: 28px; }
.nickname { font-size: 18px; font-weight: 800; color: #2d2a26; display: block; }
.profile-sub { font-size: 12px; color: #9a8f83; display: block; margin-top: 4px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.card-title.inline { margin-bottom: 0; }
.vip-status { border: 1px solid #f0d6a0; background: #fff8e8; border-radius: 14px; padding: 14px; margin-bottom: 4px; }
.vip-status.on { border-color: #ffcf00; background: #fffbe6; }
.vip-badge { font-size: 18px; font-weight: 800; color: #d48806; display: block; }
.vip-expire { font-size: 13px; color: #9a8f83; display: block; margin-top: 4px; }
.muted { font-size: 12px; color: #b0a49a; }
.theme-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.theme-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
.theme-swatch { width: 46px; height: 46px; border-radius: 14px; border: 2px solid #eee; }
.theme-item.active .theme-swatch { border-color: #2d2a26; box-shadow: 0 0 0 3px var(--accent-soft); }
.theme-label { font-size: 12px; color: #6b5d4e; }
.field-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.input.small { width: 90px; border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; }
.picker { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 12px; font-size: 14px; color: #2d2a26; }
.hint { font-size: 12px; color: #b0a49a; display: block; margin-bottom: 12px; }
.empty { color: #b0a49a; padding: 12px 0; text-align: center; font-size: 13px; }
.mark-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f4ece3; }
.mark-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); margin-right: 10px; flex-shrink: 0; }
.mark-info { flex: 1; }
.mark-name { font-size: 14px; font-weight: 600; color: #2d2a26; display: block; }
.mark-small { font-size: 12px; color: #9a8f83; display: block; }
.btn { border-radius: 999px; font-size: 13px; padding: 8px 13px; border: none; line-height: 1; transition: transform 0.1s; }
.btn:active { transform: scale(0.96); }
.btn.primary { background: linear-gradient(150deg, #ff8a50, var(--accent)); color: #fff; box-shadow: 0 4px 12px rgba(255,107,53,0.3); }
.btn.ghost { background: #fff; border: 1px solid #e6d8c8; color: #6b5d4e; }
.btn.small { font-size: 12px; padding: 6px 10px; }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #fff; border-radius: 18px; padding: 20px; width: 100%; max-width: 400px; position: relative; max-height: 85vh; overflow-y: auto; }
.modal-close { position: absolute; top: 10px; right: 12px; background: #f0ece7; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; color: #6b5d4e; line-height: 1; }
.modal-title { font-size: 18px; font-weight: 800; display: block; margin-bottom: 12px; color: #2d2a26; }
.field { margin-bottom: 12px; }
.field-label { font-size: 13px; color: #8a7b6c; display: block; margin-bottom: 4px; }
.input { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; width: 100%; box-sizing: border-box; }
.vip-input { font-size: 16px; min-height: 44px; padding: 12px; box-sizing: border-box; }
.toast { position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%); background: rgba(0,0,0,0.82); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 14px; opacity: 0; transition: opacity 0.2s; z-index: 200; pointer-events: none; max-width: 80vw; text-align: center; }
.toast.show { opacity: 1; }
.picker-input { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; width: 90px; box-sizing: border-box; color: #2d2a26; background: #fff; }
.opt-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f4ece3; }
.opt-info { flex: 1; padding-right: 10px; }
.opt-t { font-size: 14px; font-weight: 600; color: #2d2a26; display: block; }
.opt-d { font-size: 12px; color: #9a8f83; display: block; margin-top: 2px; }
.switch { width: 46px; height: 26px; border-radius: 999px; background: #ddd; position: relative; transition: background .2s; flex-shrink: 0; }
.switch .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.switch.on { background: var(--accent); }
.switch.on .knob { left: 23px; }
.switch.locked { opacity: 0.5; }
.opt-row.vip { background: #fff8e8; border-radius: 10px; margin-top: 6px; padding: 10px 12px; border: 1px solid #f0d6a0; }
</style>
