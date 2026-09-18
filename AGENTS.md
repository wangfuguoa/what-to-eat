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

## 后端调用通道（HTTP 网关）

网页端不再依赖 `@cloudbase/js-sdk` 的匿名登录（体验版套餐无法开通「身份认证」，也无法添加「Web 安全域名」，报 `[CreateAuthDomain] 当前套餐无法执行此操作`），改为**直连 CloudBase HTTP 网关**：

- 接口地址：`https://codex-d2glhcz9z707d54bb-1427137188.ap-shanghai.app.tcloudbase.com/api`
- 路由：`/api` → 云函数 `SCF:eatpick-api`（同一云函数同时支持 SDK 调用与 HTTP 调用）
- 调用方式：`POST` + `Content-Type: application/json`，body 为 `{ action, ...参数, authToken?, anonId? }`，返回 `{ ok, data }` 或 `{ ok:false, code, msg }`
- 前端位置：`src/utils/cloudbase.js` 的 `callApi()`。H5 / App 走 `uni.request` 直连网关；微信小程序仍走 SDK（`useHttpTransport()` 用条件编译区分）
- 未登录用户用前端生成的 `anonId`（存储键 `eatpick_anon_id`）区分数据，避免多人共用一份匿名数据
- 云函数返回时统一包一层 CORS 头（`Access-Control-Allow-Origin: *`），支持 `OPTIONS` 预检
- 好处：不需要登录态、不需要域名备案、不需要白名单，任何域名下的网页都能调用

新建/修改 HTTP 路由需用 `@cloudbase/manager-node` 的管理 API（临时装在 `%TEMP%\cbmgr`，**不要**加进项目依赖）。

## 约定 / 给 Agent 的注意

- 界面/文案使用简体中文。
- 改动优先落在 `src/pages/*`、`src/store`、`src/utils`；不要动 `dist/`、`node_modules/`。
- 云函数改动在 `cloudfunctions/eatpick-api/index.js`，改后需重新部署云函数。
- 保持与现有代码风格一致，小步修改；涉及页面增删同步更新 `src/pages.json`。
- 做改动前先看 `git status` / `git log`，确认当前工作区状态；与本仓库其他会话避免并发改同一文件、并发 push。
