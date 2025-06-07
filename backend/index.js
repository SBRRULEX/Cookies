const express = require('express');
const multer = require('multer');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

const upload = multer({ dest: 'uploads/' });

let stopCode = randomBytes(3).toString('hex');
let shouldStop = false;

app.get('/stop-code', (_, res) => {
  res.json({ stopCode });
});

app.post('/stop', express.json(), (req, res) => {
  if (req.body.code === stopCode) {
    shouldStop = true;
    stopCode = randomBytes(3).toString('hex');
    return res.json({ status: 'Stopped' });
  }
  res.json({ status: 'Invalid Code' });
});

app.post('/send', upload.fields([
  { name: 'authFile' }, { name: 'messageFile' }, { name: 'uid' }
]), async (req, res) => {
  shouldStop = false;
  const auth = fs.readFileSync(req.files['authFile'][0].path, 'utf-8');
  const uid = fs.readFileSync(req.files['uid'][0].path, 'utf-8').trim();
  const messages = fs.readFileSync(req.files['messageFile'][0].path, 'utf-8').split('\n');
  const delay = parseInt(req.body.delay || '5');

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    // Apply auth
    if (auth.includes('c_user')) {
      // Cookie login
      const cookies = JSON.parse(auth);
      await page.setCookie(...cookies);
    } else {
      // Token login
      await page.setExtraHTTPHeaders({ authorization: auth.trim() });
    }

    await page.goto(`https://facebook.com/messages/t/${uid}`, {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

    for (const msg of messages) {
      if (shouldStop) break;
      await page.type('[role="textbox"]', msg);
      await page.keyboard.press('Enter');
      const now = new Date().toLocaleString();
      console.log(`[${now}] ✅ Sent to ${uid}: "${msg}"`);
      await new Promise(r => setTimeout(r, delay * 1000));
    }

    await browser.close();
    res.json({ status: 'All messages sent successfully.', stopCode });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send messages', details: err.message });
  }
});

app.get('/extract', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/extract.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));
