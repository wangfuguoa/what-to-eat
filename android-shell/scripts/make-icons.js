// 零依赖生成安卓启动图标（PNG），避免引入图形库
// 图形：暖色渐变底 + 白色饭碗 + 三缕热气
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const OUT = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res')
const SS = 4 // 超采样倍数

// ---------- PNG 编码 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// ---------- 绘制 ----------
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = (v) => Math.max(0, Math.min(1, v))
const smooth = (edge0, edge1, x) => {
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

// 距离场：圆角矩形
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r)
  const qy = Math.abs(py - cy) - (hh - r)
  const ax = Math.max(qx, 0)
  const ay = Math.max(qy, 0)
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r
}

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r
}

/**
 * @param {number} size 输出边长
 * @param {boolean} transparentBg 是否透明底（自适应图标前景）
 * @param {number} contentScale 前景内容缩放（1 = 铺满）
 * @param {boolean} round 是否圆形裁剪（圆形图标）
 */
function render(size, transparentBg, contentScale, round) {
  const W = size * SS
  const buf = Buffer.alloc(W * W * 4)

  // 背景渐变色
  const c1 = [255, 138, 76]
  const c2 = [232, 62, 45]

  for (let y = 0; y < W; y++) {
    const ny = y / W
    for (let x = 0; x < W; x++) {
      const nx = x / W
      const i = (y * W + x) * 4
      let r = 0, g = 0, b = 0, a = 0

      if (!transparentBg) {
        const t = clamp01((nx * 0.45 + ny * 0.75))
        r = lerp(c1[0], c2[0], t)
        g = lerp(c1[1], c2[1], t)
        b = lerp(c1[2], c2[2], t)
        a = 255
        if (round) {
          const d = sdCircle(nx, ny, 0.5, 0.5, 0.5) * W
          a = Math.round(255 * (1 - smooth(-1.2, 1.2, d)))
          if (a === 0) { buf[i + 3] = 0; continue }
        }
      }

      // ---- 前景（饭碗 + 热气），坐标归一化到内容框 ----
      const s = contentScale
      const fx = (nx - 0.5) / s + 0.5
      const fy = (ny - 0.5) / s + 0.5

      let ink = 0 // 0..1 白色覆盖度
      if (fx > -0.1 && fx < 1.1 && fy > -0.1 && fy < 1.1) {
        // 碗体：下半圆（中心 0.5,0.60，半径 0.27）
        const bowlR = 0.27
        const bowlCy = 0.60
        const dBowl = Math.max(
          sdCircle(fx, fy, 0.5, bowlCy, bowlR),
          (bowlCy - fy) * 0.9 // 只取下半部分，略带上沿
        ) * W
        ink = Math.max(ink, 1 - smooth(-1.0, 1.0, dBowl))

        // 碗口横条
        const dRim = sdRoundRect(fx, fy, 0.5, 0.603, 0.315, 0.028, 0.026) * W
        ink = Math.max(ink, 1 - smooth(-1.0, 1.0, dRim))

        // 碗底
        const dBase = sdRoundRect(fx, fy, 0.5, 0.845, 0.085, 0.018, 0.016) * W
        ink = Math.max(ink, 1 - smooth(-1.0, 1.0, dBase))

        // 三缕热气（圆角竖条，顶部收细）
        const steam = [
          [0.412, 0.330, 0.013, 0.075],
          [0.5, 0.290, 0.013, 0.088],
          [0.588, 0.330, 0.013, 0.075]
        ]
        for (const [sx, sy, hw, hh] of steam) {
          const d = sdRoundRect(fx, fy, sx, sy, hw, hh, hw) * W
          ink = Math.max(ink, 1 - smooth(-1.0, 1.0, d))
        }
      }

      if (ink > 0) {
        const ia = ink
        r = lerp(r, 255, ia)
        g = lerp(g, 255, ia)
        b = lerp(b, 255, ia)
        a = Math.max(a, Math.round(255 * ia))
      }

      buf[i] = Math.round(r)
      buf[i + 1] = Math.round(g)
      buf[i + 2] = Math.round(b)
      buf[i + 3] = Math.round(a)
    }
  }

  // 下采样（盒式滤波）
  const out = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = ((y * SS + sy) * W + (x * SS + sx)) * 4
          r += buf[i]
          g += buf[i + 1]
          b += buf[i + 2]
          a += buf[i + 3]
        }
      }
      const n = SS * SS
      const o = (y * size + x) * 4
      out[o] = Math.round(r / n)
      out[o + 1] = Math.round(g / n)
      out[o + 2] = Math.round(b / n)
      out[o + 3] = Math.round(a / n)
    }
  }
  return encodePng(size, size, out)
}

const DENSITIES = [
  ['mdpi', 48],
  ['hdpi', 72],
  ['xhdpi', 96],
  ['xxhdpi', 144],
  ['xxxhdpi', 192]
]

let count = 0
for (const [dpi, size] of DENSITIES) {
  const dir = path.join(OUT, 'mipmap-' + dpi)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'ic_launcher.png'), render(size, false, 1, false))
  fs.writeFileSync(path.join(dir, 'ic_launcher_round.png'), render(size, false, 1, true))
  fs.writeFileSync(path.join(dir, 'ic_launcher_foreground.png'), render(size, true, 0.62, false))
  count += 3
}

console.log('[icons] 已生成 ' + count + ' 个图标到 ' + OUT)
