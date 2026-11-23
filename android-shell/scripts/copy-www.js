// 把 uni-app 的 H5 构建产物复制到 Capacitor 的 webDir
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = path.join(root, '..', 'dist', 'build', 'h5')
const dest = path.join(root, 'www')

if (!fs.existsSync(src)) {
  console.error('[copy-www] 找不到 H5 构建产物：' + src + '\n请先在项目根目录执行 npm run build:h5')
  process.exit(1)
}

fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(dest, { recursive: true })

function copyDir(from, to) {
  for (const name of fs.readdirSync(from)) {
    const s = path.join(from, name)
    const d = path.join(to, name)
    if (fs.statSync(s).isDirectory()) {
      fs.mkdirSync(d, { recursive: true })
      copyDir(s, d)
    } else {
      fs.copyFileSync(s, d)
    }
  }
}

copyDir(src, dest)
console.log('[copy-www] 已复制到 ' + dest)
