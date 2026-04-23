/**
 * Genera iconos placeholder para la app móvil.
 * Ejecutar: node scripts/generate-assets.js
 */
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// CRC32 para PNG
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  const result = Buffer.alloc(4)
  result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 0)
  return result
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const lenBuffer = Buffer.alloc(4)
  lenBuffer.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuffer, data])
  return Buffer.concat([lenBuffer, typeBuffer, data, crc32(crcInput)])
}

function createPNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // color type RGB
  // bytes 10,11,12 = 0 (compression, filter, interlace)

  // pixel rows (filter byte 0 + RGB * width per row)
  const rowSize = 1 + width * 3
  const rawData = Buffer.alloc(height * rowSize)
  for (let y = 0; y < height; y++) {
    rawData[y * rowSize] = 0 // filter type: None
    for (let x = 0; x < width; x++) {
      const off = y * rowSize + 1 + x * 3
      rawData[off] = r
      rawData[off + 1] = g
      rawData[off + 2] = b
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const assetsDir = path.join(__dirname, '../apps/mobile/assets')
fs.mkdirSync(assetsDir, { recursive: true })

// Naranja primario: #f97316 → 249, 115, 22
const orange = { r: 249, g: 115, b: 22 }
// Blanco para adaptive icon foreground
const white = { r: 255, g: 255, b: 255 }

const files = [
  { name: 'icon.png',          size: 1024, ...orange },
  { name: 'splash.png',        size: 2048, ...orange },
  { name: 'adaptive-icon.png', size: 1024, ...white  },
  { name: 'favicon.png',       size: 64,   ...orange },
]

files.forEach(({ name, size, r, g, b }) => {
  const filePath = path.join(assetsDir, name)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createPNG(size, size, r, g, b))
    console.log(`✓ Creado ${name} (${size}x${size})`)
  } else {
    console.log(`↷ Ya existe ${name}, se omite`)
  }
})

console.log('\n✅ Assets listos en apps/mobile/assets/')
console.log('   Sustituye icon.png y splash.png con los diseños reales antes de publicar.')
