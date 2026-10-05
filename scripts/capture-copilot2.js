const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5174/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Log in")');

    await page.waitForURL('**/board');
    await page.waitForTimeout(1000);

    // Open Copilot drawer
    await page.click('button:has-text("Copilot")');
    await page.waitForTimeout(500);

    // Switch to Ask tab and send a message
    await page.click('button:has-text("Ask")');
    await page.fill('input[placeholder="Ask about the schedule..."]', 'whats the current status');
    await page.keyboard.press('Enter');

    // Wait for the assistant's response to appear
    await page.waitForSelector('.whitespace-pre-wrap, .markdown-body, .flex-col > .rounded-lg, table', { timeout: 15000 });
    
    await page.waitForTimeout(2000);

    // Take a screenshot
    await page.screenshot({ path: 'docs/screenshots/08-copilot-chat.png' });
    console.log('Success');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
