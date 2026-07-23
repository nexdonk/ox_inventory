import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchNui } from '../utils/fetchNui';

export interface NexButtonGradients {
  gradient?: string;
  shadow?: string;
  text?: string;
}

export interface NexMoneyColors {
  money?: string;
  blackMoney?: string;
}

/**
 * Per-component icon colour overrides. Any key omitted keeps tracking
 * PrimaryColor automatically — these are purely additive overrides.
 *
 * `sectionHeaders.<type>` — section header icon for the matching right/left
 *   inventory type (e.g. shop, crafting, stash, trunk, glovebox, drop,
 *   container, player, inspect, plus the literals "inventory" and "hotbar"
 *   used by the player side).
 * `filters.<id>` — colour for a filter chip (clothing, all, food, heal,
 *   weapon).
 * `cart` — accent colour for the shopping cart's title icon.
 */
export interface NexIconColors {
  sectionHeaders?: Record<string, string>;
  filters?: Record<string, string>;
  cart?: string;
}

export interface NexThemeSettings {
  PrimaryColor?: string;
  buttonGradients?: NexButtonGradients;
  money?: NexMoneyColors;
  icons?: NexIconColors;
}

export interface NexProfile {
  name?: string;
  identifier?: string;
  avatarUrl?: string;
}

export interface NexConfig {
  profileType: 'discord' | 'steam' | 'mugshot';
  useCitizenId: boolean;
  useNativeLabeling: boolean;
  mouseTrail: { enabled: boolean; color?: { r: number; g: number; b: number } };
  /** Global size multiplier for the whole UI (fonts, icons, grids). 1.0 = default. */
  uiScale?: number;
  theme: NexThemeSettings;
  profile: NexProfile;
}

const DEFAULT_CONFIG: NexConfig = {
  profileType: 'discord',
  useCitizenId: false,
  useNativeLabeling: true,
  mouseTrail: { enabled: false },
  uiScale: 1.0,
  theme: { PrimaryColor: '#3B82F6' },
  profile: {},
};

const NexContext = createContext<NexConfig>(DEFAULT_CONFIG);

export const useNexConfig = (): NexConfig => useContext(NexContext);

type RGB = { r: number; g: number; b: number };

const parseHex = (hex?: string): RGB | null => {
  if (!hex) return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const clamp = (v: number, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, v));

const toHex = ({ r, g, b }: RGB): string =>
  '#' + [r, g, b].map((v) => clamp(Math.round(v)).toString(16).padStart(2, '0')).join('').toUpperCase();

const rgbStr = ({ r, g, b }: RGB) => `${Math.round(r)},${Math.round(g)},${Math.round(b)}`;

const rgba = ({ r, g, b }: RGB, a: number) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;

