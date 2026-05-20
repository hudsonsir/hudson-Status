/**
 * postbuild：根据环境变量生成/覆盖 dist/config.json。
 *
 * 优先级（从高到低）：
 *   1. NODEGET_CONFIG    - 完整 JSON 字符串，直接写入
 *   2. SITE_n + SITE_*   - 兼容旧版的扁平字段写法
 *   3. 不动已有 dist/config.json
 */
import { writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(root, 'dist')
const out = existsSync(distDir)
  ? resolve(distDir, 'config.json')
  : resolve(root, 'public/config.json')

// 1) NODEGET_CONFIG 直接写入
const raw = process.env.NODEGET_CONFIG?.trim()
if (raw) {
  try {
    const parsed = JSON.parse(raw)
    writeFileSync(out, JSON.stringify(parsed, null, 2) + '\n')
    console.log(`[build-config] wrote NODEGET_CONFIG -> ${out}`)
    process.exit(0)
  } catch (e) {
    console.error('[build-config] NODEGET_CONFIG 无法解析为 JSON:', e?.message || e)
    process.exit(1)
  }
}

// 2) 兼容 SITE_n
function parseSite(raw) {
  const out = {}
  const re = /(\w+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^,]*))(?:\s*,\s*|\s*$)/g
  let m
  while ((m = re.exec(raw))) {
    const key = m[1]
    const val = m[2] !== undefined ? m[2].replace(/\\(.)/g, '$1') : (m[3] ?? '').trim()
    out[key] = val
  }
  return out
}

const tokens = []
for (let i = 1; ; i++) {
  const raw = process.env[`SITE_${i}`]
  if (!raw?.trim()) break
  const fields = parseSite(raw)
  tokens.push({
    name: fields.name || `master-${i}`,
    backend_url: fields.backend_url || fields.url || '',
    token: fields.token || '',
  })
}

if (!tokens.length) {
  console.log(`[build-config] no NODEGET_CONFIG / SITE_n env vars, keeping existing ${out}`)
  process.exit(0)
}

const config = {
  user_preferences: {
    site_name: process.env.SITE_NAME || 'NodeGet Status',
    site_logo: process.env.SITE_LOGO || '',
    footer: process.env.SITE_FOOTER || 'Powered by NodeGet',
  },
  site_tokens: tokens,
}

writeFileSync(out, JSON.stringify(config, null, 2) + '\n')
console.log(`[build-config] wrote ${tokens.length} site_tokens -> ${out}`)
