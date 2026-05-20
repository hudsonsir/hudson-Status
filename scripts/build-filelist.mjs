/**
 * postbuild：扫描 dist/ 生成 nodeget-theme-files.json。
 * 文件路径相对 dist/，正斜杠，不含起始斜杠。
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve, relative, sep, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'dist')

function walk(dir, list) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, list)
    else list.push(full)
  }
}

const files = []
walk(distDir, files)

const out = resolve(distDir, 'nodeget-theme-files.json')
const list = files
  .map((f) => relative(distDir, f).split(sep).join('/'))
  .filter((p) => p !== 'nodeget-theme-files.json')
  .sort()

// 写一次，让自身也出现在列表里
writeFileSync(out, JSON.stringify(list, null, 2) + '\n')
const finalList = [...list, 'nodeget-theme-files.json'].sort()
writeFileSync(out, JSON.stringify(finalList, null, 2) + '\n')
console.log(`[build-filelist] wrote ${finalList.length} entries to dist/nodeget-theme-files.json`)
