import { test, expect } from '@playwright/test'

test('Capture error screen', async ({ page }) => {
  await page.goto('/')
  
  await page.waitForSelector('.tl-canvas', { timeout: 15000 }).catch(()=>console.log('Timeout'))

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent?.includes('라이브러리'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(500)

  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find(el => el.textContent?.includes('기본 UI 컴포넌트') && !el.children.length);
    if (el) (el as HTMLElement).click();
  });
  await page.waitForTimeout(500)

  await page.locator('text=Wired Progress (Smart)').click()
  
  await page.waitForTimeout(2000)
  
  await page.screenshot({ path: 'test-results/crash.png' })
})