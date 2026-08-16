import { test, expect } from '@playwright/test'
import fs from 'fs'

test('Setup n8n and get API key', async ({ page }) => {
  await page.goto('http://localhost:5678')
  
  // Wait for setup screen
  await page.waitForTimeout(2000)

  // Check if we need to setup owner
  const isSetup = await page.locator('text=Set up owner account').count() > 0
  if (isSetup) {
    console.log('Setting up owner account...')
    await page.fill('input[type="email"]', 'admin@sonagi.space')
    await page.fill('input[type="text"]', 'Admin') // First name
    await page.fill('input[type="password"]', 'adminpass1234')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    // Maybe a welcome screen
    const skipBtn = page.locator('text=Skip')
    if (await skipBtn.count() > 0) {
      await skipBtn.click()
    }
    await page.waitForTimeout(2000)
  }

  // Go to settings > Public API
  await page.goto('http://localhost:5678/settings/api')
  await page.waitForTimeout(2000)
  
  // Click "Create API Key" or similar
  const createBtn = page.locator('button', { hasText: 'Create API' })
  if (await createBtn.count() > 0) {
    await createBtn.first().click()
    await page.waitForTimeout(1000)
    // Wait for the modal or whatever it shows
  }

  // Try to find the API key in the DOM or intercept the network request
  // Actually, generating it via the UI might be complex. Let's intercept the request!
})