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
  
  // 1. Collections Page with Filters open
  console.log('Opening Collections Page...');
  try {
    await page.goto('http://localhost:3000/collections/all', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    // Capture base page
    await page.screenshot({ path: path.join(artifactDir, 'collection_mobile_base.png'), fullPage: false });
    console.log('Collection base page screenshot captured.');

    // Try to click the mobile filter button to open filter drawer
    console.log('Clicking mobile filter button...');
    const filterBtn = page.locator('.av-mobile-filter-btn');
    if (await filterBtn.count() > 0) {
      await filterBtn.click();
      await page.waitForTimeout(1000); // wait for animation
      await page.screenshot({ path: path.join(artifactDir, 'collection_mobile_filters_open.png'), fullPage: false });
      console.log('Collection with filters open captured.');
      // Click close button
      await page.locator('.av-filter-drawer__close').click();
      await page.waitForTimeout(500);
    } else {
      console.log('av-mobile-filter-btn not found on page.');
    }
  } catch (err) {
    console.error('Error on Collection page:', err);
  }

  // 2. Search Page
  console.log('Opening Search Page...');
  try {
    await page.goto('http://localhost:3000/search?q=dress', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'search_mobile.png'), fullPage: false });
    console.log('Search page screenshot captured.');
  } catch (err) {
    console.error('Error on Search page:', err);
  }

  // 3. Contact Page
  console.log('Opening Contact Page...');
  try {
    await page.goto('http://localhost:3000/pages/contact', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'contact_mobile.png'), fullPage: false });
    console.log('Contact page screenshot captured.');
  } catch (err) {
    console.error('Error on Contact page:', err);
  }

  // 4. FAQ Page
  console.log('Opening FAQ Page...');
  try {
    await page.goto('http://localhost:3000/pages/faq', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'faq_mobile.png'), fullPage: false });
    console.log('FAQ page screenshot captured.');
  } catch (err) {
    console.error('Error on FAQ page:', err);
  }

  // 5. Wholesale Page
  console.log('Opening Wholesale Page...');
  try {
    await page.goto('http://localhost:3000/pages/wholesale', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'wholesale_mobile.png'), fullPage: false });
    console.log('Wholesale page screenshot captured.');
  } catch (err) {
    console.error('Error on Wholesale page:', err);
  }

  // 6. Our Story Page
  console.log('Opening Our Story Page...');
  try {
    await page.goto('http://localhost:3000/pages/our-story', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(artifactDir, 'our_story_mobile.png'), fullPage: false });
    console.log('Our Story page screenshot captured.');
  } catch (err) {
    console.error('Error on Our Story page:', err);
  }

  await browser.close();
  console.log('Finished capturing screenshots.');
})();
