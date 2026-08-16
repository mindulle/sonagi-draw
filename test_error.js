const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://draw.sonagi.space/?room=1mbvv0qd');
  await page.waitForTimeout(3000);
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("TEXT:", text.substring(0, 200));
  
  await browser.close();
})();
