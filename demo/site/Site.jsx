// The landing page, on its own so it can also be rendered to HTML at build time
// (demo/prerender.jsx): search engines then see the whole page, not an empty #root.
import { Nav } from './Nav.jsx'
import { Hero } from './Hero.jsx'
import { Stats, Why } from './Why.jsx'
import { Roles } from './Roles.jsx'
import { Rules } from './Rules.jsx'
import { Features } from './Features.jsx'
import { Studio } from './Studio.jsx'
import { Styles } from './Styles.jsx'
import { Setup } from './Setup.jsx'
import { Agents } from './Agents.jsx'
import { About, Closing } from './About.jsx'
import { Footer } from './Footer.jsx'
import { Feedback } from './Feedback.jsx'
import { Community } from './Community.jsx'

export function Site() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <a href="#main" className="sr-only rounded-full bg-primary px-4 py-2 font-semibold text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Stats />
        <Why />
        <Roles />
        <Rules />
        <Studio />
        <Styles />
        <Features />
        <Setup />
        <Agents />
        <About />
        <Community />
        <Closing />
      </main>
      <Footer />
      <Feedback />
    </div>
  )
}
