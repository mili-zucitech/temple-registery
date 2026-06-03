const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  const responses = [];

  page.on('console', msg => logs.push(msg.type() + ': ' + msg.text()));
  page.on('response', async resp => {
    if (resp.url().includes('/api/')) {
      const headers = resp.headers();
      responses.push({
        url: resp.url().replace('http://localhost:5174', ''),
        status: resp.status(),
        setCookie: headers['set-cookie'] || 'none'
      });
    }
  });

  await page.goto('http://localhost:5174/login');
  await page.locator('input[name="username"]').fill('ta_chamundi');
  await page.locator('input[name="password"]').fill('password123');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(8000);

  console.log('URL after 8s:', page.url());
  console.log('Responses:', JSON.stringify(responses, null, 2));
  console.log('Console logs:', JSON.stringify(logs.slice(0, 30), null, 2));

  await browser.close();
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
