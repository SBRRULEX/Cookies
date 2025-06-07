const express = require('express');
const multer = require('multer');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const frontendPath = path.join(process.cwd(), 'frontend');
app.use(express.static(frontendPath));

const upload = multer({ dest: 'uploads/' });
app.use(express.json());

// Stop Code
let stopCode = randomBytes(3).toString('hex');
let shouldStop = false;

app.get('/stop-code', (_, res) => {
  res.json({ stopCode });
});

app.post('/stop', express.json(), (req, res) => {
  if (req.body.code === stopCode) {
    shouldStop = true;
    stopCode = randomBytes(3).toString('hex'); // Reset code
    res.json({ status: 'Stopped' });
  } else {
    res.json({ status: 'Invalid Code' });
  }
});

// Main Message Send Route
app.post('/send', upload.fields([
  { name: 'authfile', maxCount: 1 },
  { name: 'uidfile', maxCount: 1 },
  { name: 'msgfile', maxCount: 1 }
]), async (req, res) => {
  const authFile = req.files['authfile']?.[0];
  const uidFile = req.files['uidfile']?.[0];
  const msgFile = req.files['msgfile']?.[0];
  const delay = parseInt(req.body.delay) || 5;

  if (!authFile || !uidFile || !msgFile) {
    return res.status(400).json({ error: 'Missing files' });
  }

  const auth = fs.readFileSync(authFile.path, 'utf-8').trim();
  const uids = fs.readFileSync(uidFile.path, 'utf-8').trim().split('\n');
  const messages = fs.readFileSync(msgFile.path, 'utf-8').trim().split('\n');

  shouldStop = false;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    // Auth via token or cookie
    if (auth.startsWith('EAA') || auth.includes('|')) {
      await page.setExtraHTTPHeaders({ Authorization: auth });
    } else if (auth.includes('c_user=')) {
      const cookies = auth
        .split(';')
        .map(pair => {
          const [name, value] = pair.trim().split('=');
          return { name, value, domain: '.facebook.com' };
        });
      await page.setCookie(...cookies);
    }

    for (const uid of uids) {
      await page.goto(`https://www.facebook.com/messages/t/${uid}`, {
        waitUntil: 'domcontentloaded',
      });

      await page.waitForSelector('[role="textbox"]', { timeout: 15000 });

      for (const msg of messages) {
        if (shouldStop) break;

        await page.type('[role="textbox"]', msg);
        await page.keyboard.press('Enter');

        const now = new Date().toLocaleString();
        console.log(`\x1b[32m[${now}] ✅ SBR SUCCESSFULLY SENT → ${uid}: "${msg}"\x1b[0m`);

        await new Promise(res => setTimeout(res, delay * 1000));
      }

      if (shouldStop) break;
    }

    await browser.close();

    res.json({ status: 'Messages sent successfully ✅', stopCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', details: err.message });
  } finally {
    [authFile, uidFile, msgFile].forEach(f => fs.unlinkSync(f.path));
  }
});

// Serve frontend
app.get('/', (_, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server live on port ${PORT}`);
});
