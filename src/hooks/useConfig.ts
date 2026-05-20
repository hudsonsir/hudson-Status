/** 读取站点 `config.json`（站点名、RPC 等），并在内存中扁平化 user_preferences 以兼容旧用法。 */
import { useEffect, useState } from 'react';
import type { SiteConfig } from '@/lib/nodeget-types';

/** 把 NodeGet 规范的嵌套 user_preferences 与扁平字段合并，扁平字段优先以保持向后兼容。 */
function normalizeConfig(raw: SiteConfig): SiteConfig {
  const prefs = raw.user_preferences || {};
  return {
    ...raw,
    site_name:
      raw.site_name ??
      (typeof prefs.site_name === 'string' ? prefs.site_name : undefined),
    site_logo:
      raw.site_logo ??
      (typeof prefs.site_logo === 'string' ? prefs.site_logo : undefined),
    footer:
      raw.footer ??
      (typeof prefs.footer === 'string' ? prefs.footer : undefined),
  };
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
      .then((c) => alive && setConfig(normalizeConfig(c)))
      .catch((e) => alive && setError(e));
    return () => {
      alive = false;
    };
  }, []);

  return { config, error };
}
