// Picking a color from the site itself, and building themes around it. The picker knows where a
// color came from, because that says what job it does: a button's fill is the brand color, a big
// area's is the background, dark text is the text color, a card is the surface, a soft fill is a
// tint. Five themes are then built around it, the picked color kept in its role:
//
//   Monochrome     the color and shades of itself
//   Analogous      with a neighbouring hue           Complementary  with the opposite hue
//   Split          with a near-opposite hue          Triadic        a bolder third hue
//
// Each follows Kamiliyon's rules: 60-30-10 (calm page and surfaces, supporting tints, the brand
// saved for what you click), neutrals tinted from the brand's hue, text on the brand chosen by
// lightness rather than hue (dark text on a vivid yellow), success, warning, danger and info keeping
// their meaning, every pairing checked, and a dark twin built properly, not inverted.

import { contrastRatio, hexToRgb, hslToRgb, luminance, mix, rgbToHex, rgbToHsl } from './color.js'
import { fixAll } from './contrast.js'
import { collectColors, inferRoles } from './scan.js'
import { backgroundBehind, kindOf, rgbaOf, textOf, toHex, whereOf } from './studio.js'
import { completeTokens } from './tokens.js'

const hsl = (h, s, l) => rgbToHex(hslToRgb([((h % 360) + 360) % 360, Math.min(1, Math.max(0, s)), Math.min(1, Math.max(0, l))]))
const toHsl = (hex) => rgbToHsl(hexToRgb(hex))

/** The jobs a picked color can do, in the panel's words. */
export const PICK_ROLES = [
  { id: 'brand', label: 'Brand', note: 'buttons, links and highlights' },
  { id: 'background', label: 'Background', note: 'the page itself' },
  { id: 'text', label: 'Text', note: 'headings and body text' },
  { id: 'surface', label: 'Card', note: 'cards and panels' },
  { id: 'tint', label: 'Tint', note: 'badges and soft bands' },
]

const solidFill = (el) => {
  const [r, g, b, a] = rgbaOf(getComputedStyle(el).backgroundColor)
  return a > 0.5 ? rgbToHex([r, g, b]) : null
}
const saturated = (hex) => toHsl(hex)[1] >= 0.28 && toHsl(hex)[2] > 0.12 && toHsl(hex)[2] < 0.9

/**
 * What a click on the page picked: the color, the job it does on the site, and words to describe
 * it ("Button “Sign up”, in the header"). Buttons and links give the brand; big areas the background;
 * text the text color (or the brand, when the text is colored); cards the surface; soft fills a tint.
 */
export function readPick(el) {
  const kind = kindOf(el)
  const fill = solidFill(el)
  const text = toHex(getComputedStyle(el).color)
  const r = el.getBoundingClientRect()
  const big = r.width * r.height > window.innerWidth * window.innerHeight * 0.18 || r.width > window.innerWidth * 0.8
  let colour
  let role
  if (kind === 'Button') [colour, role] = fill ? [fill, 'brand'] : [text, saturated(text ?? '#000') ? 'brand' : 'text']
  else if (kind === 'Link' || kind === 'Icon') [colour, role] = [text, saturated(text ?? '#000') ? 'brand' : 'text']
  else if (kind === 'Heading' || kind === 'Text') {
    // Text with a fill of its own is a badge or a highlight: its fill is a tint (or the brand).
    if (fill && !big) [colour, role] = [fill, saturated(fill) && toHsl(fill)[2] < 0.75 ? 'brand' : 'tint']
    else [colour, role] = [text, saturated(text ?? '#000') ? 'brand' : 'text']
  } else if (kind === 'Card') [colour, role] = [fill ?? backgroundBehind(el), 'surface']
  else if (fill && !big) [colour, role] = [fill, saturated(fill) && toHsl(fill)[2] < 0.75 ? 'brand' : 'tint']
  else [colour, role] = [fill ?? backgroundBehind(el), 'background']
  return { colour: colour ?? '#000000', role, kind, text: textOf(el), where: whereOf(el) }
}

