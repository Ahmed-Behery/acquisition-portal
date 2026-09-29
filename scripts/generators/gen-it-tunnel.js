// Generates the IT runbook for the stable Cloudflare named-tunnel link.
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, PageNumber } = require('docx');
const DESK = 'C:/Users/do.orfy/Desktop';
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE';
const run = (t, o = {}) => new TextRun({ text: t, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: 'Segoe UI' });
const P = (t, o = {}) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: o.after != null ? o.after : 120, line: 264 } });
const title = (t, sub) => [new Paragraph({ children: [run(t, { size: 42, bold: true, color: PRIMARY })], spacing: { after: 60 } }), new Paragraph({ children: [run(sub, { size: 25, color: MUTED })], spacing: { after: 70 } }), new Paragraph({ children: [run('Contact Group · Client & Pipeline Platform   ·   June 2026', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 220 } })];
const h2 = (t) => new Paragraph({ children: [run(t, { size: 28, bold: true, color: PRIMARY })], spacing: { before: 260, after: 100 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const h3 = (t) => new Paragraph({ children: [run(t, { size: 23, bold: true, color: INK })], spacing: { before: 160, after: 60 } });
const bullet = (t, r) => new Paragraph({ children: r || [run(t, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 50, line: 260 } });
const step = (n, r) => new Paragraph({ children: [run(n + '.  ', { bold: true, color: PRIMARY }), ...(Array.isArray(r) ? r : [run(r, { color: SOFT })])], spacing: { after: 60, line: 260 }, indent: { left: 360, hanging: 360 } });
const code = (t) => new Paragraph({ children: [run(t, { font: 'Consolas', size: 19, color: '0F172A' })], shading: { fill: 'F1F5F9' }, spacing: { after: 40, before: 40 }, indent: { left: 120 } });
const callout = (t, bg, bc, tc) => new Paragraph({ children: [run(t, { color: tc || '1E3A8A', size: 20 })], shading: { fill: bg || 'EFF4FF' }, border: { left: { color: bc || PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 90, after: 130 }, indent: { left: 120 } });
function cell(t, o = {}) { return new TableCell({ children: [new Paragraph({ children: [run(t, { size: 18, bold: o.bold, color: o.color || (o.header ? PRIMARY : SOFT) })], spacing: { after: 20, line: 248 } })], shading: o.header ? { fill: HEADBG } : undefined, width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 } }); }
function table(headers, rows, w) { const b = { style: BorderStyle.SINGLE, size: 4, color: LINE }; return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }, rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: w && w[i] })) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: w && w[i] })) }))] }); }

