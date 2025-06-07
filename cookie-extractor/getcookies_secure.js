const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/get-cookies', async (req, res) => {
  const { email, password, code } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
    await page.type('#email', email);
    await page.type('#pass', password);
    await Promise.all([
      page.click('button[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    if (await page.$('input[name="approvals_code"]')) {
      if (!code) {
        await browser.close();
        return res.status(401).json({ error: '2FA code required' });
      }
      await page.type('input[name="approvals_code"]', code);
      await page.click('#checkpointSubmitButton');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      if (await page.$('#checkpointSubmitButton')) {
        await page.click('#checkpointSubmitButton');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }
    }

    const cookies = await page.cookies();
    const formatted = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    await browser.close();

    res.json({ cookies: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

app.listen(5000, () => console.log('✅ Cookie Extractor running on port 5000'));
