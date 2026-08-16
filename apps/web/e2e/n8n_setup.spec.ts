import { test, expect } from '@playwright/test'
import fs from 'fs'

test('Setup n8n and get API key', async ({ page }) => {
  await page.goto('http://localhost:5678/signin')
  
  await page.waitForTimeout(2000)

  // Wait for the inputs
  const emailInput = page.locator('input[id="email"]')
  if (await emailInput.count() === 0) {
    console.log('Using generic input search')
    const inputs = page.locator('input')
    await inputs.nth(0).fill('admin@sonagi.space').catch(e=>null)
    await inputs.nth(1).fill('Admin').catch(e=>null)
    await inputs.nth(2).fill('User').catch(e=>null)
    await inputs.nth(3).fill('Adminpass1234!').catch(e=>null)
  } else {
    await page.fill('input[id="email"]', 'admin@sonagi.space').catch(e=>null)
    await page.fill('input[id="firstName"]', 'Admin').catch(e=>null)
    await page.fill('input[id="lastName"]', 'User').catch(e=>null)
    await page.fill('input[id="password"]', 'Adminpass1234!').catch(e=>null)
  }

  // Click Next
  await page.locator('button', { hasText: 'Next' }).click().catch(e=>null)
  await page.locator('button', { hasText: 'Sign in' }).click().catch(e=>null)
  await page.waitForTimeout(4000)
  
  // Skip customize page
  const skipBtn = page.locator('button', { hasText: 'Skip' })
  if (await skipBtn.count() > 0) {
    await skipBtn.first().click()
    await page.waitForTimeout(2000)
  }

  const getStartedBtn = page.locator('button', { hasText: 'Get started' })
  if (await getStartedBtn.count() > 0) {
    await getStartedBtn.first().click()
    await page.waitForTimeout(2000)
  }

  // Go to API settings
  await page.goto('http://localhost:5678/settings/api')
  await page.waitForTimeout(2000)
  
  // Create API Key
  const addBtn = page.locator('button', { hasText: 'Add API Key' })
  if (await addBtn.count() > 0) {
    await addBtn.first().click()
    await page.waitForTimeout(1000)
  } else {
    const createBtn = page.locator('button', { hasText: 'Create API key' })
    if (await createBtn.count() > 0) {
        await createBtn.first().click()
        await page.waitForTimeout(1000)
    }
  }

  // Fill label
  const labelInput = page.locator('input[placeholder="e.g Internal Project"]')
  if (await labelInput.count() > 0) {
    await labelInput.fill('AgentKey')
  }

  // Click save
  const saveBtn = page.locator('button', { hasText: 'Save' })
  if (await saveBtn.count() > 0) {
    await saveBtn.first().click()
    await page.waitForTimeout(1000)
  }
  
  // Now it will show a modal with the API key
  const inputs = page.locator('input')
  for (let i = 0; i < await inputs.count(); i++) {
     const text = await inputs.nth(i).inputValue()
     if (text && text.includes('_') && text.length > 20) {
        fs.writeFileSync('/tmp/n8n_key.txt', text)
        console.log(`FOUND_API_KEY=${text}`)
     }
  }

  // If not found in inputs, try grabbing code
  const codeBlocks = page.locator('code')
  for (let i = 0; i < await codeBlocks.count(); i++) {
     const text = await codeBlocks.nth(i).textContent()
     if (text && text.includes('_') && text.length > 20) {
        fs.writeFileSync('/tmp/n8n_key.txt', text)
        console.log(`FOUND_API_KEY=${text}`)
     }
  }
  
  await page.screenshot({ path: '/tmp/n8n-api.png' })
})