const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

(async () => {
  rl.question('📧 Email: ', (email) => {
    rl.question('🔐 Password: ', (pass) => {
      (async () => {
        const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
        const page = await browser.newPage();

        await page.goto('https://www.facebook.com/login');
        await page.type('#email', email);
        await page.type('#pass', pass);
        await Promise.all([page.click('button[name="login"]'), page.waitForNavigation()]);

        const cookies = await page.cookies();
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');

        console.log('\n✅ Your Cookie:\n\n' + cookieString);
        await browser.close();
        rl.close();
      })();
    });
  });
})();
