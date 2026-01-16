import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"
import { createServer } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")
const outputDir = path.join(rootDir, "test-results", "screenshots")
let server = null
let baseUrl = ""

before(async () => {
  server = await createServer({
    root: rootDir,
    server: {
      port: 4173,
      strictPort: true,
    },
  })
  await server.listen()
  baseUrl = server.resolvedUrls?.local?.[0] ?? "http://localhost:4173"
  await fs.mkdir(outputDir, { recursive: true })
})

after(async () => {
  await server?.close()
})

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0
      const step = window.innerHeight
      const timer = setInterval(() => {
        window.scrollBy(0, step)
        total += step
        if (total >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 100)
    })
  })
}

async function captureScreenshot({
  name,
  width,
  height,
  deviceScaleFactor,
  colorScheme,
  isMobile,
  hasTouch,
}) {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor,
    colorScheme,
    isMobile,
    hasTouch,
  })
  const page = await context.newPage()
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("#root")
  await scrollToBottom(page)
  const filePath = path.join(outputDir, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  await browser.close()
  return filePath
}

async function assertScreenshot(filePath) {
  const stat = await fs.stat(filePath)
  assert.ok(stat.size > 0)
}

test("desktop screenshots (light/dark)", async () => {
  const lightPath = await captureScreenshot({
    name: "desktop-light",
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    colorScheme: "light",
    isMobile: false,
    hasTouch: false,
  })
  const darkPath = await captureScreenshot({
    name: "desktop-dark",
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    colorScheme: "dark",
    isMobile: false,
    hasTouch: false,
  })
  await assertScreenshot(lightPath)
  await assertScreenshot(darkPath)
})

test("mobile screenshots (light/dark)", async () => {
  const lightPath = await captureScreenshot({
    name: "mobile-light",
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    colorScheme: "light",
    isMobile: true,
    hasTouch: true,
  })
  const darkPath = await captureScreenshot({
    name: "mobile-dark",
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    colorScheme: "dark",
    isMobile: true,
    hasTouch: true,
  })
  await assertScreenshot(lightPath)
  await assertScreenshot(darkPath)
})
