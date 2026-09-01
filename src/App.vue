<script>
import { applyTheme } from '@/store/food'
export default {
  onLaunch: function () {
    applyTheme()
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  }
}
</script>

<style>
/* 全局主题变量（默认暖橙，可在「我的」页切换） */
:root {
  --accent: #ff6b35;
  --accent-soft: #ffe7dc;
  --bg: #FFF6EE;
}
page { background: var(--bg); }
</style>
