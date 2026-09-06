const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];

  page.on('console', (msg) => logs.push(`console:${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => logs.push(`pageerror:${err.message}`));

  try {
    await page.goto('http://localhost:5173/login');
    await page.fill("input[type='email']", 'goaltestui@example.com');
    await page.fill("input[type='password']", 'pass123');
    await page.click("button[type='submit']");
    await page.waitForURL('**/dashboard');

    await page.goto('http://localhost:5173/goals');
    await page.getByRole('button', { name: 'Add Savings Goal' }).click();
    await page.fill("input[placeholder='e.g. Emergency Fund, Stock Portfolio']", 'Emergency Fund');
    await page.fill("input[placeholder='100000']", '150000');
    await page.getByRole('button', { name: 'Create Goal' }).click();

    await page.waitForTimeout(2000);

    const info = await page.evaluate(() => {
      const auth = JSON.parse(localStorage.getItem('wp_auth_user') || 'null');
      const userId = auth?._id || auth?.id || auth?.email || 'guest';
      const key = `wp_savings_goals_${userId}`;

      return {
        auth,
        key,
        storage: localStorage.getItem(key),
        bodyText: document.body.innerText,
      };
    });

    console.log(JSON.stringify({ logs, info }, null, 2));
  } catch (error) {
    console.error('Test execution error:', error.message);
  } finally {
    await browser.close();
  }
})();