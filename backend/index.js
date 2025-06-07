const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const frontendPath = path.join(process.cwd(), 'frontend');
const extractorPath = path.join(process.cwd(), 'cookie-extractor');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(frontendPath));
app.use('/cookie-extractor', express.static(extractorPath));

let stopCode = randomBytes(3).toString('hex');
let shouldStop = false;

app.get('/stop-code', (_, res) => {
  res.json({ stopCode });
});

app.post('/stop', (req, res) => {
  if (req.body.code === stopCode) {
    shouldStop = true;
    stopCode = randomBytes(3).toString('hex');
    res.json({ status: 'Stopped' });
  } else {
    res.json({ status: 'Invalid Code' });
  }
});

app.post('/send', async (req, res) => {
  const { token, uid, message, delay = 5 } = req.body;
  shouldStop = false;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
      'authorization': token.trim()
    });

    await page.goto(`https://www.facebook.com/messages/t/${uid}`, {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

    const messages = message.split('\n');

    for (let msg of messages) {
      if (shouldStop) break;

      await page.type('[role="textbox"]', msg);
      await page.keyboard.press('Enter');

      const now = new Date().toLocaleString();
      console.log(`\x1b[32m[${now}] ✅ SBR SUCCESSFULLY SEND → ${uid}: "${msg}"\x1b[0m`);

      await new Promise((r) => setTimeout(r, delay * 1000));
    }

    await browser.close();
    res.json({ status: 'All messages sent', stopCode });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