/** The site's own brand color, from the colors on the page, for picks that don't give one (read once a page). */
let brandRead = null
function siteBrand() {
  if (brandRead && brandRead.page === location.href) return brandRead.colour
  let colour = null
  try {
    colour = inferRoles(collectColors()).roles.primary ?? null
  } catch {}
  brandRead = { page: location.href, colour }
  return colour
}

/** Text that reads best on a color, by lightness: white on a deep brand, near-black on a vivid yellow. */
const textOn = (colour, H) =>
  ['#ffffff', hsl(H, 0.3, 0.12), '#000000'].reduce((best, c) => (contrastRatio(c, colour) > contrastRatio(best, colour) + 0.4 ? c : best))

/** The roles the picked color fixes, with the brand worked out when the pick isn't the brand. */
function baseRoles(colour, role, brandFallback) {
  const [H, S, L] = toHsl(colour)
  // Dark or light by what reads on it: white text, or near-black (mid-tones fall on either side).
  const dark = textOn(colour, H) === '#ffffff'
  // A brand from the picked color's own hue when it has one, else the site's own brand.
  const brandFrom = (light) => (S >= 0.15 ? hsl(H, Math.max(S, 0.55), light ? 0.62 : 0.42) : (brandFallback ?? hsl(250, 0.6, light ? 0.65 : 0.5)))
  switch (role) {
    case 'background':
      return dark
        ? { background: colour, surface: hsl(H, S * 0.7, Math.min(0.3, L + 0.05)), ink: hsl(H, 0.12, 0.93), primary: brandFrom(true), dark: true }
        : { background: colour, surface: L > 0.97 ? '#ffffff' : hsl(H, S * 0.6, Math.min(0.995, L + 0.02)), ink: hsl(H, 0.2, 0.13), primary: brandFrom(false) }
    case 'text': {
      // On whichever page it reads better on: a dark text color on a light page, a light one on a dark page.
      const lightPage = contrastRatio(colour, '#ffffff') >= contrastRatio(colour, hsl(H, 0.25, 0.08))
      return lightPage ? { ink: colour, primary: brandFrom(false) } : { ink: colour, background: hsl(H, 0.25, 0.08), surface: hsl(H, 0.22, 0.12), primary: brandFrom(true), dark: true }
    }
    case 'surface':
      return { surface: colour, background: hsl(H, S * 0.5, dark ? Math.max(0.04, L - 0.04) : Math.max(0.9, L - 0.025)), ...(dark ? { ink: hsl(H, 0.12, 0.93), dark: true } : {}), primary: brandFrom(dark) }
    case 'tint':
      return { secondary: colour, 'on-secondary': textOn(colour, H), primary: S >= 0.15 ? hsl(H, Math.max(S, 0.55), 0.42) : (brandFallback ?? hsl(250, 0.6, 0.5)) }
    default:
      // Lightness beats hue: a brand too light to read on a white page (a vivid yellow, a cyan)
      // goes on a dark page, where it does.
      // (5.5 rather than 4.5 leaves room for the tinted badges and pills brand text sits on.)
      return contrastRatio(colour, '#ffffff') < 5.5 ? { primary: colour, dark: true } : { primary: colour }
  }
}

/** The token a picked color becomes, by its role. */
const PICKED_KEY = { brand: 'primary', background: 'background', text: 'ink', surface: 'surface', tint: 'secondary' }

const VARIANTS = [
  { id: 'mono', name: 'Monochrome', alt: 0, mono: true },
  { id: 'analogous', name: 'Analogous', alt: 32 },
  { id: 'complement', name: 'Complementary', alt: 180 },
  { id: 'split', name: 'Split', alt: 150 },
  { id: 'triadic', name: 'Triadic', alt: 120, bold: true },
]

