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

      <view class="card profile-card profile-hero">
        <view class="profile-avatar"><text class="profile-avatar-text">{{ state.settings.avatar || '😊' }}</text></view>
        <view class="profile-info">
          <text class="nickname">{{ state.settings.nickname || (state.account.loggedIn ? state.account.username : '未设置昵称') }}</text>
          <text class="profile-sub">{{ state.settings.city ? '常住 · ' + state.settings.city : (state.account.loggedIn ? '已登录 · 数据云端同步' : '登录后可同步数据') }}</text>
        </view>
        <view class="profile-actions">
          <button class="btn small ghost" @tap="openProfile">编辑</button>
          <button class="btn small primary" v-if="!state.account.loggedIn" @tap="openAccount">登录</button>
          <button class="btn small ghost" v-else @tap="onLogout">退出</button>
        </view>
      </view>

    <view class="card">
      <view class="section-head">
        <text class="card-title">👑 会员 · 权益中心</text>
        <button class="btn small primary" @tap="openVip">{{ isVip() ? '续费' : '开通' }}</button>
      </view>
      <view class="vip-status" :class="{ on: isVip() }">
        <text class="vip-badge">{{ isVip() ? '已开通会员' : '未开通会员' }}</text>
        <text v-if="isVip()" class="vip-expire">{{ vipExpireText }}</text>
        <text v-else class="muted">兑换码 / 邀请好友即可开通</text>
      </view>
      <view class="vip-perk-grid">
        <view v-for="p in VIP_PERKS" :key="p.t" class="vip-perk-cell">
          <text class="vip-perk-ic">{{ p.i }}</text>
          <text class="vip-perk-t">{{ p.t }}</text>
          <text class="vip-perk-state">{{ isVip() ? '✓' : '🔒' }}</text>
        </view>
      </view>
      <view v-if="!isVip()" class="vip-cta">
        <view class="vip-cta-info">
          <text class="vip-cta-t">开通即享</text>
          <text class="vip-cta-d">高级玩法 · 皮肤 · 弹窗显示控制</text>
        </view>
        <button class="btn primary" @tap="openVip">立即开通 →</button>
      </view>
    </view>

    <view class="card">
      <text class="card-title">📊 数据总览</text>
      <view class="stat-grid">
        <view class="stat-cell"><text class="stat-num">{{ todayCount }}</text><text class="stat-lb">今日已选</text></view>
        <view class="stat-cell"><text class="stat-num">{{ todayCalories }}</text><text class="stat-lb">今日卡路里</text></view>
        <view class="stat-cell"><text class="stat-num">{{ streakDays }}</text><text class="stat-lb">连续打卡</text></view>
        <view class="stat-cell"><text class="stat-num">{{ state.favorites.length }}</text><text class="stat-lb">累计收藏</text></view>
      </view>
    </view>

    <view class="card group">
      <view class="group-head" @tap="toggleGroup('appearance')">
        <text class="group-title">🎨 外观与主题</text>
        <text class="group-arrow">{{ openGroup === 'appearance' ? '▴' : '▾' }}</text>
      </view>
      <view v-if="openGroup === 'appearance'" class="group-body">
      <view class="theme-grid">
        <view v-for="t in THEMES" :key="t.key" class="theme-item" :class="{ active: state.theme === t.key }" @tap="setTheme(t.key)">
          <view class="theme-swatch" :style="{ background: t.accent }"></view>
          <text class="theme-label">{{ t.label }}</text>
        </view>
      </view>
      </view>
    </view>

    <view class="card group">
      <view class="group-head" @tap="toggleGroup('personal')">
        <text class="group-title">🧩 个性化定制</text>
        <text class="group-arrow">{{ openGroup === 'personal' ? '▴' : '▾' }}</text>
      </view>
      <view v-if="openGroup === 'personal'" class="group-body">

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

      <view class="opt-group-title">菜谱显示</view>
      <view class="opt-row" @tap="setS('showCalories', !state.settings.showCalories)">
        <view class="opt-info"><text class="opt-t">显示卡路里</text><text class="opt-d">菜谱与记录展示热量</text></view>
        <view class="switch" :class="{ on: state.settings.showCalories }"><view class="knob"></view></view>
      </view>
      <view class="opt-row" @tap="setS('showNutrition', !state.settings.showNutrition)">
        <view class="opt-info"><text class="opt-t">显示营养</text><text class="opt-d">展示蛋白质、脂肪、碳水等</text></view>
        <view class="switch" :class="{ on: state.settings.showNutrition }"><view class="knob"></view></view>
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

      <view class="opt-group-title">玩法皮肤</view>
      <view class="guide"><text>给每种抽取玩法换外观，点一下即可切换。后续会陆续上线更多付费皮肤。</text></view>
      <view v-for="m in RECOMMEND_MODES" :key="'sk'+m.key" class="skin-row">
        <view class="skin-row-head"><text class="skin-mode">{{ m.icon }} {{ m.label }}</text><text class="skin-current">{{ skinLabel(m.key) }}</text></view>
        <view class="skin-choices">
          <view v-for="s in (MODE_SKINS[m.key] || [])" :key="s.key" class="skin-chip" :class="{ active: skinActive(m.key, s.key) }" @tap="pickSkin(m.key, s.key)">{{ s.label }}</view>
        </view>
      </view>
      </view>
    </view>

    <view class="card group">
      <view class="group-head" @tap="toggleGroup('diet')">
        <text class="group-title">🍽️ 饮食偏好</text>
        <text class="group-arrow">{{ openGroup === 'diet' ? '▴' : '▾' }}</text>
      </view>
      <view v-if="openGroup === 'diet'" class="group-body">
        <view class="opt-group-title">忌口</view>
        <view class="guide"><text>选中的会自动从首页随机池避开。</text></view>
        <view class="mode-choice">
          <view v-for="a in DIET_AVOID" :key="a" class="mode-choice-item" :class="{ active: state.settings.dietAvoid.includes(a) }" @tap="toggleAvoid(a)">{{ a }}</view>
        </view>
        <view class="opt-group-title">口味偏好</view>
        <view class="guide"><text>推荐的菜会更偏向你喜欢的口味。</text></view>
        <view class="mode-choice">
          <view v-for="t in TASTE_PREFS" :key="t" class="mode-choice-item" :class="{ active: state.settings.tastePref.includes(t) }" @tap="toggleTastePref(t)">{{ t }}</view>
        </view>
        <view class="opt-group-title">饮食目标</view>
        <view class="guide"><text>自动联动首页「吃饭目的」筛选。</text></view>
        <view class="mode-choice">
          <view v-for="g in DIET_GOALS" :key="g" class="mode-choice-item" :class="{ active: state.settings.dietGoal === g }" @tap="pickGoal(g)">{{ g }}</view>
        </view>
      </view>
    </view>

    <view class="card group">
      <view class="group-head" @tap="toggleGroup('memory')">
        <text class="group-title">⏳ 记忆与周期</text>
        <text class="group-arrow">{{ openGroup === 'memory' ? '▴' : '▾' }}</text>
      </view>
      <view v-if="openGroup === 'memory'" class="group-body">
        <view class="field-row">
          <input class="picker-input" type="number" v-model="memValueStr" placeholder="3" />
          <picker mode="selector" :range="memUnits" @change="onMemUnit">
            <view class="picker">{{ memUnit }}</view>
          </picker>
        </view>
        <text class="hint">「最近吃过」与「不想吃」的保存周期，到期自动解除。</text>
        <button class="btn primary" @tap="saveMem">保存周期</button>
      </view>
    </view>

    <view class="card group">
      <view class="group-head" @tap="toggleGroup('setting')">
        <text class="group-title">⚙️ 设置与关于</text>
        <text class="group-arrow">{{ openGroup === 'setting' ? '▴' : '▾' }}</text>
      </view>
      <view v-if="openGroup === 'setting'" class="group-body">
        <view class="opt-row" @tap="toggleNotify">
          <view class="opt-info"><text class="opt-t">每日推荐提醒</text><text class="opt-d">每日固定时间提醒点菜（后期）</text></view>
          <view class="switch" :class="{ on: state.settings.notify }"><view class="knob"></view></view>
        </view>
        <view class="opt-row" @tap="confirmReset">
          <view class="opt-info"><text class="opt-t">清除本地数据</text><text class="opt-d">重置收藏、历史、标记、设置</text></view>
          <text class="replace-arrow">↺</text>
        </view>
        <view class="opt-row" @tap="showAbout">
          <view class="opt-info"><text class="opt-t">关于我们</text><text class="opt-d">版本 1.0.0 · 用户协议 · 隐私政策</text></view>
          <text class="replace-arrow">›</text>
        </view>
        <view class="opt-row" @tap="openFeedback">
          <view class="opt-info"><text class="opt-t">帮助与反馈</text><text class="opt-d">问题反馈 / 意见 / 加群</text></view>
          <text class="replace-arrow">›</text>
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

      <view v-if="profileVisible" class="overlay" @tap.self="closeProfile">
        <view class="modal" @tap.stop>
          <button class="modal-close" @tap="closeProfile">×</button>
          <text class="modal-title">✏️ 编辑资料</text>
          <view class="field">
            <text class="field-label">昵称</text>
            <input class="input" v-model="nicknameInput" maxlength="12" placeholder="2-12字昵称" />
          </view>
          <view class="field">
            <text class="field-label">头像</text>
            <view class="avatar-choice">
              <view v-for="a in avatars" :key="a" class="avatar-opt" :class="{ active: avatarInput === a }" @tap="avatarInput = a">{{ a }}</view>
            </view>
          </view>
          <view class="field">
            <text class="field-label">常住城市</text>
            <input class="input" v-model="cityInput" maxlength="20" placeholder="如：上海" />
          </view>
          <view class="bind-row">
            <button class="btn small ghost" @tap="toast('小程序可微信一键登录（后期接后端）')">绑定微信</button>
            <button class="btn small ghost" @tap="toast('手机号绑定功能即将上线')">绑定手机</button>
          </view>
          <button class="btn primary" @tap="saveProfile">保存</button>
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
  import { ref, computed } from 'vue'
  import { state, THEMES, setTheme, isVip, saveSettings, todayCalories, resetAllData, setProfile, DIET_AVOID, TASTE_PREFS, DIET_GOALS, setDietAvoid, setTastePref, setDietGoal, RECOMMEND_MODES, isModeVip, replaceHomeMode, setPopupChip, VIP_POPUP_CHIPS, MODE_SKINS, getModeSkin, setModeSkin } from '@/store/food'
  import { saveToCloud, refreshVip, loginAccount, registerAccount, logoutAccount } from '@/utils/sync'
  import { callApi } from '@/utils/cloudbase'

