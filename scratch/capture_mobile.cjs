const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser using system Chrome...');
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
  
  // 1. Homepage
  console.log('Opening Homepage...');
  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000); // extra wait for layout / hydration
    await page.screenshot({ path: path.join(artifactDir, 'homepage_mobile.png'), fullPage: false });
    console.log('Homepage screenshot captured.');
  } catch (err) {
    console.error('Error on Homepage:', err);
  }
  
  // 2. Collection
  console.log('Opening Collection Page...');
  try {
    await page.goto('http://localhost:3000/collections/all', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'collection_mobile.png'), fullPage: false });
    console.log('Collection page screenshot captured.');
  } catch (err) {
    console.error('Error on Collection page:', err);
  }
  
  // 3. Product page
  console.log('Finding a product and opening Product Page...');
  try {
    const productLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const productLinkElement = links.find(a => a.href.includes('/products/'));
      return productLinkElement ? productLinkElement.href : null;
    });
    
    if (productLink) {
      console.log('Found product link:', productLink);
      await page.goto(productLink, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(artifactDir, 'product_mobile.png'), fullPage: false });
      console.log('Product page screenshot captured.');
    } else {
      console.log('No product link found on collection page.');
    }
  } catch (err) {
    console.error('Error on Product page:', err);
  }
  
  await browser.close();
  console.log('Finished capturing screenshots.');
})();