/** A color moved in lightness, away from the backgrounds, until it reads on all of them (hue kept). */
function readableOn(colour, bgs, min) {
  const reads = (c) => bgs.every((bg) => contrastRatio(c, bg) >= min)
  if (reads(colour)) return colour
  const [h, s, l] = toHsl(colour)
  const lightPage = bgs.every((bg) => luminance(bg) > 0.18)
  for (let step = 0.02; step <= 1; step += 0.02) {
    const c = hsl(h, s, lightPage ? l - step : l + step)
    if (reads(c)) return c
  }
  return lightPage ? hsl(h, s, 0.08) : hsl(h, s, 0.95)
}

/** The app area (dashboards, panels inside the site): a calm field of the page, its text and links reading on it. */
function appTokens(t, H, S, dark) {
  const bg = dark ? mix(t.surface, t.background, 0.6) : mix(t.secondary, t.background, 0.35)
  const [, , l] = toHsl(bg)
  const input = hsl(H, Math.min(S, 0.3) * 0.4, dark ? l + 0.05 : l - 0.04)
  return {
    'app-background': bg,
    'app-input': input,
    'app-border': hsl(H, Math.min(S, 0.3) * 0.5, dark ? l + 0.12 : l - 0.12),
    'app-primary': readableOn(t.primary, [bg, input], 4.5),
    'app-shadow-dark': hsl(H, Math.min(S, 0.3) * 0.5, Math.max(0, l - 0.08)),
    'app-shadow-light': hsl(H, Math.min(S, 0.3) * 0.3, Math.min(0.99, l + 0.08)),
    'app-ink': readableOn(t.ink, [bg, input], 4.5),
    'app-ink-muted': readableOn(t['ink-secondary'], [bg, input], 4.5),
  }
}

