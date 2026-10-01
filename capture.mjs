import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark'
  });
  const page = await context.newPage();
  
  // Wait for dev server
  await page.goto('http://localhost:5173/dashboard');
  await page.waitForTimeout(1000); // let UI settle
  
  await page.screenshot({ path: path.join(__dirname, 'docs/screenshots/01-dashboard.png') });
  
  // Navigate to Timeline
  await page.goto('http://localhost:5173/timeline');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'docs/screenshots/02-timeline.png') });

  // Navigate to Board
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);
  
  // Open Copilot
  // Wait for header button with aria-label Copilot or something. Let's just press Ctrl+J
  await page.keyboard.press('Control+J');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'docs/screenshots/03-copilot-drawer.png') });
  
  // Navigate to Task Detail
  await page.goto('http://localhost:5173/task/api-dev');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(__dirname, 'docs/screenshots/04-task-detail.png') });
  
  // Mobile View
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:5173/');
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(__dirname, 'docs/screenshots/05-mobile-board.png') });

  await browser.close();
  console.log('Screenshots captured successfully.');
}

capture().catch(console.error);
