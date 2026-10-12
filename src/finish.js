// Finishing with Kamiliyon: code and AI-editor prompts that keep the chosen colors for every
// visitor, bring the switcher back, or remove Kamiliyon. Shared by the panel's "I'm done" view
// and the Kamiliyon MCP server.

import { TOKEN_KEYS } from './tokens.js'

/** The production check for Vite projects; other bundlers use NODE_ENV. */
export const VITE_PROD = 'import.meta.env.PROD'
export const NODE_PROD = "process.env.NODE_ENV === 'production'"

const tokenLines = (tokens, indent) => TOKEN_KEYS.map((k) => `${indent}'${k}': '${tokens[k]}',`).join('\n')

/**
 * Code that makes the chosen colors the site's default and hides the switcher in production.
 * @param {'auto' | 'provider'} kind  the one-line setup (autoMount) or ThemeProvider
 * @param {'subtle' | 'balanced' | 'colorful'} [style]  the color style to keep with them
 */
export function keepSnippet(kind, name, tokens, prod = VITE_PROD, style = null) {
  const styleLine = style ? `\n  // How boldly the colors paint the site: 'subtle', 'balanced' or 'colorful'.\n  colourStyle: '${style === 'colourful' ? 'colorful' : style}',` : ''
  const theme = `defaultTheme: {\n    name: ${JSON.stringify(name)},\n    tokens: {\n${tokenLines(tokens, '      ')}\n    },\n  },${styleLine}\n  // Hides the color button in production; set to false to bring it back.\n  hidden: ${prod},`
  if (kind === 'auto') {
    return `// Replace \`import 'kamiliyon/auto'\` with:\nimport { autoMount } from 'kamiliyon/auto'\n\nautoMount({\n  ${theme}\n})`
  }
  return `// Add to the config you pass to <ThemeProvider>:\n<ThemeProvider config={{\n  ...config,\n  ${theme}\n}}>`
}

/** The theme as `--color-*` variables on :root. */
export const cssSnippet = (tokens) => `:root {\n${TOKEN_KEYS.map((k) => `  --color-${k}: ${tokens[k]};`).join('\n')}\n}`

export const keepPrompt = (name, tokens, style = null) =>
  `Update my Kamiliyon setup so the colors I chose become my site's default and the color switcher is hidden in production. In the Kamiliyon config (the autoMount({...}) call, or the config passed to <ThemeProvider>), set defaultTheme to { name: ${JSON.stringify(name)}, tokens: ${JSON.stringify(tokens)} }${style ? `, set colourStyle: '${style}'` : ''} and set hidden: ${VITE_PROD} (use ${NODE_PROD} if this isn't a Vite project). If the site uses import 'kamiliyon/auto', replace it with import { autoMount } from 'kamiliyon/auto' and an autoMount({...}) call with that config. Don't change anything else.`

export const BRING_BACK_PROMPT =
  "Show the Kamiliyon color switcher again in production: in its config (the autoMount({...}) call or the config passed to <ThemeProvider>), set hidden to false or remove the hidden line. Don't change anything else."

/** @param {boolean} recoloring  true when Kamiliyon was swapping the site's hard-coded colors */
export const removePrompt = (tokens, recolouring) =>
  recolouring
    ? `Remove Kamiliyon from this project but keep the colors it currently shows. The site's CSS uses hard-coded colors that Kamiliyon was swapping at runtime, so update the site's own CSS to use this palette instead (primary is the main brand color, background the page, ink the text): ${JSON.stringify(tokens)}. Then uninstall the kamiliyon package and delete its import (import 'kamiliyon/auto', autoMount, ThemeProvider or ThemeSwitcher) and any Kamiliyon pre-paint script in index.html.`
    : `Remove Kamiliyon from this project but keep my colors: add these CSS variables to my global stylesheet, replacing any existing --color-* values: ${cssSnippet(tokens)} Then uninstall the kamiliyon package and delete its usage (ThemeProvider, ThemeSwitcher, autoMount or import 'kamiliyon/auto') and any Kamiliyon pre-paint script in index.html. Keep kamiliyon/tokens.css only if nothing else needs it.`