const openGroup = ref('')
function toggleGroup(k) { openGroup.value = openGroup.value === k ? '' : k }
const profileVisible = ref(false)
const nicknameInput = ref('')
const avatarInput = ref('😊')
const cityInput = ref('')
const avatars = ['😊', '😄', '😋', '🥰', '😎', '🤗', '🐱', '🐶', '🐰', '🦊']
const memValueStr = ref('3')
const memUnit = ref('天')
const memUnits = ['天', '周', '月']
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

const todayCount = computed(() => state.dailyRecords.length)
const streakDays = computed(() => {
  const days = new Set(state.dailyRecords.map(d => { const t = new Date(d.ts); return t.getFullYear() + '-' + t.getMonth() + '-' + t.getDate() }))
  if (!days.size) return 0
  let n = 0
  const cur = new Date()
  while (true) {
    const key = cur.getFullYear() + '-' + cur.getMonth() + '-' + cur.getDate()
    if (days.has(key)) { n++; cur.setDate(cur.getDate() - 1) }
    else break
  }
  return n
})

const VIP_PERKS = [
  { i: '🧩', t: '弹窗显示控制' },
  { i: '🎮', t: '掷骰 / 扭蛋玩法' },
  { i: '🎨', t: '主页玩法替换' },
  { i: '🔁', t: '更多皮肤' }
]

