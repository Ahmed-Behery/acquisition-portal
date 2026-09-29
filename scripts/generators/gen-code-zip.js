// Bundle the application source for IT handover (excludes node_modules & runtime data).
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const APP = __dirname;
const zip = new JSZip();
const root = zip.folder('contact-group-app');

// Core runtime files to include.
const files = [
  'server.js', 'db.js', 'seed.js', 'tunnel.js',
  'package.json', 'package-lock.json',
  'public/index.html', 'public/guide.html',
];
files.forEach(rel => {
  const abs = path.join(APP, rel);
  if (fs.existsSync(abs)) root.file(rel, fs.readFileSync(abs));
});

// Include the document/deck generators (part of the codebase).
fs.readdirSync(APP).filter(f => /^gen-.*\.js$/.test(f)).forEach(f => {
  root.folder('generators').file(f, fs.readFileSync(path.join(APP, f)));
});

// A short README for IT.
root.file('README.txt',
`Contact Group — Client & Pipeline Platform (source)
===================================================

Run
---
  npm install
  node server.js
  open http://localhost:3000

Demo accounts (password: Contact@123)
  Admin: doaa.orfy   Head of Products: d.elsayed   RM: y.fahmy   CEO: h.mansour

Files
  server.js          Express server + JSON-backed API
  db.js              JSON store (data/store.json is created at runtime; delete to reseed)
  seed.js            Seed data + reference lists (governorates, CBE size defs, AML watchlist)
  public/index.html  The full single-page app (UI + logic)
  generators/        Document & presentation generators (BRD, handover, decks)

Config (env vars): PORT, SMTP_HOST/PORT/USER/PASS/SECURE/FROM, ADMIN_EMAIL, OPENCORPORATES_API_TOKEN

See "Technical Handover & Deployment Guide" for architecture, integrations, deployment and hardening.
Note: node_modules is NOT included — run 'npm install' to restore dependencies.
`);

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }).then(buf => {
  const out = path.join(APP, 'public', 'docs', 'Contact-Group-Source-Code.zip');
  fs.writeFileSync(out, buf);
  console.log('WROTE ' + out + ' (' + Math.round(buf.length / 1024) + ' KB)');
  try { fs.writeFileSync(path.join('C:', 'Users', 'do.orfy', 'Desktop', 'Contact-Group-Source-Code.zip'), buf); console.log('COPIED to Desktop'); }
  catch (e) { console.log('Desktop copy skipped: ' + e.message); }
});
