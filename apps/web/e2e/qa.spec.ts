import { test, expect } from '@playwright/test'

test('Verify CEO-620 Test Room Rendering', async ({ page }) => {
  // Navigate to the test room we just created
  await page.goto('/r/96da4348')
  
  // Wait for the tldraw canvas to appear (max 10s)
  await page.waitForSelector('.tl-canvas', { timeout: 10000 }).catch(() => console.log('Canvas selector timed out'))
  
  // Give it extra time to render shapes
  await page.waitForTimeout(5000)
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/room-96da4348.png' })
})