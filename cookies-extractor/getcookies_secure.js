const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.post('/get-cookies', async (req, res) => {
  const { email, password, code } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });

    await page.type('#email', email, { delay: 100 });
    await page.type('#pass', password, { delay: 100 });
    await Promise.all([
      page.click('[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // 2FA handling
    if (await page.$('input[name="approvals_code"]')) {
      if (!code) {
        await browser.close();
        return res.status(401).json({ error: '2FA code required' });
      }
      await page.type('input[name="approvals_code"]', code);
      await page.click('#checkpointSubmitButton');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // skip save browser
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

app.get('/', (_, res) => {
  res.send('🟢 Facebook Cookie Extractor Running');
});

app.listen(PORT, () => {
  console.log(`✅ Cookie Extractor running on port ${PORT}`);
});
