const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 Pro size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  const artifactDir = 'C:\\Users\\yshla\\.gemini\\antigravity\\brain\\ec5c9649-fa98-4354-9056-fc765644920f';
  
  // 1. Homepage (Header + Social Dock check)
  console.log('Opening Homepage...');
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(artifactDir, 'homepage_mobile_socials.png') });
  console.log('Homepage screenshot captured.');
  
  // 2. Wholesale page
  console.log('Opening Wholesale Page...');
  await page.goto('http://localhost:3000/pages/wholesale', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(artifactDir, 'wholesale_mobile_new.png') });
  console.log('Wholesale page screenshot captured.');

  await browser.close();
  console.log('Done.');
})();
