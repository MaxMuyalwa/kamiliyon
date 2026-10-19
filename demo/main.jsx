import { StrictMode, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeSwitcher } from '../src/index.js'
import { SiteThemeProvider } from './site/siteSettings.jsx'
import { config } from './site/config.js'
import { ThemedFavicon } from './site/Favicon.jsx'
import { Site } from './site/Site.jsx'
import { PREVIEW, previewConfig, setUpPreview } from './site/preview.js'
import './demo.css'

const siteConfig = PREVIEW ? previewConfig(config) : config

// index.html arrives with the page already in it (scripts/prerender.mjs), its entrance held
// still; once this render has replaced it, the entrance plays.
function Started() {
  useLayoutEffect(() => document.getElementById('root').removeAttribute('data-prerendered'), [])
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SiteThemeProvider config={siteConfig}>
      <Site />
      <ThemedFavicon />
      <ThemeSwitcher />
      <Started />
    </SiteThemeProvider>
  </StrictMode>,
)

if (PREVIEW) setUpPreview()
