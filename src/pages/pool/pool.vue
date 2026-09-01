<template>
  <view class="page">
    <view class="app-header">
      <view class="brand">
        <text class="logo">📖</text>
        <view class="brand-text">
          <text class="brand-title">菜谱随机池</text>
          <text class="brand-sub">搜一搜，挑一挑</text>
        </view>
      </view>
      <button class="tool-btn" :class="{ active: favOnly }" @tap="favOnly = !favOnly">⭐ 只看收藏</button>
    </view>

    <view class="search">
      <text class="search-icon">🔍</text>
      <input class="search-input" v-model="query" placeholder="搜索菜名，如：土豆" />
    </view>

    <view class="chips category">
      <view class="chip" :class="{ active: !category }" @tap="setCategory('')">全部</view>
      <view v-for="c in CATEGORY_OPTIONS" :key="c" class="chip" :class="{ active: category === c }" @tap="setCategory(c)">{{ c }}</view>
    </view>

    <view class="card">
      <view class="section-head">
        <text class="card-title">{{ list.length }} 道</text>
        <button class="btn small ghost" @tap="openAdd">＋ 添加</button>
      </view>
      <view v-if="!list.length" class="empty">没有符合条件的菜</view>
      <view v-for="f in list" :key="f.id" class="food-card">
        <view class="food-main">
          <text class="food-name">{{ f.name }}</text>
          <text class="food-meta">{{ poolMeta(f) }}</text>
        </view>
        <view class="food-actions">
          <button class="btn small ghost" @tap="openRecipe(f)">🍳 菜谱</button>
          <button class="btn small ghost fav" @tap="favFood(f.id)">{{ isFavorite(f.id) ? '♥' : '♡' }}</button>
          <button class="btn small ghost" @tap="markUnwanted(f.id)">不想吃</button>
          <button class="btn small ghost danger" @tap="onDelete(f.id)">删</button>
        </view>
      </view>
    </view>

    <!-- 菜谱 -->
    <view v-if="recipeVisible" class="overlay" @tap.self="closeRecipe">
      <view class="modal">
        <button class="modal-close" @tap="closeRecipe">×</button>
        <text class="modal-title">{{ recipeFood && recipeFood.name }}</text>
        <view class="tags">
          <text v-for="t in (recipeFood.staples || [])" :key="'prs'+t" class="tag">{{ t }}</text>
          <text v-for="t in (recipeFood.tastes || [])" :key="'prt'+t" class="tag alt">{{ t }}</text>
          <text v-if="recipeFood" class="tag cat">{{ recipeFood.category }}</text>
        </view>
        <view v-if="recipeFood && recipeFood.recipe && recipeFood.recipe.length" class="recipe-block">
          <text class="recipe-title">做法教程</text>
          <text v-for="(s, i) in recipeFood.recipe" :key="'pst'+i" class="recipe-step">{{ i + 1 }}. {{ s }}</text>
        </view>
        <view v-else class="guide">
          <text>这道菜更适合「{{ recipeFood && recipeFood.how && recipeFood.how[0] }}」。<br />去搜「{{ recipeFood && recipeFood.name }} 做法」就能找到教程。</text>
        </view>
        <button class="btn primary" @tap="closeRecipe">知道啦</button>
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
import { ref, computed, onMounted } from 'vue'
import {
  state, CATEGORY_OPTIONS, STAPLES, TASTES, visibleFoods,
  isFavorite, toggleFavorite, markFood, unmarkFood, findFood, deleteFood, addCustomFood
} from '@/store/food'
import { saveToCloud } from '@/utils/sync'

const favOnly = ref(false)
const query = ref('')
const category = ref('')
const recipeVisible = ref(false)
const recipeFood = ref(null)
const addVisible = ref(false)
const form = ref({ name: '', category: '小吃', staples: [], tastes: [], note: '', recipe: '' })
const toastShow = ref(false)
const toastMsg = ref('')
let toastTimer = null

const list = computed(() => {
  let arr = visibleFoods()
  if (category.value) arr = arr.filter(f => f.category === category.value)
  const q = query.value.trim()
  if (q) arr = arr.filter(f => f.name.indexOf(q) !== -1)
  if (favOnly.value) arr = arr.filter(f => isFavorite(f.id))
  return arr
})

function toast(msg) {
  toastMsg.value = msg
  toastShow.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastShow.value = false), 2200)
}

