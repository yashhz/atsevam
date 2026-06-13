const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser (desktop)...');
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  console.log('Navigating...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  console.log('Scrolling to Top Lehengas section...');
  const titleElement = page.locator('h2:has-text("Top Lehengas")');
  if (await titleElement.count() > 0) {
    await titleElement.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const artifactDir = 'C:\\Users\\yshla\\.gemini\\antigravity\\brain\\ec5c9649-fa98-4354-9056-fc765644920f';
    await page.screenshot({ path: path.join(artifactDir, 'lehengas_desktop.png') });
    console.log('Screenshot saved to lehengas_desktop.png');
  } else {
    console.log('Section not found.');
  }
  await browser.close();
})();
