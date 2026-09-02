const COS = require('cos-nodejs-sdk-v5')
const fs = require('fs')
const path = require('path')

const cos = new COS({
  SecretId: process.env.TCB_SECRET_ID,
  SecretKey: process.env.TCB_SECRET_KEY
})

const Bucket = process.env.COS_BUCKET
const Region = process.env.COS_REGION
const root = path.join(__dirname, '..', 'dist', 'build', 'h5')

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8'
}

function walk(dir, base, out) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const rel = path.relative(base, p).split(path.sep).join('/')
    if (fs.statSync(p).isDirectory()) walk(p, base, out)
    else out.push(rel)
  }
  return out
}

function putKey(s3key) {
  return new Promise((resolve, reject) => {
    const full = path.join(root, s3key.split('/').join(path.sep))
    const ext = path.extname(s3key).toLowerCase()
    const cache = s3key.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
    const opt = {
      Bucket, Region, Key: s3key,
      Body: fs.createReadStream(full),
      ContentType: mime[ext] || 'application/octet-stream',
      CacheControl: cache
    }
    cos.putObject(opt, (err, data) => {
      if (err) reject(new Error(s3key + ' -> ' + err.message))
      else resolve()
    })
  })
}

async function main() {
  if (!Bucket || !Region || !process.env.TCB_SECRET_ID || !process.env.TCB_SECRET_KEY) {
    throw new Error('缺少环境变量：TCB_SECRET_ID / TCB_SECRET_KEY / COS_BUCKET / COS_REGION')
  }
  if (!fs.existsSync(root)) throw new Error('构建目录不存在：' + root)
  const files = walk(root, root, [])
  let ok = 0
  for (const f of files) {
    await putKey(f)
    ok++
    console.log('upload', f)
  }
  console.log('done. total', files.length, 'ok', ok)
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1) })
