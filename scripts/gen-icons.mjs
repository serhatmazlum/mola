#!/usr/bin/env node
/**
 * Uygulama ve tepsi ikonlarini kod uretir — repoda binary asset ya da
 * ImageMagick/rsvg gibi harici bir arac gerekmez.
 *
 *   node scripts/gen-icons.mjs
 *
 * Cikti:
 *   build/icon.png              1024x1024  (electron-builder .icns/.ico uretir)
 *   resources/trayTemplate.png  22x22      (macOS menu cubugu, sablon)
 *   resources/trayTemplate@2x.png 44x44
 *   resources/tray.png          32x32      (Windows / Linux)
 */
import zlib from 'node:zlib'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// ------------------------------------------------------------------ PNG yazma

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function encodePng(size, rgba) {
  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  return Buffer.concat([
    PNG_SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ])
}

// ------------------------------------------------------------------- cizim

const SAMPLES = 4 // kenar yumusatma icin piksel basina 4x4 ornek

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/** Yariciapi r olan yuvarlatilmis dikdortgen icin isaretli mesafe. */
function roundedRectDist(x, y, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(x - cx) - (halfW - r)
  const dy = Math.abs(y - cy) - (halfH - r)
  const ax = Math.max(dx, 0)
  const ay = Math.max(dy, 0)
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(ax, ay) - r
}

/** Mesafeyi 0..1 kapsama cevirir (1 px yumusak gecis). */
function cover(dist, feather = 0.8) {
  return clamp01(0.5 - dist / feather)
}

function normAngle(a) {
  let v = a % (Math.PI * 2)
  if (v < 0) v += Math.PI * 2
  return v
}

/** start'tan sweep kadar saat yonunde uzanan yayin icinde miyiz? */
function inArc(x, y, cx, cy, start, sweep) {
  const a = normAngle(Math.atan2(y - cy, x - cx) - start)
  return a <= sweep
}

function over(top, bottom) {
  const a = top[3] + bottom[3] * (1 - top[3])
  if (a === 0) return [0, 0, 0, 0]
  const f = (i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / a
  return [f(0), f(1), f(2), a]
}

function mix(a, b, t) {
  return a + (b - a) * t
}

function render(size, painter) {
  const out = Buffer.alloc(size * size * 4)
  const n = SAMPLES * SAMPLES
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = px + (sx + 0.5) / SAMPLES
          const y = py + (sy + 0.5) / SAMPLES
          const c = painter(x, y)
          r += c[0] * c[3]
          g += c[1] * c[3]
          b += c[2] * c[3]
          a += c[3]
        }
      }
      const alpha = a / n
      const i = (py * size + px) * 4
      out[i] = a > 0 ? Math.round(clamp01(r / a) * 255) : 0
      out[i + 1] = a > 0 ? Math.round(clamp01(g / a) * 255) : 0
      out[i + 2] = a > 0 ? Math.round(clamp01(b / a) * 255) : 0
      out[i + 3] = Math.round(clamp01(alpha) * 255)
    }
  }
  return out
}

// --------------------------------------------------------------- ikon tasarimi

const GRAD_FROM = [0.31, 0.27, 0.9] // #4F46E5
const GRAD_TO = [0.65, 0.29, 0.93] // #A64AEE

/** Zamanlayici halkasi: acik iz + parlak ilerleme yayi + merkez nokta. */
function ringLayers(x, y, size, color, trackAlpha, opts = {}) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * (opts.radius ?? 0.3)
  const thickness = size * (opts.thickness ?? 0.075)
  const feather = Math.max(0.8, size * 0.004)

  const ringDist = Math.abs(Math.hypot(x - cx, y - cy) - radius) - thickness / 2
  const onRing = cover(ringDist, feather)

  let layer = [0, 0, 0, 0]
  if (onRing > 0) {
    // Saat 12'den baslayip saat yonunde %75 dolu bir ilerleme yayi.
    const start = -Math.PI / 2
    const sweep = Math.PI * 1.5
    const bright = inArc(x, y, cx, cy, start, sweep)
    layer = [color[0], color[1], color[2], onRing * (bright ? 1 : trackAlpha)]
  }

  const dotR = size * (opts.dot ?? 0.052)
  const dot = cover(Math.hypot(x - cx, y - cy) - dotR, feather)
  if (dot > 0) layer = over([color[0], color[1], color[2], dot], layer)

  // Ilerleme yayinin ucundaki kucuk yuvarlak baslik.
  const capA = -Math.PI / 2 + Math.PI * 1.5
  const capX = cx + Math.cos(capA) * radius
  const capY = cy + Math.sin(capA) * radius
  const cap = cover(Math.hypot(x - capX, y - capY) - thickness / 2, feather)
  if (cap > 0) layer = over([color[0], color[1], color[2], cap], layer)

  return layer
}

function appIconPainter(size) {
  const inset = size * 0.085
  const half = size / 2 - inset
  const radius = size * 0.225
  const feather = Math.max(0.8, size * 0.0025)
  return (x, y) => {
    const bgA = cover(roundedRectDist(x, y, size / 2, size / 2, half, half, radius), feather)
    if (bgA <= 0) return [0, 0, 0, 0]
    const t = clamp01((x + y) / (size * 2))
    const bg = [
      mix(GRAD_FROM[0], GRAD_TO[0], t),
      mix(GRAD_FROM[1], GRAD_TO[1], t),
      mix(GRAD_FROM[2], GRAD_TO[2], t),
      bgA
    ]
    const ring = ringLayers(x, y, size, [1, 1, 1], 0.28)
    // Halkayi arkaplanin disina tasirma.
    const clipped = [ring[0], ring[1], ring[2], ring[3] * bgA]
    return over(clipped, bg)
  }
}

function trayPainter(size, color) {
  return (x, y) =>
    ringLayers(x, y, size, color, 0.32, { radius: 0.33, thickness: 0.135, dot: 0.075 })
}

// --------------------------------------------------------------------- yazma

function write(relPath, size, painter) {
  const abs = path.join(ROOT, relPath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, encodePng(size, render(size, painter)))
  const kb = (fs.statSync(abs).size / 1024).toFixed(1)
  console.log(`  ${relPath.padEnd(30)} ${size}x${size}  ${kb} KB`)
}

console.log('Ikonlar uretiliyor...')
write('build/icon.png', 1024, appIconPainter(1024))
write('resources/trayTemplate.png', 22, trayPainter(22, [0, 0, 0]))
write('resources/trayTemplate@2x.png', 44, trayPainter(44, [0, 0, 0]))
write('resources/tray.png', 32, trayPainter(32, [0.39, 0.4, 0.95]))
console.log('Tamam.')
