const express = require('express');
const puppeteer = require('puppeteer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const frontendPath = path.join(process.cwd(), 'frontend');
app.use(express.static(frontendPath));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });

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

app.post('/send', upload.fields([
  { name: 'auth', maxCount: 1 },
  { name: 'uids', maxCount: 1 },
  { name: 'messages', maxCount: 1 }
]), async (req, res) => {
  shouldStop = false;
  const delay = parseInt(req.body.delay) || 5;
  const authType = req.body.authType;

  try {
    const auth = fs.readFileSync(req.files.auth[0].path, 'utf-8').trim();
    const uids = fs.readFileSync(req.files.uids[0].path, 'utf-8').split('\n').map(u => u.trim());
    const messages = fs.readFileSync(req.files.messages[0].path, 'utf-8').split('\n');

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    if (authType === 'cookie') {
      const cookies = JSON.parse(auth);
      await page.setCookie(...cookies);
    } else {
      await page.setExtraHTTPHeaders({ authorization: auth });
    }

    for (const uid of uids) {
      await page.goto(`https://www.facebook.com/messages/t/${uid}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

      for (const msg of messages) {
        if (shouldStop) break;
        await page.type('[role="textbox"]', msg);
        await page.keyboard.press('Enter');
        console.log(`[${new Date().toLocaleString()}] ✅ SBR SUCCESSFULLY SEND to ${uid} → ${msg}`);
        await new Promise(r => setTimeout(r, delay * 1000));
      }
    }

    await browser.close();
    res.json({ status: 'Success', stopCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
