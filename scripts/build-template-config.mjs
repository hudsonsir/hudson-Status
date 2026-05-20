/**
 * postbuild：将 package.json 的 version 同步到 dist/nodeget-theme.json，
 * 并在 dist/ 中生成简易 config.json（若环境变量未提供）。
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

const distDir = resolve(root, 'dist')
const themeOut = resolve(distDir, 'nodeget-theme.json')
const themeSrc = resolve(root, 'public/nodeget-theme.json')

let theme
if (existsSync(themeOut)) {
  theme = JSON.parse(readFileSync(themeOut, 'utf8'))
} else if (existsSync(themeSrc)) {
  copyFileSync(themeSrc, themeOut)
  theme = JSON.parse(readFileSync(themeOut, 'utf8'))
} else {
  theme = {
    name: pkg.name,
    short: pkg.name,
    description: '',
    author: '',
    repository: '',
    user_preferences_form: { version: '0.0.1', items: [] },
    version: pkg.version,
    license: '',
  }
}

theme.version = pkg.version
writeFileSync(themeOut, JSON.stringify(theme, null, 2) + '\n')
console.log(`[build-template-config] synced version=${pkg.version} to dist/nodeget-theme.json`)

const configOut = resolve(distDir, 'config.json')
if (!existsSync(configOut)) {
  const items = theme?.user_preferences_form?.items || []
  const userPrefs = {}
  for (const it of items) {
    if (it.type === 'title' || !it.key) continue
    if (it.default !== undefined) userPrefs[it.key] = it.default
  }
  const fallback = {
    user_preferences: userPrefs,
    site_tokens: [
      { name: 'master-1', backend_url: '', token: '' },
    ],
  }
  writeFileSync(configOut, JSON.stringify(fallback, null, 2) + '\n')
  console.log('[build-template-config] wrote dist/config.json fallback from defaults')
}
