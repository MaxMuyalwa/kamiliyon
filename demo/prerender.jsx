// Renders the landing page to HTML at build time (scripts/prerender.mjs puts it in
// index.html's #root). In the browser main.jsx still renders the page as before and
// replaces this; it's here so search engines that don't run scripts see the page.
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { SiteThemeProvider } from './site/siteSettings.jsx'
import { config } from './site/config.js'
import { Site } from './site/Site.jsx'

export function render() {
  return renderToString(
    <StrictMode>
      {/* The site paints with the colour variables, so there's nothing to re-colour (and no page to measure on the server). */}
      <SiteThemeProvider config={{ ...config, recolour: false }}>
        <Site />
      </SiteThemeProvider>
    </StrictMode>,
  )
}
