import { loadPdf } from '../../src/pdf.js'

// Kamiliyon's own site, and the demo: every color on the page is a Kamiliyon token, so the
// whole page re-colors with whatever theme you pick. It uses every token group.
export const config = {
  siteName: 'Kamiliyon',
  storageKey: 'colorsbymax-demo',
  pdf: loadPdf,
  // The button sits just under this page's floating nav bar.
  position: 'top-right',
  // The Kamiliyon wordmark is drawn in the theme's own colors, so themes color it too.
  colourLogo: true,
  // The bell shows here too, for everyone: this is Kamiliyon's own site, and its news is for its visitors.
  updates: true,
  // The site opens in dark mode; visitors can switch to light or Auto.
  defaultMode: 'dark',
  defaultTheme: {
    name: 'Kamiliyon Violet',
    // Checked with Kamiliyon's own contrast rules: every pairing passes, in light and in dark.
    tokens: {
      primary: '#593bf5',
      'app-primary': '#5333f5',
      'primary-dark': '#1e1b4b',
      'primary-alt': '#e0457b',
      secondary: '#ece9fe',
      'on-secondary': '#3b2a8f',
      background: '#fbfaff',
    },
  },
}
