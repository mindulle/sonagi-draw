# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: n8n_setup.spec.ts >> Setup n8n and get API key
- Location: e2e/n8n_setup.spec.ts:4:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - main [ref=e4]:
    - main [ref=e7]:
      - generic [ref=e10]:
        - generic [ref=e11]:
          - img [ref=e12]
          - img [ref=e14]
        - generic [ref=e18]:
          - generic [ref=e20]: Sign in
          - generic [ref=e23]:
            - generic [ref=e25]:
              - generic [ref=e30]: Email
              - textbox "Email" [ref=e34]:
                - /placeholder: ""
                - text: admin@sonagi.space
            - generic [ref=e36]:
              - generic [ref=e41]: Password
              - textbox "Password" [active] [ref=e45]:
                - /placeholder: ""
                - text: Admin
          - button "Sign in" [ref=e47] [cursor=pointer]:
            - generic [ref=e49]: Sign in
          - link "Forgot my password" [ref=e51] [cursor=pointer]:
            - /url: /forgot-password
            - generic [ref=e53]: Forgot my password
  - complementary
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | import fs from 'fs'
  3  | 
  4  | test('Setup n8n and get API key', async ({ page }) => {
  5  |   await page.goto('http://localhost:5678/signin')
  6  |   
  7  |   await page.waitForTimeout(2000)
  8  | 
  9  |   // Wait for the inputs
  10 |   const emailInput = page.locator('input[id="email"]')
  11 |   if (await emailInput.count() === 0) {
  12 |     console.log('Using generic input search')
  13 |     const inputs = page.locator('input')
  14 |     await inputs.nth(0).fill('admin@sonagi.space').catch(e=>null)
  15 |     await inputs.nth(1).fill('Admin').catch(e=>null)
  16 |     await inputs.nth(2).fill('User').catch(e=>null)
  17 |     await inputs.nth(3).fill('Adminpass1234!').catch(e=>null)
  18 |   } else {
  19 |     await page.fill('input[id="email"]', 'admin@sonagi.space').catch(e=>null)
  20 |     await page.fill('input[id="firstName"]', 'Admin').catch(e=>null)
  21 |     await page.fill('input[id="lastName"]', 'User').catch(e=>null)
  22 |     await page.fill('input[id="password"]', 'Adminpass1234!').catch(e=>null)
  23 |   }
  24 | 
  25 |   // Click Next
  26 |   await page.locator('button', { hasText: 'Next' }).click().catch(e=>null)
  27 |   await page.locator('button', { hasText: 'Sign in' }).click().catch(e=>null)
> 28 |   await page.waitForTimeout(4000)
     |              ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  29 |   
  30 |   // Skip customize page
  31 |   const skipBtn = page.locator('button', { hasText: 'Skip' })
  32 |   if (await skipBtn.count() > 0) {
  33 |     await skipBtn.first().click()
  34 |     await page.waitForTimeout(2000)
  35 |   }
  36 | 
  37 |   const getStartedBtn = page.locator('button', { hasText: 'Get started' })
  38 |   if (await getStartedBtn.count() > 0) {
  39 |     await getStartedBtn.first().click()
  40 |     await page.waitForTimeout(2000)
  41 |   }
  42 | 
  43 |   // Go to API settings
  44 |   await page.goto('http://localhost:5678/settings/api')
  45 |   await page.waitForTimeout(2000)
  46 |   
  47 |   // Create API Key
  48 |   const addBtn = page.locator('button', { hasText: 'Add API Key' })
  49 |   if (await addBtn.count() > 0) {
  50 |     await addBtn.first().click()
  51 |     await page.waitForTimeout(1000)
  52 |   } else {
  53 |     const createBtn = page.locator('button', { hasText: 'Create API key' })
  54 |     if (await createBtn.count() > 0) {
  55 |         await createBtn.first().click()
  56 |         await page.waitForTimeout(1000)
  57 |     }
  58 |   }
  59 | 
  60 |   // Fill label
  61 |   const labelInput = page.locator('input[placeholder="e.g Internal Project"]')
  62 |   if (await labelInput.count() > 0) {
  63 |     await labelInput.fill('AgentKey')
  64 |   }
  65 | 
  66 |   // Click save
  67 |   const saveBtn = page.locator('button', { hasText: 'Save' })
  68 |   if (await saveBtn.count() > 0) {
  69 |     await saveBtn.first().click()
  70 |     await page.waitForTimeout(1000)
  71 |   }
  72 |   
  73 |   // Now it will show a modal with the API key
  74 |   const inputs = page.locator('input')
  75 |   for (let i = 0; i < await inputs.count(); i++) {
  76 |      const text = await inputs.nth(i).inputValue()
  77 |      if (text && text.includes('_') && text.length > 20) {
  78 |         fs.writeFileSync('/tmp/n8n_key.txt', text)
  79 |         console.log(`FOUND_API_KEY=${text}`)
  80 |      }
  81 |   }
  82 | 
  83 |   // If not found in inputs, try grabbing code
  84 |   const codeBlocks = page.locator('code')
  85 |   for (let i = 0; i < await codeBlocks.count(); i++) {
  86 |      const text = await codeBlocks.nth(i).textContent()
  87 |      if (text && text.includes('_') && text.length > 20) {
  88 |         fs.writeFileSync('/tmp/n8n_key.txt', text)
  89 |         console.log(`FOUND_API_KEY=${text}`)
  90 |      }
  91 |   }
  92 |   
  93 |   await page.screenshot({ path: '/tmp/n8n-api.png' })
  94 | })
```