// sRGB relative luminance, 0..1 (per WCAG)
const luminance = ({ r, g, b }: RGB): number => {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const mix = (a: RGB, b: RGB, t: number): RGB => ({
  r: a.r + (b.r - a.r) * t,
  g: a.g + (b.g - a.g) * t,
  b: a.b + (b.b - a.b) * t,
});
const lighten = (c: RGB, t: number) => mix(c, { r: 255, g: 255, b: 255 }, t);
const darken = (c: RGB, t: number) => mix(c, { r: 0, g: 0, b: 0 }, t);

// The whole UI is dark and uses the primary at low alpha for borders, glows,
// and scrollbars. Pure black would vanish into that dark scrim, so nudge very
// dark primaries up. White is fine against the dark UI (and is the original
// monochrome theme) — no upper clamp.
const ensureUiSafe = (c: RGB): RGB => {
  const L = luminance(c);
  if (L < 0.18) return lighten(c, Math.min(1, (0.18 - L) * 3.0));
  return c;
};

interface DerivedPalette {
  primaryHex: string;
  primaryRgb: string;
  btnGradient: string;
  btnShadow: string;
  btnText: string;
  moneyCash: string;
  moneyBank: string;
  trailRgb: string;
}

const derivePalette = (primaryHex?: string): DerivedPalette => {
  const parsed = parseHex(primaryHex) ?? { r: 59, g: 130, b: 246 };
  const base = ensureUiSafe(parsed);

  const gradStart = lighten(base, 0.18);
  const gradEnd = darken(base, 0.22);
  const midL = luminance(mix(gradStart, gradEnd, 0.5));

  return {
    primaryHex: toHex(base),
    primaryRgb: rgbStr(base),
    btnGradient: `linear-gradient(135deg, ${toHex(gradStart)} 0%, ${toHex(gradEnd)} 100%)`,
    btnShadow: rgba(base, 0.45),
    btnText: midL > 0.55 ? '#0B0B12' : '#FFFFFF',
    moneyCash: toHex(lighten(base, 0.18)),
    moneyBank: toHex(darken(base, 0.28)),
    trailRgb: rgbStr(base),
  };
};

const applyCssVars = (cfg: NexConfig) => {
  const root = document.documentElement;
  const t = cfg.theme || {};
  const p = derivePalette(t.PrimaryColor);

  // Global UI scale — multiplies the root font-size (all rem sizing) and
  // --grid-size together. Clamped so a config typo can't push the layout
  // off-screen: past ~1.1 the player column (5-row grid + hotbar) no
  // longer fits a 16:9 screen vertically.
  const rawScale = typeof cfg.uiScale === 'number' && isFinite(cfg.uiScale) ? cfg.uiScale : 1.0;
  root.style.setProperty('--ui-scale', String(Math.min(1.1, Math.max(0.7, rawScale))));

  // Primary — always derived (UI-safe clamped) so dark/blown-out picks still read.
  root.style.setProperty('--nex-primary', p.primaryHex);
  root.style.setProperty('--nex-primary-rgb', p.primaryRgb);

  // Buttons — explicit overrides win, otherwise auto-derive from primary.
  root.style.setProperty('--nex-btn-gradient', t.buttonGradients?.gradient || p.btnGradient);
  root.style.setProperty('--nex-btn-shadow', t.buttonGradients?.shadow || p.btnShadow);
  root.style.setProperty('--nex-btn-text', t.buttonGradients?.text || p.btnText);

  // Money — explicit overrides win.
  root.style.setProperty('--nex-money-cash', t.money?.money || p.moneyCash);
  root.style.setProperty('--nex-money-bank', t.money?.blackMoney || p.moneyBank);

  // Mouse trail — explicit RGB wins, otherwise track the primary.
  const mt = cfg.mouseTrail?.color;
  root.style.setProperty(
    '--nex-trail-rgb',
    mt ? `${mt.r},${mt.g},${mt.b}` : p.trailRgb,
  );

  // Per-component icon colours. Each variable is set ONLY when the customer
  // provides a hex; CSS rules use `var(--nex-icon-foo-rgb, var(--nex-primary-rgb))`
  // so anything left out automatically tracks the primary theme.
  const setRgbVar = (varName: string, hex?: string) => {
    if (!hex) {
      root.style.removeProperty(varName);
      return;
    }
    const parsed = parseHex(hex);
    if (!parsed) return;
    root.style.setProperty(varName, rgbStr(parsed));
  };

  const icons = t.icons || {};
  const sectionTones = [
    'inventory', 'hotbar', 'shop', 'crafting', 'stash',
    'trunk', 'glovebox', 'container', 'drop', 'newdrop',
    'player', 'inspect',
  ];
  sectionTones.forEach((tone) => {
    setRgbVar(`--nex-icon-section-${tone}-rgb`, icons.sectionHeaders?.[tone]);
  });

  const filterIds = ['clothing', 'all', 'food', 'heal', 'weapon'];
  filterIds.forEach((id) => {
    setRgbVar(`--nex-filter-${id}-rgb`, icons.filters?.[id]);
  });

  setRgbVar('--nex-cart-icon-rgb', icons.cart);
};

export const NexProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<NexConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetchNui<NexConfig>('getNexConfig')
      .then((cfg) => {
        if (!cfg) {
          console.warn('[NEX] no config returned from Lua — using defaults');
          applyCssVars(DEFAULT_CONFIG);
          return;
        }
        const merged: NexConfig = {
          ...DEFAULT_CONFIG,
          ...cfg,
          theme: { ...DEFAULT_CONFIG.theme, ...(cfg.theme || {}) },
        };
        const palette = derivePalette(merged.theme.PrimaryColor);
        console.log('[NEX] received config from Lua:', {
          PrimaryColor: merged.theme.PrimaryColor,
          derived: palette,
          overrides: {
            gradient: merged.theme.buttonGradients?.gradient,
            shadow: merged.theme.buttonGradients?.shadow,
            text: merged.theme.buttonGradients?.text,
            cash: merged.theme.money?.money,
            bank: merged.theme.money?.blackMoney,
          },
          mouseTrail: merged.mouseTrail?.enabled,
        });
        setConfig(merged);
        applyCssVars(merged);
      })
      .catch((err) => {
        console.warn('[NEX] fetch failed, using defaults:', err);
        applyCssVars(DEFAULT_CONFIG);
      });
  }, []);

  return <NexContext.Provider value={config}>{children}</NexContext.Provider>;
};

export default NexProvider;