/** One theme: the base roles, a partner hue, and every other color derived to fit, checked. */
function build(base, variant) {
  const primary = base.primary
  const [H, S] = toHsl(primary)
  const dark = Boolean(base.dark)
  const sat = Math.max(S, 0.45)
  const alt = variant.mono ? hsl(H, Math.max(S * 0.8, 0.35), dark ? 0.72 : 0.58) : hsl(H + variant.alt, sat, dark ? 0.62 : 0.5)
  const [AH] = toHsl(alt)
  // Neutrals borrow the brand's hue: surfaces, borders and shadows carry a hint of it.
  const background = base.background ?? (dark ? hsl(H, 0.25, 0.09) : hsl(H, Math.min(S, 0.5) * (variant.bold ? 0.55 : 0.35), variant.bold ? 0.965 : 0.985))
  const surface = base.surface ?? (dark ? hsl(H, 0.22, 0.13) : hsl(H, Math.min(S, 0.4) * 0.15, 0.997))
  const ink = base.ink ?? (dark ? hsl(H, 0.12, 0.93) : hsl(H, 0.2, 0.13))
  // Supporting tints, the "30": the picked tint, else a soft wash of the brand (or its partner).
  const tintHue = variant.mono ? H : variant.bold ? AH : H
  const secondary = base.secondary ?? (dark ? hsl(tintHue, Math.min(sat, 0.5), 0.2) : hsl(tintHue, Math.min(sat, 0.7) * 0.6, variant.bold ? 0.88 : 0.92))
  const accent = dark ? hsl(AH, Math.min(sat, 0.5), 0.2) : hsl(AH, Math.min(sat, 0.7) * 0.55, 0.93)
  const data = Array.from({ length: 8 }, (_, i) =>
    variant.mono ? hsl(H, Math.max(sat - i * 0.04, 0.3), (dark ? 0.72 : 0.32) + (i % 4) * (dark ? -0.08 : 0.1)) : hsl(H + (variant.alt || 40) * (i + 1) * 0.5, sat, dark ? 0.62 : 0.45),
  )
  const tokens = completeTokens({
    primary,
    'primary-dark': dark ? hsl(H, Math.min(sat, 0.7), 0.78) : hsl(H, Math.min(sat, 0.7), 0.25),
    'primary-alt': alt,
    'on-primary': textOn(primary, H),
    background,
    surface,
    secondary,
    'on-secondary': base['on-secondary'] ?? (dark ? hsl(tintHue, 0.4, 0.88) : hsl(tintHue, Math.min(sat, 0.8), 0.25)),
    accent,
    'on-accent': dark ? hsl(AH, 0.4, 0.88) : hsl(AH, Math.min(sat, 0.8), 0.28),
    border: dark ? hsl(H, 0.2, 0.22) : hsl(H, Math.min(S, 0.4) * 0.5, 0.88),
    shadow: dark ? hsl(H, 0.5, 0.03) : hsl(H, 0.4, 0.12),
    ink,
    'ink-secondary': dark ? hsl(H, 0.1, 0.78) : hsl(H, 0.15, 0.32),
    'ink-muted': dark ? hsl(H, 0.08, 0.68) : hsl(H, 0.12, 0.4),
    // Colors with a meaning keep it, whatever the theme: green for done, amber for careful,
    // red for stop, blue for information (lifted in a dark theme so they still read).
    success: dark ? '#4ade80' : '#15803d',
    warning: dark ? '#fbbf24' : '#b45309',
    danger: dark ? '#f87171' : '#b91c1c',
    info: dark ? '#60a5fa' : '#1d4ed8',
    ...Object.fromEntries(data.map((hex, i) => [`data-${i + 1}`, hex])),
  })
  // Colors drawn on the page (brand, its partner, chart colors, the app area's) are made to read on
  // this theme's own page and cards from the start, by lightness, keeping their hue.
  const page = [tokens.background, tokens.surface]
  if (base.picked !== 'primary') tokens.primary = readableOn(tokens.primary, page, 4.5)
  tokens['primary-dark'] = readableOn(tokens['primary-dark'], page, 4.5)
  tokens['primary-alt'] = readableOn(tokens['primary-alt'], page, 3)
  for (let i = 1; i <= 8; i++) tokens[`data-${i}`] = readableOn(tokens[`data-${i}`], page, 4.5)
  tokens['ink-secondary'] = readableOn(tokens['ink-secondary'], page, 4.5)
  tokens['ink-muted'] = readableOn(tokens['ink-muted'], page, 4.5)
  tokens['on-primary'] = textOn(tokens.primary, H)
  Object.assign(tokens, appTokens(tokens, H, S, dark))
  let fixed = { ...tokens, ...fixAll(tokens) }
  fixed = { ...fixed, ...fixAll(fixed) }
  // The picked color stays exactly as picked, in its role; everything else may move to read.
  fixed[base.picked] = base[base.picked]
  return fixed
}

/** A name for a color, from its hue: "Purple", "Teal", "Grey". */
export function colourName(hex) {
  const [h, s, l] = toHsl(hex)
  if (s < 0.12) return l > 0.85 ? 'White' : l < 0.18 ? 'Black' : 'Grey'
  const names = [[15, 'Red'], [40, 'Orange'], [65, 'Yellow'], [90, 'Lime'], [150, 'Green'], [185, 'Teal'], [205, 'Cyan'], [240, 'Blue'], [255, 'Indigo'], [295, 'Purple'], [330, 'Pink'], [360, 'Red']]
  return names.find(([max]) => h <= max)[1]
}

/** Five themes around a picked color, its role kept. */
export function themesFromPick(colour, role) {
  const base = { ...baseRoles(colour, role, role === 'brand' ? null : siteBrand()), picked: PICKED_KEY[role] }
  const name = colourName(colour)
  const stamp = Date.now().toString(36)
  return VARIANTS.map((v) => ({
    id: `pick-${stamp}-${v.id}`,
    name: `${name} ${v.name.toLowerCase()}`,
    derived: true,
    picked: true,
    tokens: build(base, v),
  }))
}