function toast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
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
function skinLabel(mode) {
  const s = getModeSkin(mode)
  return s ? s.label : '默认'
}
function skinActive(mode, key) {
  const skins = MODE_SKINS[mode] || []
  if (!skins.length) return false
  const cur = state.modeSkins[mode] || skins[0].key
  return cur === key
}
function pickSkin(mode, key) {
  setModeSkin(mode, key)
  saveToCloud()
  toast('已切换' + modeLabel(mode) + '皮肤：' + skinLabel(mode))
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
  function openVip() { vipVisible.value = true; vipFocus.value = true }
  function closeVip() { vipVisible.value = false; vipFocus.value = false }
  function openProfile() {
    profileVisible.value = true
    nicknameInput.value = state.settings.nickname || ''
    avatarInput.value = state.settings.avatar || '😊'
    cityInput.value = state.settings.city || ''
  }
  function closeProfile() { profileVisible.value = false }
  function saveProfile() {
    setProfile({ nickname: nicknameInput.value, avatar: avatarInput.value, city: cityInput.value })
    saveToCloud()
    closeProfile()
    toast('资料已保存')
  }
  function toggleAvoid(a) {
    const arr = state.settings.dietAvoid.slice()
    const i = arr.indexOf(a)
    if (i >= 0) arr.splice(i, 1); else arr.push(a)
    setDietAvoid(arr)
    saveToCloud()
  }
  function toggleTastePref(t) {
    const arr = state.settings.tastePref.slice()
    const i = arr.indexOf(t)
    if (i >= 0) arr.splice(i, 1); else arr.push(t)
    setTastePref(arr)
    saveToCloud()
  }
  function pickGoal(g) {
    setDietGoal(state.settings.dietGoal === g ? '' : g)
    saveToCloud()
    toast('饮食目标已更新')
  }
  function toggleNotify() {
    saveSettings({ notify: !state.settings.notify })
    saveToCloud()
  }
  function confirmReset() {
    uni.showModal({
      title: '提示', content: '确定清除全部本地数据吗？此操作不可撤销。',
      success: (res) => { if (res.confirm) { resetAllData(); toast('已重置'); } }
    })
  }
  function showAbout() {
    uni.showModal({ title: '关于我们', content: '「吃什么」v1.0.0\n一个帮你解决今天吃什么的随机神器。\n使用即代表同意《用户协议》与《隐私政策》。', showCancel: false })
  }
  function openFeedback() {
    uni.showModal({ title: '帮助与反馈', content: '反馈/建议请发：whattoeat@example.com\n或加入用户群获取更多支持。', showCancel: false })
  }
  function onMemUnit(e) { memUnit.value = memUnits[Number(e.detail.value)] }
  function saveMem() {
    const v = Math.max(1, parseInt(memValueStr.value, 10) || 3)
    memValueStr.value = String(v)
    saveSettings({ memoryValue: v, memoryUnit: memUnit.value })
    saveToCloud()
    toast('周期记忆已保存')
  }
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
.group { padding: 0; overflow: hidden; }
.group-head { display: flex; align-items: center; justify-content: space-between; padding: 15px 16px; }
.group-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.group-arrow { font-size: 14px; color: #9a8f83; }
.group-body { padding: 0 16px 16px; border-top: 1px solid #f4ece3; }
.group-body .card-title { margin-top: 14px; }
.profile-card { display: flex; align-items: center; gap: 14px; }
.avatar { width: 58px; height: 58px; border-radius: 50%; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; font-size: 28px; }
.nickname { font-size: 18px; font-weight: 800; color: #2d2a26; display: block; }
.profile-sub { font-size: 12px; color: #9a8f83; display: block; margin-top: 4px; }
.profile-hero { background: linear-gradient(135deg, var(--accent-soft), #fff); border: 1px solid #f0e2d3; }
.profile-avatar { width: 60px; height: 60px; border-radius: 50%; background: #fff; border: 2px solid var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(160,120,70,0.15); }
.profile-avatar-text { font-size: 30px; }
.profile-actions { display: flex; gap: 6px; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-head .btn { margin: 0; }
.guide { font-size: 12px; color: #9a8f83; margin: -2px 0 10px; }
.card-title.inline { margin-bottom: 0; }
.vip-status { border: 1px solid #f0d6a0; background: #fff8e8; border-radius: 14px; padding: 14px; margin-bottom: 4px; }
.vip-status.on { border-color: #ffcf00; background: #fffbe6; }
.vip-badge { font-size: 18px; font-weight: 800; color: #d48806; display: block; }
.vip-expire { font-size: 13px; color: #9a8f83; display: block; margin-top: 4px; }
.muted { font-size: 12px; color: #b0a49a; }
.vip-perk-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
.vip-perk-cell { background: #faf4ec; border-radius: 12px; padding: 10px 4px; text-align: center; }
.vip-perk-ic { font-size: 20px; display: block; }
.vip-perk-t { font-size: 11px; color: #6b5d4e; display: block; margin-top: 4px; line-height: 1.3; }
.vip-perk-state { font-size: 12px; color: #1a9e5c; display: block; margin-top: 4px; font-weight: 700; }
.vip-cta { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; background: linear-gradient(120deg, #fff3d6, #ffe6b0); border: 1px solid #f0d6a0; border-radius: 14px; padding: 12px; }
.vip-cta-t { font-size: 14px; font-weight: 800; color: #b8860b; display: block; }
.vip-cta-d { font-size: 12px; color: #b0985a; display: block; margin-top: 2px; }
.vip-cta .btn { flex-shrink: 0; }
.theme-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stat-cell { background: var(--accent-soft); border-radius: 12px; padding: 12px 4px; text-align: center; }
.stat-num { font-size: 20px; font-weight: 800; color: var(--accent); display: block; }
.stat-lb { font-size: 11px; color: #6b5d4e; display: block; margin-top: 4px; }
.avatar-choice { display: flex; flex-wrap: wrap; gap: 8px; }
.avatar-opt { width: 40px; height: 40px; border-radius: 50%; background: #f4ece3; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; }
.avatar-opt.active { background: var(--accent-soft); border: 2px solid var(--accent); }
.bind-row { display: flex; gap: 10px; margin-bottom: 14px; }
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
.skin-row { margin-top: 8px; }
.skin-row-head { display: flex; align-items: center; justify-content: space-between; }
.skin-mode { font-size: 13px; color: #2d2a26; font-weight: 700; }
.skin-current { font-size: 12px; color: var(--accent); font-weight: 600; }
.skin-choices { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.skin-chip { font-size: 13px; padding: 7px 14px; border-radius: 999px; background: #f4ece3; color: #6b5d4e; border: 1px solid transparent; }
.skin-chip.active { background: var(--accent-soft); color: var(--accent); border-color: var(--accent); font-weight: 700; }
.switch { width: 46px; height: 26px; border-radius: 999px; background: #ddd; position: relative; transition: background .2s; flex-shrink: 0; }
.switch .knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.switch.on { background: var(--accent); }
.switch.on .knob { left: 23px; }
.switch.locked { opacity: 0.5; }
.opt-row.vip { background: #fff8e8; border-radius: 10px; margin-top: 6px; padding: 10px 12px; border: 1px solid #f0d6a0; }
</style>
