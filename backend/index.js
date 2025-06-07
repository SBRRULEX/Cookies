<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Facebook Messenger Bot</title>
  <style>
    body {
      font-family: sans-serif;
      background: #1a1a1a;
      color: #fff;
      margin: 0;
      padding: 2rem;
    }
    h1 {
      color: #00ffd5;
      text-align: center;
    }
    label {
      display: block;
      margin-top: 1rem;
    }
    input[type="file"], input[type="text"], button {
      width: 100%;
      padding: 10px;
      margin-top: 0.5rem;
      font-size: 1rem;
    }
    .log {
      background: #000;
      color: #0f0;
      padding: 1rem;
      height: 250px;
      overflow-y: auto;
      font-family: monospace;
      margin-top: 1rem;
      border: 1px solid #555;
    }
    .corner-link {
      position: fixed;
      top: 10px;
      right: 10px;
      background: #333;
      color: #0ff;
      padding: 10px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <a class="corner-link" href="/cookie-extractor" target="_blank">Get Cookies</a>
  <h1>Facebook Auto Messenger</h1>

  <label>Upload Token or Cookie File (.txt):</label>
  <input type="file" id="authFile" accept=".txt" />

  <label>Upload UID File (one per line):</label>
  <input type="file" id="uidFile" accept=".txt" />

  <label>Upload Message File (line by line):</label>
  <input type="file" id="msgFile" accept=".txt" />

  <label>Delay (in seconds):</label>
  <input type="text" id="delay" placeholder="Default is 5" />

  <button onclick="startBot()">Start Sending</button>

  <div class="log" id="logBox">[LOG] Waiting for input...</div>

  <script>
    const log = (msg) => {
      const box = document.getElementById('logBox');
      box.innerHTML += `<br><b>[${new Date().toLocaleTimeString()}]</b> ${msg}`;
      box.scrollTop = box.scrollHeight;
    };

    async function startBot() {
      const auth = await readFile(document.getElementById('authFile').files[0]);
      const uids = await readFile(document.getElementById('uidFile').files[0]);
      const msgs = await readFile(document.getElementById('msgFile').files[0]);
      const delay = parseInt(document.getElementById('delay').value || "5");

      const data = {
        auth,
        uids: uids.split('\n'),
        messages: msgs.split('\n'),
        delay
      };

      const stopCodeRes = await fetch('/stop-code');
      const { stopCode } = await stopCodeRes.json();
      log(`<b>STOP CODE:</b> ${stopCode}`);

      const res = await fetch('/send', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (result.status) {
        log(`✅ ${result.status}`);
      } else {
        log(`❌ Error: ${result.error}`);
      }
    }

    function readFile(file) {
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.onerror = rej;
        reader.readAsText(file);
      });
    }
  </script>
</body>
</html>
