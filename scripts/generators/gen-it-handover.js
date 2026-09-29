// IT Technical Handover & Deployment Guide (the "code document" for IT).
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, PageNumber } = require('docx');

const DESK = 'C:/Users/do.orfy/Desktop';
const OUTDOCS = path.join(__dirname, 'public', 'docs');
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE', CODEBG = 'F1F5F9', CODECLR = '0F172A';
const run = (t, o = {}) => new TextRun({ text: t, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: o.mono ? 'Consolas' : 'Segoe UI' });
const P = (t, o = {}) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: o.after != null ? o.after : 120, line: 268 } });
const h1 = (t) => new Paragraph({ children: [run(t, { size: 28, bold: true, color: PRIMARY })], spacing: { before: 260, after: 100 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const h2 = (t) => new Paragraph({ children: [run(t, { size: 23, bold: true, color: INK })], spacing: { before: 170, after: 60 } });
const bullet = (t) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 55, line: 264 } });
const code = (lines) => new Paragraph({ children: lines.flatMap((l, i) => [new TextRun({ text: l, size: 18, color: CODECLR, font: 'Consolas', break: i ? 1 : 0 })]), shading: { fill: CODEBG }, spacing: { before: 80, after: 140 }, indent: { left: 120 }, border: { left: { color: PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 18 } } });
const callout = (t) => new Paragraph({ children: [run(t, { color: '1E3A8A', size: 20 })], shading: { fill: 'EFF4FF' }, border: { left: { color: PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 90, after: 140 }, indent: { left: 120 } });
function cell(t, o = {}) { return new TableCell({ children: (Array.isArray(t) ? t : [t]).map(x => new Paragraph({ children: [run(x, { size: o.size || 17, bold: o.bold, color: o.color || (o.header ? PRIMARY : SOFT), mono: o.mono })], spacing: { after: 20, line: 244 } })), shading: o.header ? { fill: HEADBG } : undefined, width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 46, bottom: 46, left: 80, right: 80 } }); }
function table(headers, rows, w, mono) { const b = { style: BorderStyle.SINGLE, size: 4, color: LINE }; return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }, rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: w && w[i] })) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: w && w[i], mono: mono && mono[i] })) }))] }); }

