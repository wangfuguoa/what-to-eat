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
          <text class="nickname">{{ state.account.loggedIn ? state.account.username : '未登录' }}</text>
          <text class="profile-sub">{{ state.account.loggedIn ? '已登录 · 数据随账号云同步' : '登录后可同步个性化与 VIP' }}</text>
        </view>
        <button v-if="state.account.loggedIn" class="btn small ghost" @tap="onLogout">退出</button>
        <button v-else class="btn small primary" @tap="openAccount">登录/注册</button>
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

      <view class="opt-group-title">首页弹窗</view>
      <view class="opt-row" @tap="setS('showWelcomePopup', !state.settings.showWelcomePopup)">
        <view class="opt-info"><text class="opt-t">首页欢迎弹窗</text><text class="opt-d">控制下方所有弹窗展示项</text></view>
        <view class="switch" :class="{ on: state.settings.showWelcomePopup }"><view class="knob"></view></view>
      </view>
      <view class="opt-row" @tap="toggleWelcomeCycle">
        <view class="opt-info"><text class="opt-t">弹窗频率</text><text class="opt-d">{{ state.settings.welcomeCycle === 'daily' ? '每天显示一次' : '每次进入都显示' }}</text></view>
        <text class="replace-arrow">⇄</text>
      </view>
      <view class="guide"><text>开启首页欢迎弹窗后，以下模块才会展示；VIP 可解锁更多。</text></view>
      <view class="opt-row" :class="{ 'opt-disabled': !state.settings.showWelcomePopup }" @tap="toggleChip('fortune')">
        <view class="opt-info"><text class="opt-t">今日运势</text><text class="opt-d">弹窗展示当日运势</text></view>
        <view class="switch" :class="{ on: state.settings.popupChips.fortune }"><view class="knob"></view></view>
      </view>
      <view class="opt-row" :class="{ 'opt-disabled': !state.settings.showWelcomePopup }" @tap="toggleChip('pairing')">
        <view class="opt-info"><text class="opt-t">{{ isVip() ? '饮品甜点搭配' : '饮品甜点搭配 🔒' }}</text><text class="opt-d">推荐配什么饮品/甜点</text></view>
        <view class="switch" :class="{ on: state.settings.popupChips.pairing, locked: !isVip() }"><view class="knob"></view></view>
      </view>
      <view class="opt-row" :class="{ 'opt-disabled': !state.settings.showWelcomePopup }" @tap="toggleChip('tips')">
        <view class="opt-info"><text class="opt-t">{{ isVip() ? '健康小贴士' : '健康小贴士 🔒' }}</text><text class="opt-d">弹窗展示保健小建议</text></view>
        <view class="switch" :class="{ on: state.settings.popupChips.tips, locked: !isVip() }"><view class="knob"></view></view>
      </view>

      <view class="opt-group-title">卡路里</view>
      <view class="opt-row" @tap="setS('showCalories', !state.settings.showCalories)">
        <view class="opt-info"><text class="opt-t">显示卡路里</text><text class="opt-d">菜谱与记录展示热量</text></view>
        <view class="switch" :class="{ on: state.settings.showCalories }"><view class="knob"></view></view>
      </view>

      <view class="opt-group-title">主页玩法</view>
      <view class="guide"><text>首页最多显示三种玩法，开通 VIP 可用掷骰/扭蛋替换其中之一。</text></view>
      <view v-for="(k, idx) in state.settings.homeModes" :key="'hm'+idx" class="opt-row" @tap="onReplaceMode(k)">
        <view class="opt-info"><text class="opt-t">{{ modeLabel(k) }}<text v-if="isModeVip(k)" class="vip-tag">VIP</text></text><text class="opt-d">点击可替换成其他玩法</text></view>
        <text class="replace-arrow">{{ isModeVip(k) && !isVip() ? '🔒' : '⇄' }}</text>
      </view>
      <view class="slot-title">可选玩法</view>
      <view class="mode-choice">
        <view v-for="m in RECOMMEND_MODES" :key="m.key" class="mode-choice-item" :class="{ active: state.settings.homeModes.includes(m.key), locked: m.vipOnly && !isVip() }" @tap="onReplaceWith(m.key)">{{ m.icon }} {{ m.label }}{{ m.vipOnly && !isVip() ? ' 🔒' : '' }}</view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">⏱️ 最近/标记周期</text>
      <view class="field-row">
        <input class="picker-input" type="number" v-model="settingsForm.memoryValueStr" placeholder="3" />
        <picker mode="selector" :range="units" @change="onUnitChange">
          <view class="picker">{{ settingsForm.memoryUnit }}</view>
        </picker>
      </view>
      <text class="hint">「最近吃过」按这个时长显示，标记过的菜也会在该时长内被排除。</text>
      <button class="btn primary" @tap="submitSettings">保存设置</button>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="card-title">🕘 最近吃过</text>
        <button class="btn small ghost" @tap="confirmClearHistory">清空</button>
      </view>
      <view v-if="!state.history.length" class="empty">还没有记录</view>
      <view v-if="!shownHistory.length && state.history.length" class="empty">该周期内暂无记录（可调大周期）</view>
      <view v-for="h in shownHistory" :key="'mh' + h.id + h.ts" class="mark-row">
        <view class="mark-dot"></view>
        <view class="mark-info">
          <text class="mark-name">{{ h.name }}</text>
          <text class="mark-small">{{ formatTime(h.ts) }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="card-title">🍽️ 吃过记录</text>
        <button class="btn small ghost" @tap="confirmClearEaten">清空计数</button>
      </view>
      <view v-if="!eatenList.length" class="empty">还没有吃过记录，点「就它了」或抽中就会累计</view>
      <view v-for="e in eatenList" :key="'ec' + e.id" class="mark-row">
        <view class="mark-dot"></view>
        <view class="mark-info">
          <text class="mark-name">{{ e.name }}</text>
          <text class="mark-small">共吃过 {{ e.count }} 次</text>
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

      <view v-if="accountVisible" class="overlay" @tap.self="closeAccount">
        <view class="modal" @tap.stop>
          <button class="modal-close" @tap="closeAccount">×</button>
          <text class="modal-title">{{ accountMode === 'login' ? '🔑 登录' : '✨ 注册' }}</text>
          <view class="field">
            <text class="field-label">用户名</text>
            <input class="input account-input" v-model="accUsername" maxlength="20" placeholder="2-20位中英文/数字/下划线" />
          </view>
          <view class="field">
            <text class="field-label">密码</text>
            <input class="input account-input" v-model="accPassword" :password="true" maxlength="32" placeholder="至少6位" />
          </view>
          <view v-if="accountMode === 'register'" class="field">
            <text class="field-label">确认密码</text>
            <input class="input account-input" v-model="accPassword2" :password="true" maxlength="32" placeholder="再次输入密码" />
          </view>
          <button class="btn primary" @tap="submitAccount" :disabled="accBusy">{{ accBusy ? '处理中…' : (accountMode === 'login' ? '登录' : '注册并登录') }}</button>
          <view class="mode-switch">
            <text class="mode-switch-text">{{ accountMode === 'login' ? '还没有账号？' : '已有账号？' }}</text>
            <text class="mode-switch-link" @tap="toggleAccountMode">{{ accountMode === 'login' ? '去注册' : '去登录' }}</text>
          </view>
          <text class="account-note">登录后，收藏、历史、标记、VIP 都会跟随账号，换设备可恢复。</text>
        </view>
      </view>
  
      <view class="toast" :class="{ show: toastShow }">{{ toastMsg }}</view>
  </view>
</template>
<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { state, THEMES, setTheme, isVip, clearHistory, clearEatenCounts, saveSettings, allFoods, RECOMMEND_MODES, isModeVip, replaceHomeMode, setPopupChip, VIP_POPUP_CHIPS } from '@/store/food'
  import { saveToCloud, refreshVip, loginAccount, registerAccount, logoutAccount } from '@/utils/sync'
  import { callApi } from '@/utils/cloudbase'

const units = ['天', '周', '月']
const settingsForm = ref({ memoryValue: 3, memoryUnit: '天', memoryValueStr: '3' })
const vipVisible = ref(false)
const vipCode = ref('')
const vipBusy = ref(false)
  const vipFocus = ref(false)
  const accountVisible = ref(false)
  const accountMode = ref('login')
  const accUsername = ref('')
  const accPassword = ref('')
  const accPassword2 = ref('')
  const accBusy = ref(false)
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

const MS = { 天: 86400000, 周: 7 * 86400000, 月: 30 * 86400000 }
const shownHistory = computed(() => {
  const ms = MS[state.settings.memoryUnit || '天'] || 86400000
  const windowMs = (state.settings.memoryValue || 3) * ms
  const cutoff = Date.now() - windowMs
  return state.history.filter(h => h.ts >= cutoff)
})
const eatenList = computed(() => {
  const map = {}
  for (const f of allFoods()) map[f.id] = f
  return Object.keys(state.eatenCounts)
    .map(id => ({ id, name: (map[id] && map[id].name) || id, count: state.eatenCounts[id] || 0 }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)
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
function modeLabel(k) {
  const m = RECOMMEND_MODES.find(x => x.key === k)
  return m ? (m.icon + ' ' + m.label) : k
}
  function toggleChip(key) {
    if (!state.settings.showWelcomePopup) { toast('请先开启「首页欢迎弹窗」'); return }
    if (VIP_POPUP_CHIPS.includes(key) && !isVip()) { toast('开通 VIP 即可解锁此功能'); return }
    setPopupChip(key, !state.settings.popupChips[key])
    saveToCloud()
  }
  function toggleWelcomeCycle() {
    const next = (state.settings.welcomeCycle || 'daily') === 'daily' ? 'each' : 'daily'
    saveSettings({ welcomeCycle: next })
    saveToCloud()
    toast(next === 'daily' ? '改为每天显示一次' : '改为每次进入都显示')
  }
  function confirmClearEaten() {
    uni.showModal({
      title: '提示', content: '确定清空「吃过记录」的计数吗？',
      success: (res) => { if (res.confirm) { clearEatenCounts(); toast('已清空计数'); saveToCloud() } }
    })
  }
function onReplaceMode(k) {
  if (isModeVip(k) && !isVip()) { toast('开通 VIP 即可解锁此玩法'); return }
  const options = RECOMMEND_MODES.filter(m => m.key !== k)
  uni.showActionSheet({
    itemList: options.map(m => (m.icon + ' ' + m.label) + (m.vipOnly ? '（VIP）' : '') + (state.settings.homeModes.includes(m.key) ? '·已用' : '')),
    success: (res) => {
      const chosen = options[res.tapIndex]
      if (!chosen) return
      if (chosen.vipOnly && !isVip()) { toast('开通 VIP 即可解锁此玩法'); return }
      if (state.settings.homeModes.includes(chosen.key)) { toast('它已在主页玩法中'); return }
      replaceHomeMode(k, chosen.key); saveToCloud(); toast('主页玩法已更新')
    }
  })
}
function onReplaceWith(newKey) {
  if (isModeVip(newKey) && !isVip()) { toast('开通 VIP 即可解锁此玩法'); return }
  if (state.settings.homeModes.includes(newKey)) { toast('它已在主页玩法中'); return }
  const slots = state.settings.homeModes
  uni.showActionSheet({
    itemList: slots.map((k, i) => '替换「' + modeLabel(k) + '」'),
    success: (res) => {
      const old = slots[res.tapIndex]
      if (old) { replaceHomeMode(old, newKey); saveToCloud(); toast('主页玩法已更新') }
    }
  })
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
  function openAccount() { accountVisible.value = true; accUsername.value = ''; accPassword.value = ''; accPassword2.value = ''; accountMode.value = 'login' }
  function closeAccount() { accountVisible.value = false }
  function toggleAccountMode() { accountMode.value = accountMode.value === 'login' ? 'register' : 'login' }
  async function submitAccount() {
    const username = accUsername.value.trim()
    const password = accPassword.value
    if (!username) { toast('请输入用户名'); return }
    if (!password) { toast('请输入密码'); return }
    if (accountMode.value === 'register') {
      if (password.length < 6) { toast('密码至少6位'); return }
      if (password !== accPassword2.value) { toast('两次密码不一致'); return }
    }
    accBusy.value = true
    try {
      if (accountMode.value === 'login') {
        await loginAccount(username, password)
        toast('登录成功')
      } else {
        await registerAccount(username, password)
        toast('注册成功，已自动登录')
      }
      accountVisible.value = false
      await refreshVip()
    } catch (e) {
      toast((e && e.message) || '操作失败')
    } finally {
      accBusy.value = false
    }
  }
  async function onLogout() {
    await logoutAccount()
    toast('已退出登录')
  }
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
.section-head .btn { margin: 0; }
.guide { font-size: 12px; color: #9a8f83; margin: -2px 0 10px; }
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
  .account-input { border-radius: 12px; padding: 12px 14px; font-size: 16px; height: 46px; background: #fff; box-shadow: 0 2px 8px rgba(160,120,70,0.08); }
  .vip-input { font-size: 16px; min-height: 44px; padding: 12px; box-sizing: border-box; }
  .mode-switch { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 14px; }
  .mode-switch-text { font-size: 13px; color: #9a8f83; }
  .mode-switch-link { font-size: 13px; color: var(--accent); font-weight: 700; }
  .account-note { display: block; margin-top: 14px; font-size: 12px; color: #b0a49a; text-align: center; line-height: 1.5; }
  .toast { position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%); background: rgba(0,0,0,0.82); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 14px; opacity: 0; transition: opacity 0.2s; z-index: 200; pointer-events: none; max-width: 80vw; text-align: center; }
.toast.show { opacity: 1; }
.picker-input { border: 1px solid #e6d8c8; border-radius: 12px; padding: 12px 14px; font-size: 16px; width: 100px; height: 46px; box-sizing: border-box; color: #2d2a26; background: #fff; box-shadow: 0 2px 8px rgba(160,120,70,0.06); }
  .opt-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f4ece3; }
  .opt-row.opt-disabled { opacity: 0.45; }
.opt-info { flex: 1; padding-right: 10px; }
.opt-t { font-size: 14px; font-weight: 600; color: #2d2a26; display: block; }
.opt-d { font-size: 12px; color: #9a8f83; display: block; margin-top: 2px; }
.opt-group-title { font-size: 15px; font-weight: 800; color: #2d2a26; margin-top: 16px; padding-top: 14px; border-top: 1px solid #f4ece3; }
.vip-tag { font-size: 10px; color: #fff; background: linear-gradient(150deg,#ffd766,#ffb300); border-radius: 999px; padding: 1px 6px; margin-left: 6px; vertical-align: middle; }
.replace-arrow { font-size: 18px; color: var(--accent); }
.slot-title { font-size: 12px; color: #9a8f83; font-weight: 600; margin-top: 8px; }
.mode-choice { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.mode-choice-item { font-size: 13px; padding: 7px 12px; border-radius: 999px; background: #f4ece3; color: #6b5d4e; border: 1px solid transparent; }
.mode-choice-item.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); font-weight: 700; }
.mode-choice-item.locked { opacity: 0.55; }
.switch { width: 46px; height: 26px; border-radius: 999px; background: #ddd; position: relative; transition: background .2s; flex-shrink: 0; }
.switch .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.switch.on { background: var(--accent); }
.switch.on .knob { left: 23px; }
.switch.locked { opacity: 0.5; }
.opt-row.vip { background: #fff8e8; border-radius: 10px; margin-top: 6px; padding: 10px 12px; border: 1px solid #f0d6a0; }
</style>
