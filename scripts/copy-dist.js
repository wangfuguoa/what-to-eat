// uni-app H5 产物在 dist/build/h5；把内容再复制到 dist/ 根目录，
// 供 EdgeOne 等按 Vite 默认 dist 目录检测的静态托管平台直接命中。
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const src = path.join(root, 'dist', 'build', 'h5')
const dest = path.join(root, 'dist')

function copyDir(s, d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
  for (const name of fs.readdirSync(s)) {
    const sp = path.join(s, name)
    const dp = path.join(d, name)
    if (fs.statSync(sp).isDirectory()) copyDir(sp, dp)
    else { fs.copyFileSync(sp, dp); console.log('copied', path.relative(root, dp)) }
  }
}

if (fs.existsSync(src)) copyDir(src, dest)
else { console.log('no dist/build/h5 to copy'); process.exit(0) }