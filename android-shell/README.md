# android-shell · 安卓 APK 壳

用 Capacitor 把 uni-app 的 H5 产物包成原生安卓安装包（WebView 壳）。

## 目录

- `capacitor.config.json`：appId / 应用名 / webDir 配置
- `scripts/copy-www.js`：把 `../dist/build/h5` 复制到 `www/`
- `android/`：`npx cap add android` 生成的安卓工程（可自行改图标、权限、签名）
- `keys/`：签名证书（**不要提交**，请自行备份）

## 打包步骤

```bash
# 1. 先生成 H5 产物（在仓库根目录）
npm run build:h5

# 2. 拷贝产物 + 同步到安卓工程
cd android-shell
npm install
npm run sync

# 3. 打包（发布版）
cd android
$env:JAVA_HOME='D:\YingYong\Java'
$env:ANDROID_HOME='C:\Android\sdk'
.\gradlew.bat assembleRelease
```

产物：`android/app/build/outputs/apk/release/app-release.apk`

## 说明

- 这是 **WebView 壳** 方案：页面仍是 H5 构建，后端走 CloudBase HTTP 网关，改网页后重新 `build:h5` + `sync` + 重新打包即可。
- 正式上架（应用商店）建议改用 uni-app 官方路线：HBuilderX 云打包或 DCloud 离线打包 SDK，可以拿到原生 plus 运行时、更好的性能与原生能力。
- 应用内数据（收藏/历史/VIP）跟随账号走云端；未登录时用设备匿名 ID，清数据会丢。
