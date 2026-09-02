# AGENTS.md · 吃什么（What to Eat）uni-app

本项目是「吃什么」的 uni-app（Vue 3 + Vite）版本，用于解决「今天吃什么」，含首页、随机池、我的等页面。本目录 `E:\ai\eat-uni` 是唯一活跃项目根；旧的纯静态版本已删除，勿再改。

## 技术栈

- DCloud uni-app + Vue 3 + Vite（package name：`uni-preset-vue`）
- 可编译目标：H5、微信小程序等多端
- 云函数/后端：腾讯云开发 CloudBase（`cloudfunctions/eatpick-api`）
- 静态托管：CloudBase 静态托管 + COS（由 GitHub Action 自动部署）

## 目录结构（`src/` 为主）

- `src/App.vue` / `src/main.js` 应用入口
- `src/pages/` 页面：`index`（首页）、`pool`（随机池）、`mine`（我的）
- `src/data/` 数据（饭菜单等）、`src/store/` 状态、`src/utils/` 工具
- `src/static/` 静态资源
- `src/pages.json` / `src/manifest.json` / `src/uni.scss` 配置
- `cloudfunctions/eatpick-api/` CloudBase 云函数（`index.js`）
- `scripts/copy-dist.js` 构建产物拷贝、`scripts/deploy-cos.js` COS 部署
- `dist/` 构建产物（自动生成，勿手改）、`node_modules/`（勿手改）
- `.github/workflows/deploy-cloudbase.yml` CI：push 到 `main` 自动构建并部署

## 常用命令（在 `E:\ai\eat-uni` 下）

- 安装依赖：`npm install`
- H5 开发：`npm run dev:h5`
- 构建 H5：`npm run build` 或 `npm run build:h5`
- 构建微信小程序：`npm run build:mp-weixin`
- 构建产物生成后由 `scripts/copy-dist.js` 拷贝

## 发布 / 部署

- 走 **git push 到 origin/main（GitHub `wangfuguoa/what-to-eat`）**，触发 GitHub Action `deploy-cloudbase.yml`：
  - `npm run build`
  - `tcb hosting deploy ./dist/build/h5 / -e <env>`
  - 再跑 `scripts/deploy-cos.js` 部署 COS
- 敏感凭据用 GitHub Secrets：`TCB_SECRET_ID` / `TCB_SECRET_KEY` / `TCB_ENV_ID`，不要把真实值写进代码或提交。
- 发布 = `git add` → `git commit` → `git push origin main`。发布前确认本地是最新（先 `git pull`），避免覆盖。

## 注意 / 变更记录

- CloudBase 环境显示名最终保持 `codex`（用户曾临时改为 `wcode`，后用 `tcb env rename` 改回）。环境 ID 仍为 `codex-d2glhcz9z707d54bb`，未变化；`cloudfunctions/cloudbaserc.json`、`src/utils/cloudbase.js` 的 `ENV_ID`、GitHub Secrets `TCB_ENV_ID` 均无需修改。

## 约定 / 给 Agent 的注意

- 界面/文案使用简体中文。
- 改动优先落在 `src/pages/*`、`src/store`、`src/utils`；不要动 `dist/`、`node_modules/`。
- 云函数改动在 `cloudfunctions/eatpick-api/index.js`，改后需重新部署云函数。
- 保持与现有代码风格一致，小步修改；涉及页面增删同步更新 `src/pages.json`。
- 做改动前先看 `git status` / `git log`，确认当前工作区状态；与本仓库其他会话避免并发改同一文件、并发 push。
