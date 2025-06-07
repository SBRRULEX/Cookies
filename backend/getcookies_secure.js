const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

(async () => {
  const email = await ask('📧 Email: ');
  const password = await ask('🔐 Password: ');

  const browser = await puppeteer.launch({
    headless: false, // set to true if you don't want to see the browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });

  await page.type('#email', email, { delay: 50 });
  await page.type('#pass', password, { delay: 50 });
  await Promise.all([
    page.click('button[name="login"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // 2FA prompt check
  const url = page.url();
  if (url.includes('checkpoint') || await page.$('input[name="approvals_code"]')) {
    const otp = await ask('🔑 Enter 2FA code: ');
    await page.type('input[name="approvals_code"]', otp);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // Save Browser Option?
    const continueBtn = await page.$('button[type="submit"]');
    if (continueBtn) {
      await Promise.all([
        continueBtn.click(),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
    }
  }

  const cookies = await page.cookies();
  const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  console.log('\n✅ Your Cookie:\n\n' + cookieString);

  const token = await page.evaluate(() => {
    return require('requireLazy')?.loaded?.CurrentUserInitialData?.ACCOUNT_ID || null;
  });

  if (token) {
    console.log('\n🔐 Token/ID:', token);
  } else {
    console.log('\n⚠️ Token extraction failed. Use cookie if needed.');
  }

  await browser.close();
  rl.close();
})();