const children = [
  ...title('Stable Public Link — Cloudflare Tunnel (IT Setup)', 'Free, no-card, shared-data testing link on the contact.eg domain'),
  callout('Goal: a permanent HTTPS address (e.g. https://pipeline.contact.eg) that opens on ANY network and serves the real application with shared data — at no cost and with no credit card. Cloudflare Tunnel uses an OUTBOUND-only connection, so no inbound firewall ports need to be opened.'),

  h2('What you get'),
  bullet('A fixed URL such as https://pipeline.contact.eg (you choose the subdomain).'),
  bullet('Real backend = true shared data across all users (unlike a static demo).'),
  bullet('Works from any network, including outside the office; no warning/interstitial page.'),
  bullet('Free Cloudflare account; no credit card; no inbound firewall changes.'),

  h2('Prerequisites'),
  bullet('A machine that stays powered on to run the app — ideally a server/VM, or a dedicated office PC. (The app and cloudflared.exe already exist at C:\\Users\\do.orfy\\Desktop\\Walaa\\app on the current PC; copy this folder to the chosen host.)'),
  bullet('Node.js 18+ installed on that machine.'),
  bullet('A free Cloudflare account.'),
  bullet('The contact.eg domain manageable in Cloudflare — see the DNS decision below.'),

  h2('DNS decision (choose one)'),
  table(['Situation', 'What to do'], [
    ['contact.eg is already a zone in Cloudflare', 'Nothing extra — Step 4 creates the subdomain automatically.'],
    ['contact.eg DNS is elsewhere, but you can add records', 'Delegate just the subdomain to Cloudflare (NS records for pipeline.contact.eg), or after Step 3 add the CNAME that cloudflared prints, pointing pipeline.contact.eg to the tunnel’s <UUID>.cfargotunnel.com.'],
    ['You cannot touch contact.eg DNS now', 'Use any small domain you control on Cloudflare for testing, or the “Always-on machine (internal)” option — see the Go-Live runbook.'],
  ], [42, 58]),

  h2('Setup steps (run on the always-on machine)'),
  step(1, 'Ensure the backend runs. In the app folder:'),
  code('cd C:\\Users\\do.orfy\\Desktop\\Walaa\\app'),
  code('npm install --omit=dev'),
  code('node server.js     (confirm http://localhost:3000 works locally; later run it as a service)'),
  step(2, 'Authenticate cloudflared to your Cloudflare account (opens a browser):'),
  code('.\\cloudflared.exe tunnel login'),
  P('In the browser, sign in to Cloudflare and select the contact.eg zone. This saves a certificate (cert.pem) on the machine.', { after: 80 }),
  step(3, 'Create the named tunnel (note the Tunnel UUID and the credentials JSON path it prints):'),
  code('.\\cloudflared.exe tunnel create contact-pipeline'),
  step(4, 'Route the chosen hostname to the tunnel (creates the DNS record automatically when the zone is on Cloudflare):'),
  code('.\\cloudflared.exe tunnel route dns contact-pipeline pipeline.contact.eg'),
  step(5, 'Create a config file named config.yml (next to the credentials JSON, usually C:\\Users\\<user>\\.cloudflared\\) with:'),
  code('tunnel: <TUNNEL-UUID>'),
  code('credentials-file: C:\\Users\\<user>\\.cloudflared\\<TUNNEL-UUID>.json'),
  code('ingress:'),
  code('  - hostname: pipeline.contact.eg'),
  code('    service: http://localhost:3000'),
  code('  - service: http_status:404'),
  step(6, 'Test it:'),
  code('.\\cloudflared.exe tunnel run contact-pipeline'),
  P('Open https://pipeline.contact.eg from any network — it should show the platform.', { after: 80 }),
  step(7, 'Make it permanent (survives reboots) — install both as services:'),
  code('.\\cloudflared.exe service install      (runs the tunnel from config.yml at boot)'),
  bullet('Run the Node app as a service too: PM2 (cross-platform), a Windows Service via NSSM, or systemd on Linux — start "node server.js" on boot and restart on crash.'),

  h2('Result'),
  callout('https://pipeline.contact.eg — stable, free, no card, opens on any network, real shared data for all users. Sign in with the platform accounts (e.g. doaa.orfy / Contact@123).', 'DCFCE7', '15803D', '14532D'),

  h2('Notes & hardening'),
  bullet('Change the default passwords (currently Contact@123) before wide rollout.'),
  bullet('Data is stored in app\\data\\store.json — schedule a backup; consider a database for production (see the Go-Live runbook).'),
  bullet('Enabling email alerts: set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM as environment variables on the host.'),
  bullet('Company-data lookup (OpenCorporates) needs outbound HTTPS from the host; set OPENCORPORATES_API_TOKEN for higher limits.'),
  bullet('This is the same application already running for testing — only the hosting/exposure changes.'),
];

(async () => {
  const buf = await Packer.toBuffer(new Document({ styles: { default: { document: { run: { font: 'Segoe UI', size: 21, color: INK } } } }, sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Stable Link Setup (IT)          Page ', { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED })] })] }) }, children }] }));
  fs.writeFileSync(path.join(DESK, 'Contact-Group-Stable-Link-Setup-IT.docx'), buf);
  console.log('wrote Contact-Group-Stable-Link-Setup-IT.docx (' + buf.length + ' bytes)');
})();
