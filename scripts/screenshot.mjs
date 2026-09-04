// Quick screenshot helper (not part of the app). Usage:
//   node scripts/screenshot.mjs <url> <outfile> [light|dark] [width] [height] [fullpage]
import { chromium } from 'playwright'

const [url, out, scheme = 'light', width = '1440', height = '1000', full = 'false'] =
  process.argv.slice(2)

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: Number(width), height: Number(height) },
  colorScheme: scheme === 'dark' ? 'dark' : 'light',
})
await page.goto(url, { waitUntil: 'networkidle' })
// Scroll through the page so IntersectionObserver reveals fire, then settle.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 120))
  }
  window.scrollTo(0, 0)
  await new Promise((r) => setTimeout(r, 700))
})
await page.screenshot({ path: out, fullPage: full === 'true' })
await browser.close()
console.log(`saved ${out}`)