const children = [
  new Paragraph({ children: [run('Technical Handover & Deployment Guide', { size: 40, bold: true, color: PRIMARY })], spacing: { after: 60 } }),
  new Paragraph({ children: [run('Contact Group · Client & Pipeline Platform', { size: 24, color: MUTED })], spacing: { after: 60 } }),
  new Paragraph({ children: [run('For the IT department · Version 1.0', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 200 } }),

  h1('1. Overview'),
  P('The platform is a single-page web application backed by a small Node.js/Express server. It has no external database dependency — state is persisted to a JSON file — so it runs anywhere Node runs. This document lets IT run, host, secure, and extend it, and describes the integrations to wire up for production.'),

  h1('2. Technology stack'),
  table(['Layer', 'Technology'], [
    ['Runtime', 'Node.js (v18+ recommended)'],
    ['Web server', 'Express 4'],
    ['Auth', 'Cookie session + bcryptjs password hashing'],
    ['Email', 'nodemailer (SMTP — optional)'],
    ['Persistence', 'JSON file store (data/store.json), atomic write'],
    ['Frontend', 'Single HTML file (public/index.html) — vanilla JS SPA, no build step'],
    ['Docs tooling', 'docx, pptxgenjs (report/deck generators)'],
  ], [30, 70]),

  h1('3. Source layout'),
  table(['Path', 'Purpose'], [
    ['server.js', 'Express app: auth, /api/state (GET/PUT), company search, notify-admin, user create, static hosting.'],
    ['db.js', 'JSON store: load/save, fresh seed, public user projection.'],
    ['seed.js', 'All seed data: users, companies, products, clients, pipeline, industries, governorates, company-size (CBE) defs, AML watchlist, recipients.'],
    ['public/index.html', 'The entire SPA (UI, routing, business logic, render functions).'],
    ['data/store.json', 'Runtime state (created on first run). Delete to reseed.'],
    ['package.json', 'Dependencies and scripts.'],
    ['gen-*.js', 'Document/deck generators (BRD, handover, presentations).'],
  ], [30, 70], [true, false]),

  h1('4. Running locally'),
  code(['cd app', 'npm install', 'node server.js', '# open http://localhost:3000']),
  P('The server listens on PORT (default 3000). Demo accounts use the password Contact@123 (Admin: doaa.orfy, Head of Products: d.elsayed, RM: y.fahmy, CEO: h.mansour).'),

  h1('5. Configuration (environment variables)'),
  table(['Variable', 'Purpose', 'Default'], [
    ['PORT', 'HTTP port', '3000'],
    ['SMTP_HOST / SMTP_PORT', 'Email gateway (enables real emails)', 'unset → in-app + logged'],
    ['SMTP_USER / SMTP_PASS', 'SMTP auth', 'unset'],
    ['SMTP_SECURE / SMTP_FROM', 'TLS + from-address', 'false / no-reply@contact.eg'],
    ['ADMIN_EMAIL', 'Admin alert recipient', 'Doaa.Orfy@contact.eg'],
    ['OPENCORPORATES_API_TOKEN', 'Company-registry lookup token', 'unset (falls back to seed list)'],
  ], [34, 44, 22], [true, false, true]),

  h1('6. Data model (key entities)'),
  bullet([run('User', { bold: true, color: INK }), run(' — id, name, role (Admin/CEO/MD/Head of Products/RM/Employee), group (MD/C-Level/Branch Manager), companyId, email, phone, username, passHash.', { color: SOFT })]),
  bullet([run('Client (merchant)', { bold: true, color: INK }), run(' — id, name, code, companyId, rmId, exposure, productsSold, status, industry, companySize, governorate, onboardedDate, paymentBehavior (good/regular/bad).', { color: SOFT })]),
  bullet([run('Pipeline entry', { bold: true, color: INK }), run(' — id, code, prospect, industry, companySize, governorate, productsOfInterest, productLines[{productId, subStatus, main}], value, status, rmId, enteredBy, companyId, amlStatus, crossSell{clientId,…}, interestedFlags[{userId, productId, delegatedTo, contacted,…}], comments, attachments.', { color: SOFT })]),
  bullet([run('Referral', { bold: true, color: INK }), run(' — id, company, description, productId, fromDept, toLeaderId, status (Open/Delegated), delegatedTo.', { color: SOFT })]),
  bullet([run('Reference lists', { bold: true, color: INK }), run(' — companies, products, industries, governorates, companySizes + companySizeDefs, recipients, amlWatchlist, notifications.', { color: SOFT })]),

  h1('7. API surface'),
  table(['Endpoint', 'Method', 'Purpose'], [
    ['/api/register', 'POST', 'Self-register an RM account.'],
    ['/api/login  /  /api/logout  /  /api/me', 'POST/GET', 'Session auth.'],
    ['/api/state', 'GET', 'Full snapshot the SPA needs after login.'],
    ['/api/state', 'PUT/POST', 'Persist mutable state (clients, pipeline, notifications, referrals, reference lists).'],
    ['/api/companies/search', 'GET', 'Company lookup (OpenCorporates EG → seed fallback).'],
    ['/api/notify-admin', 'POST', 'Log + optionally email an admin alert.'],
    ['/api/users', 'POST', 'Admin: create an employee account.'],
  ], [40, 16, 44], [true, false, false]),

  h1('8. Deployment options'),
  h2('A. Office network (current)'),
  P('The server binds all interfaces, so any colleague on the company network reaches it directly — no tunnel required. Windows Firewall is disabled on the host, so port 3000 is open.'),
  code(['Internal:  http://192.168.21.96:3000', 'Backup:    http://192.168.0.233:3000']),
  h2('B. Permanent internal address (recommended)'),
  bullet('Host on an internal server / VM with a DNS name on contact.eg, served behind IIS/nginx as a reverse proxy to Node on 3000.'),
  bullet('Run Node as a Windows service (e.g. NSSM or a scheduled task) so it restarts automatically.'),
  bullet('For remote/home access, publish via the corporate VPN or a named Cloudflare tunnel on contact.eg (public quick-tunnels are blocked by the network filter).'),
  callout('Note: public reverse-tunnel services (trycloudflare, localtunnel, serveo) are blocked/reset by the corporate network filter. Use an internal address + VPN, or a named tunnel on a trusted domain.'),

  h1('9. Integrations to wire for production'),
  table(['Integration', 'Where it plugs in'], [
    ['Company registry', '/api/companies/search — set OPENCORPORATES_API_TOKEN or point to the internal registry.'],
    ['AML watchlist', 'seed.AML_WATCHLIST / store.data.amlWatchlist — replace with the compliance feed.'],
    ['Contact database', 'user.phone / user.email — sync from the contact DB (currently seeded).'],
    ['Email (SMTP)', 'Set SMTP_* to deliver notifications; extend /api/notify-admin to send to per-user recipients.'],
    ['SSO / Active Directory', 'Replace the login endpoint with SSO; map AD groups to roles.'],
    ['Finance & Legal data load', 'Import coded merchants (Finance) and signed agreements (Legal) into clients on go-live.'],
  ], [30, 70]),

  h1('10. Security & hardening (for production)'),
  bullet('Move persistence from the JSON file to a managed database (e.g. PostgreSQL) for concurrency and backup.'),
  bullet('Serve over HTTPS; set secure, httpOnly, sameSite cookies; add CSRF protection on state-changing endpoints.'),
  bullet('Replace demo passwords; enforce SSO; add server-side authorization checks per role (the SPA currently enforces role rules client-side).'),
  bullet('Add audit logging and scheduled backups of the data store.'),

  h1('11. Known limitations'),
  bullet('Shared state uses last-write-wins; concurrent editors should refresh to see each other’s changes (a database + optimistic concurrency resolves this).'),
  bullet('Role permissions are enforced in the SPA; server-side enforcement should be added before external exposure.'),
  bullet('Exposure / sales / payment behaviour are user-maintained pending accounting integration.'),

  h1('12. Handover checklist'),
  bullet('Source code package (attached separately) — the app folder minus node_modules.'),
  bullet('Provision an internal host + DNS on contact.eg; run Node as a service behind a reverse proxy.'),
  bullet('Configure SMTP, company-registry token, and SSO.'),
  bullet('Load the Finance + Legal backlog; confirm CBE size thresholds with Compliance.'),
  bullet('Plan the database migration for a multi-user production deployment.'),
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Segoe UI' } } } },
  sections: [{
    properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Technical Handover v1.0     Page ', { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: 'Segoe UI' })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(OUTDOCS, 'Contact-Group-IT-Technical-Handover.docx');
  fs.writeFileSync(out, buf);
  console.log('WROTE ' + out);
  try { fs.writeFileSync(path.join(DESK, 'Contact-Group-IT-Technical-Handover.docx'), buf); console.log('COPIED to Desktop'); } catch (e) { console.log('Desktop copy skipped: ' + e.message); }
});
