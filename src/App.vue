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
/* 底部 TabBar 分界美化（H5） */
uni-tabbar {
  border-top: 1px solid #f0e6db;
  box-shadow: 0 -4px 16px rgba(160, 120, 70, 0.08);
}
.uni-tabbar__label { font-size: 15px !important; font-weight: 600; }
.uni-tabbar__item { min-height: 56px; }
</style>
