const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const { randomBytes } = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(process.cwd(), 'frontend');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(frontendPath));
const upload = multer({ dest: 'uploads/' });

let stopCode = Math.floor(100000 + Math.random() * 900000).toString();
let shouldStop = false;

app.get('/stop-code', (_, res) => {
  res.json({ stopCode });
});

app.post('/stop', (req, res) => {
  if (req.body.code === stopCode) {
    shouldStop = true;
    stopCode = Math.floor(100000 + Math.random() * 900000).toString();
    return res.json({ status: 'Stopped' });
  }
  res.json({ status: 'Invalid code' });
});

app.post('/send', upload.fields([{ name: 'cookieFile' }, { name: 'uidFile' }, { name: 'messageFile' }]), async (req, res) => {
  shouldStop = false;
  const delay = parseInt(req.body.delay) || 3;

  const cookieData = fs.readFileSync(req.files.cookieFile[0].path, 'utf-8');
  const uidList = fs.readFileSync(req.files.uidFile[0].path, 'utf-8').split(/\r?\n/).filter(Boolean);
  const messages = fs.readFileSync(req.files.messageFile[0].path, 'utf-8').split(/\r?\n/).filter(Boolean);

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    const cookies = cookieData.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=');
      return { name, value, domain: '.facebook.com' };
    });
    await page.setCookie(...cookies);

    for (const uid of uidList) {
      await page.goto(`https://www.facebook.com/messages/t/${uid}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[role="textbox"]', { timeout: 10000 });

      for (const msg of messages) {
        if (shouldStop) break;
        await page.type('[role="textbox"]', msg);
        await page.keyboard.press('Enter');
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Sent to ${uid}: "${msg}"`);
        await new Promise(res => setTimeout(res, delay * 1000));
      }

      if (shouldStop) break;
    }

    await browser.close();
    res.json({ status: 'Completed', stopCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
