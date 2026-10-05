const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Go to app
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');

    // 2. Sign up / Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Log in")');

    // If login fails, try signing up
    try {
      await page.waitForURL('**/board', { timeout: 3000 });
    } catch (e) {
      console.log('Login failed, trying signup...');
      await page.goto('http://localhost:5173/signup');
      await page.fill('input[placeholder="John Doe"]', 'Test User');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button:has-text("Sign up")');
      await page.waitForURL('**/board');
    }

    console.log('Logged in successfully.');
    await page.waitForTimeout(1000); // Wait for tasks to load

    // 3. Open Copilot drawer
    await page.click('button:has-text("Copilot")');
    await page.waitForTimeout(500);

    // 4. Switch to Ask tab and send a message
    await page.click('button:has-text("Ask")');
    await page.fill('input[placeholder="Ask about the schedule..."]', 'what is the current status?');
    await page.keyboard.press('Enter');

    console.log('Message sent, waiting for response...');
    // Wait for the assistant's response to appear
    await page.waitForSelector('.whitespace-pre-wrap, .markdown-body, .flex-col > .rounded-lg', { timeout: 35000 });
    
    // Wait a bit for the rendering to finish
    await page.waitForTimeout(2000);

    // 6. Take a screenshot
    await page.screenshot({ path: 'docs/screenshots/08-copilot-chat.png' });
    console.log('Screenshot saved to docs/screenshots/08-copilot-chat.png');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
