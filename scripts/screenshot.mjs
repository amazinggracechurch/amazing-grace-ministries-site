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
await page.screenshot({ path: out, fullPage: full === 'true' })
await browser.close()
console.log(`saved ${out}`)
