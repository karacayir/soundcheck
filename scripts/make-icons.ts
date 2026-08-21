#!/usr/bin/env tsx
/**
 * Generates the PWA icons from the same bar motif as the favicon.
 *
 * Hand-rolled PNG encoder rather than an image dependency: the icon is four
 * white rectangles on black, and pulling in a toolchain to draw that would be
 * more moving parts than the drawing.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Bars as [x, y, w, h] in a 32×32 grid, matching public/favicon.svg. */
const BARS: Array<[number, number, number, number]> = [
  [5, 13, 3, 6],
  [11, 8, 3, 16],
  [17, 4, 3, 24],
  [23, 11, 3, 10],
]

function render(size: number): Buffer {
  const scale = size / 32
  const pixels = Buffer.alloc(size * size * 4)

  // Black, fully opaque.
  for (let i = 0; i < size * size; i++) pixels[i * 4 + 3] = 255

  for (const [bx, by, bw, bh] of BARS) {
    const x0 = Math.round(bx * scale)
    const y0 = Math.round(by * scale)
    const x1 = Math.round((bx + bw) * scale)
    const y1 = Math.round((by + bh) * scale)
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const o = (y * size + x) * 4
        pixels[o] = 255
        pixels[o + 1] = 255
        pixels[o + 2] = 255
      }
    }
  }

  // PNG scanlines are prefixed with a filter byte; 0 = no filtering.
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }

  return png(size, size, deflateSync(raw, { level: 9 }))
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = -1
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function png(width: number, height: number, idat: Buffer): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  const file = join(process.cwd(), 'public', `icon-${size}.png`)
  writeFileSync(file, render(size))
  console.log(`wrote public/icon-${size}.png`)
}
