/**
 * postbuild：把 dist/ 整体打包为 dist-theme.zip，便于分发。
 */
import { createWriteStream, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Archiver } from 'archiver'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'dist')
const outDir = resolve(root, 'dist-zip')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
const outPath = resolve(outDir, 'theme.zip')

const output = createWriteStream(outPath)
const archive = new Archiver('zip', { zlib: { level: 9 } })

output.on('close', () => {
  console.log(`[build-zip] wrote ${archive.pointer()} bytes -> ${outPath}`)
})
archive.on('warning', (err) => {
  if (err.code === 'ENOENT') console.warn(err)
  else throw err
})
archive.on('error', (err) => {
  throw err
})

archive.pipe(output)
archive.directory(distDir, false)
await archive.finalize()
