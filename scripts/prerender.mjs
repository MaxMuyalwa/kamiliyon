// After `vite build --mode site`: renders the landing page (demo/prerender.jsx) and
// puts the HTML in demo/dist/kamiliyon/index.html, inside #root. Search engines that
// don't run scripts (Bing's scanner among them) then see the headings and text;
// visitors see no difference, because main.jsx renders the page over it as before
// (demo.css holds the hero's entrance until then, so it plays once).
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'vite'

const out = fileURLToPath(new URL('../demo/.prerender', import.meta.url))
// Where the page lives (the main site serves it there; /kamiliyon/ redirects to it).
const ADDRESS = 'https://www.mrmaxdesigns.com/kamiliyon'
const page = fileURLToPath(new URL('../demo/dist/kamiliyon/index.html', import.meta.url))

await build({
  configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
  mode: 'site',
  logLevel: 'warn',
  build: { ssr: fileURLToPath(new URL('../demo/prerender.jsx', import.meta.url)), outDir: out, emptyOutDir: true, rollupOptions: { input: undefined } },
})

// Just enough of a browser for the page to render on the server: it reads the
// address and saved settings while rendering, and this is a first visit to the page.
const memory = () => {
  const items = new Map()
  return { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => items.set(k, String(v)), removeItem: (k) => items.delete(k), clear: () => items.clear(), key: () => null, length: 0 }
}
Object.assign(globalThis, {
  window: globalThis,
  location: new URL(ADDRESS),
  localStorage: memory(),
  sessionStorage: memory(),
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => true,
  matchMedia: () => ({ matches: false, media: '', addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})

const { render } = await import(pathToFileURL(`${out}/prerender.js`).href)
const html = render()
const shell = readFileSync(page, 'utf8')
if (!shell.includes('<div id="root"></div>')) throw new Error('index.html has no empty #root to fill')
// The canonical address too, so search engines don't index the page twice.
const filled = shell
  .replace('</title>', `</title>
    <link rel="canonical" href="${ADDRESS}" />`)
  .replace('<div id="root"></div>', `<div id="root" data-prerendered>${html}</div>`)
writeFileSync(page, filled)
rmSync(out, { recursive: true, force: true })
console.log(`prerendered kamiliyon/index.html (${Math.round(html.length / 1024)} kB of page)`)
