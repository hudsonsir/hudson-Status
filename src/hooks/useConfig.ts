/** 读取站点 `config.json`（站点名、RPC 等），并在内存中扁平化 user_preferences 以兼容旧用法。 */
import { useEffect, useState } from 'react';
import type { SiteConfig } from '@/lib/nodeget-types';

/** 把 NodeGet 规范的嵌套 user_preferences 与扁平字段合并，扁平字段优先以保持向后兼容。 */
function normalizeConfig(raw: SiteConfig): SiteConfig {
  const prefs = raw.user_preferences || {};
  const pick = (key: keyof SiteConfig) => {
    const flat = raw[key];
    if (typeof flat === 'string') return flat;
    const nested = (prefs as Record<string, unknown>)[key as string];
    return typeof nested === 'string' ? nested : undefined;
  };
  return {
    ...raw,
    site_name: pick('site_name'),
    site_title: pick('site_title'),
    site_logo: pick('site_logo'),
    site_favicon: pick('site_favicon'),
    footer: pick('footer'),
  };
}

/** 把站点偏好同步到 <head>：title、favicon。 */
function applyDocumentMeta(c: SiteConfig) {
  if (typeof document === 'undefined') return;
  const title = c.site_title || c.site_name;
  if (title) document.title = title;

  const favicon = c.site_favicon || '/favicon.svg';
  let link = document.getElementById('site-favicon') as HTMLLinkElement | null;
  if (!link) {
    link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  }
  if (!link) {
    link = document.createElement('link');
    link.id = 'site-favicon';
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = favicon;
  if (favicon.endsWith('.svg')) link.type = 'image/svg+xml';
  else if (favicon.endsWith('.png')) link.type = 'image/png';
  else if (favicon.endsWith('.ico')) link.type = 'image/x-icon';
}

export function useConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('./config.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`config.json ${r.status}`);
        return r.json() as Promise<SiteConfig>;
      })
      .then((c) => {
        if (!alive) return;
        const normalized = normalizeConfig(c);
        applyDocumentMeta(normalized);
        setConfig(normalized);
      })
      .catch((e) => alive && setError(e));
    return () => {
      alive = false;
    };
  }, []);

  return { config, error };
}