function setCategory(c) { category.value = c }
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
    title: '提示',
    content: '删除「' + (f ? f.name : '') + '」？',
    success: (res) => { if (res.confirm) { deleteFood(id); toast('已删除'); saveToCloud() } }
  })
}
function openRecipe(f) { recipeFood.value = f; recipeVisible.value = true }
function closeRecipe() { recipeVisible.value = false }

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

onMounted(() => {})
</script>
<style>
.page { min-height: 100vh; background: var(--bg); padding: 16px 14px 40px; box-sizing: border-box; }
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.brand { display: flex; align-items: center; gap: 10px; }
.logo { font-size: 32px; }
.brand-title { font-size: 22px; font-weight: 800; color: #2d2a26; display: block; line-height: 1.1; }
.brand-sub { font-size: 12px; color: #9a8f83; display: block; }
.card { background: #fff; border-radius: 18px; padding: 16px; margin-bottom: 14px; box-shadow: 0 4px 18px rgba(160,120,70,0.06); }
.search { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e6d8c8; border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; }
.search-icon { font-size: 16px; }
.search-input { flex: 1; font-size: 14px; border: none; background: transparent; color: #2d2a26; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid #e6d8c8; background: #fff; border-radius: 999px; padding: 7px 14px; font-size: 13px; color: #6b5d4e; }
.chip.active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 700; }
.category { margin-bottom: 12px; }
.section-head { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 16px; font-weight: 800; color: #2d2a26; }
.muted { font-size: 12px; color: #b0a49a; }
.empty { color: #b0a49a; padding: 14px 0; text-align: center; font-size: 13px; }
.food-card { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f4ece3; }
.food-main { flex: 1; padding-right: 8px; }
.food-name { font-size: 15px; font-weight: 700; color: #2d2a26; display: block; }
.food-meta { font-size: 12px; color: #9a8f83; display: block; margin-top: 2px; }
.food-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.btn { border-radius: 999px; font-size: 13px; padding: 8px 13px; border: none; line-height: 1; transition: transform 0.1s; }
.btn:active { transform: scale(0.96); }
.btn.primary { background: linear-gradient(150deg, #ff8a50, var(--accent)); color: #fff; box-shadow: 0 4px 12px rgba(255,107,53,0.3); }
.btn.ghost { background: #fff; border: 1px solid #e6d8c8; color: #6b5d4e; }
.btn.small { font-size: 12px; padding: 6px 10px; }
.btn.danger { color: #e74c3c; border-color: #f3c0bb; }
.btn.fav { color: var(--accent); border-color: #ffd7c2; }
.tool-btn { border: 1px solid #ddd; background: #fff; padding: 8px 12px; border-radius: 10px; font-size: 13px; color: #333; }
.tool-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #fff; border-radius: 18px; padding: 20px; width: 100%; max-width: 400px; position: relative; max-height: 85vh; overflow-y: auto; }
.modal-close { position: absolute; top: 10px; right: 12px; background: #f0ece7; border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 18px; color: #6b5d4e; line-height: 1; }
.modal-title { font-size: 18px; font-weight: 800; display: block; margin-bottom: 12px; color: #2d2a26; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag { background: #f2ece4; border-radius: 999px; padding: 3px 10px; font-size: 12px; color: #6b5d4e; }
.tag.alt { background: var(--accent-soft); color: var(--accent); }
.tag.cat { background: #e8f4ff; color: #2f8dd0; }
.field { margin-bottom: 12px; }
.field-label { font-size: 13px; color: #8a7b6c; display: block; margin-bottom: 4px; }
.input { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; width: 100%; box-sizing: border-box; }
.textarea { border: 1px solid #e6d8c8; border-radius: 10px; padding: 9px 11px; font-size: 14px; width: 100%; box-sizing: border-box; height: 90px; }
.recipe-block { border-top: 1px solid #f4ece3; padding-top: 10px; margin-top: 8px; }
.recipe-title { font-size: 14px; font-weight: 700; display: block; margin-bottom: 6px; color: #2d2a26; }
.recipe-step { font-size: 14px; color: #6b5d4e; line-height: 1.8; display: block; }
.guide { background: #f0f8ff; border-radius: 12px; padding: 12px; font-size: 14px; color: #3b6a8a; margin: 8px 0; }
.toast { position: fixed; left: 50%; bottom: 84px; transform: translateX(-50%); background: rgba(0,0,0,0.82); color: #fff; padding: 10px 18px; border-radius: 999px; font-size: 14px; opacity: 0; transition: opacity 0.2s; z-index: 200; pointer-events: none; max-width: 80vw; text-align: center; }
.toast.show { opacity: 1; }
</style>

