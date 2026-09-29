// Resilient localtunnel client: keeps a stable loca.lt URL, auto-reconnects if
// the connection drops. Writes the current URL to lt-url.txt.
const path = require('path');
const fs = require('fs');
const localtunnel = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'localtunnel', 'localtunnel.js'));

const OUT = path.join(__dirname, 'lt-url.txt');
const SUB = 'contactgroup-eg';   // stable subdomain -> https://contactgroup-eg.loca.lt (falls back to random if taken)
let tunnel = null;

function log(m) { try { fs.appendFileSync(path.join(__dirname, 'tunnel-run.log'), new Date().toISOString() + ' ' + m + '\n'); } catch (e) {} }

async function connect() {
  try {
    tunnel = await localtunnel({ port: 3000, subdomain: SUB });
    fs.writeFileSync(OUT, tunnel.url);
    log('UP ' + tunnel.url);
    console.log('URL ' + tunnel.url);
    tunnel.on('close', () => { log('close -> reconnect'); setTimeout(connect, 1500); });
    tunnel.on('error', (e) => { log('error ' + e.message); try { tunnel.close(); } catch (x) {} setTimeout(connect, 1500); });
  } catch (e) {
    log('connect-fail ' + e.message);
    setTimeout(connect, 2500);
  }
}

process.on('uncaughtException', (e) => { log('uncaught ' + e.message); setTimeout(connect, 2500); });
process.on('unhandledRejection', (e) => { log('unhandled ' + (e && e.message)); });
connect();
