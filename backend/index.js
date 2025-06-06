// backend/index.js (Fully Fixed Version)

const express = require('express'); const puppeteer = require('puppeteer'); const bodyParser = require('body-parser'); const path = require('path'); const { randomBytes } = require('crypto');

const app = express(); const PORT = process.env.PORT || 3000;

// Correct path to frontend folder (based on Render build) const frontendPath = path.join(__dirname, '../frontend');

app.use(bodyParser.json()); app.use(express.static(frontendPath));

let stopCode = randomBytes(3).toString('hex'); let shouldStop = false;

app.get('/stop-code', (_, res) => { res.json({ stopCode }); });

app.post('/stop', (req, res) => { if (req.body.code === stopCode) { shouldStop = true; stopCode = randomBytes(3).toString('hex'); // refresh stop code res.json({ status: 'Stopped' }); } else { res.json({ status: 'Invalid Code' }); } });

app.post('/send', async (req, res) => { const { token, uid, message, delay = 5 } = req.body; shouldStop = false;

try { const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], });

const page = await browser.newPage();

await page.setExtraHTTPHeaders({
  authorization: token,
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
  console.log(`[${now}] SBR SUCCESSFULLY SEND → ${uid}: "${msg}"`);

  await new Promise((r) => setTimeout(r, delay * 1000));
}

await browser.close();

res.json({ status: 'All messages sent', stopCode });

} catch (err) { console.error('Error sending message:', err.message); res.status(500).json({ error: 'Sending failed', details: err.message }); } });

app.get('/', (req, res) => { res.sendFile(path.join(frontendPath, 'index.html')); });

app.listen(PORT, () => { console.log(✅ Server running on port ${PORT}); });

