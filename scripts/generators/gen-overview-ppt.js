// Overview presentation: Objective, Usage, Cycle, Governance, SLA — Contact branded.
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.author = 'Contact Group';
p.title = 'Contact Group — Platform Overview';

const FONT = 'Segoe UI';
const PRIMARY = '1E40AF', DARK = '15306E', INK = '1A2332', SOFT = '475569', MUTED = '94A3B8';
const GREEN = '15803D', ORANGE = 'C2410C', PURPLE = '6B21A8', RED = 'B91C1C', TEAL = '0F766E';
const BLUEBG = 'DBEAFE', GREENBG = 'DCFCE7', ORANGEBG = 'FFEDD5', YELLOWBG = 'FEF3C7', PURPLEBG = 'F3E8FF', GREYBG = 'F1F5F9';
const TOTAL = 7;

function footer(s, n) {
  s.addText('Contact Group · Client & Pipeline Platform', { x: 0.5, y: 7.06, w: 9, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED });
  if (n) s.addText(n + '/' + TOTAL, { x: 12.2, y: 7.06, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: 'right' });
}
function header(s, t, n, sub) {
  s.background = { color: 'FFFFFF' };
  s.addShape(p.ShapeType.rect, { x: 0.5, y: 0.5, w: 0.22, h: 0.5, fill: { color: PRIMARY } });
  s.addText(t, { x: 0.84, y: 0.42, w: 12, h: 0.55, fontFace: FONT, fontSize: 24, bold: true, color: INK });
  if (sub) s.addText(sub, { x: 0.86, y: 0.98, w: 12, h: 0.3, fontFace: FONT, fontSize: 12.5, italic: true, color: PRIMARY });
  s.addShape(p.ShapeType.line, { x: 0.5, y: sub ? 1.33 : 1.15, w: 12.33, h: 0, line: { color: 'E2E8F0', width: 1 } });
  footer(s, n);
}
function bullets(s, items, o = {}) {
  s.addText(items.map(it => ({ text: (typeof it === 'string') ? it : it.t, options: { bullet: { indent: 16 }, breakLine: true, color: it.c || SOFT, bold: !!it.b, fontSize: o.fontSize || 15, paraSpaceAfter: o.gap != null ? o.gap : 11 } })),
    { x: o.x || 0.85, y: o.y || 1.6, w: o.w || 11.6, h: o.h || 5.0, fontFace: FONT, valign: 'top' });
}
function chip(s, x, y, w, h, label, fill, tc, fs) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { width: 0 } });
  s.addText(label, { x: x + 0.06, y, w: w - 0.12, h, fontFace: FONT, fontSize: fs || 12, bold: true, color: tc, align: 'center', valign: 'middle' });
}
function tbl(s, rows, opts) {
  s.addTable(rows, Object.assign({ x: 0.85, y: 1.7, w: 11.6, fontFace: FONT, fontSize: 12, color: SOFT, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, align: 'left', valign: 'middle', autoPage: false }, opts));
}
function th(t) { return { text: t, options: { bold: true, color: 'FFFFFF', fill: PRIMARY, fontSize: 12 } }; }

/* 1 — Title */
(() => {
  const s = p.addSlide(); s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addShape(p.ShapeType.rect, { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addText('CONTACT GROUP', { x: 0.9, y: 1.95, w: 11, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: '93C5FD', charSpacing: 3 });
  s.addText('Client & Pipeline Platform', { x: 0.85, y: 2.5, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 44, bold: true, color: 'FFFFFF' });
  s.addText('Platform overview — objective, usage, the cycle, governance and service levels', { x: 0.9, y: 3.65, w: 11.4, h: 0.6, fontFace: FONT, fontSize: 17, color: 'CBD5E1' });
  s.addText('Prepared for the Executive Committee & business stakeholders', { x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: FONT, fontSize: 12, color: '93C5FD' });
})();

/* 2 — Objective */
(() => {
  const s = p.addSlide(); header(s, 'Objective', 2, 'One shared, disciplined way to capture and grow every client opportunity across the whole group.');
  bullets(s, [
    { t: 'One group-wide pipeline — so the group never pursues or onboards the same client twice.', b: false },
    { t: 'Clean, consistent data — company names come from a verified directory, with mandatory company size (CBE) and governorate.' },
    { t: 'Compliance & quality built in — AML screening, no-duplication, and Head-of-Products validation where it matters.' },
    { t: 'Full visibility for leadership — the right people are informed automatically at every step.' },
    { t: 'One master merchant list — sold products, onboarding date, payment behaviour and exposure in a single place.' },
  ], { y: 1.7, w: 11.8, fontSize: 16, gap: 15 });
})();

/* 3 — Usage */
(() => {
  const s = p.addSlide(); header(s, 'Usage — who uses it, and how', 3);
  const roles = [
    ['RM / Employee', 'Log prospects, progress deals, update product stages, record bookings.', PRIMARY, BLUEBG],
    ['Head of Products', 'Validate entries; approve extensions, closings, edits & deletes.', ORANGE, ORANGEBG],
    ['CEO / MD / C-Level', 'Group-wide view; flag interest; delegate leads to their team.', PURPLE, PURPLEBG],
    ['Administrator', 'Maintain lists & accounts; receives a record of every request.', TEAL, GREENBG],
  ];
  let y = 1.5;
  roles.forEach(([r, d, c, bg]) => {
    s.addShape(p.ShapeType.roundRect, { x: 0.6, y, w: 5.9, h: 1.15, rectRadius: 0.07, fill: { color: bg }, line: { color: c, width: 1 } });
    s.addText(r, { x: 0.8, y: y + 0.12, w: 5.5, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: c });
    s.addText(d, { x: 0.8, y: y + 0.5, w: 5.5, h: 0.6, fontFace: FONT, fontSize: 11, color: SOFT });
    y += 1.3;
  });
  s.addShape(p.ShapeType.roundRect, { x: 6.8, y: 1.5, w: 6.0, h: 4.75, rectRadius: 0.08, fill: { color: GREYBG }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('The main screens', { x: 7.0, y: 1.65, w: 5.6, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  const pages = ['Dashboard — role-aware home', 'Pipeline — your prospects, filter & sort', 'All Merchants — master ledger + payment behaviour', 'Good to Go — release & re-engage', 'Department Leads — cross-department referrals', 'Interests — “I’m interested” + delegation', 'Admin & Lists — reference data, codes, SLAs'];
  let py = 2.05;
  pages.forEach(pg => { s.addText('•  ' + pg, { x: 7.0, y: py, w: 5.6, h: 0.35, fontFace: FONT, fontSize: 11.5, color: SOFT, valign: 'middle' }); py += 0.55; });
})();

/* 4 — The Cycle */
(() => {
  const s = p.addSlide(); header(s, 'The cycle', 4, 'From first contact to an onboarded merchant — with controls built in.');
  const y = 1.85, w = 1.83, h = 2.35, gap = 0.20;
  let x = 0.5;
  const stages = [
    ['Capture', 'RM logs the prospect (size, governorate, products).', BLUEBG, '1E3A8A', PRIMARY],
    ['Screen', 'AML + no-duplication run automatically.', 'FEE2E2', RED, RED],
    ['Validate', 'Directory → live; typed / cross-sell → Head of Products.', YELLOWBG, '854D0E', ORANGE],
    ['Negotiate', 'Stages with SLAs; each product tracked separately.', BLUEBG, '1E3A8A', PRIMARY],
    ['Close', 'Done Deal — HoP validates the signed contract.', PURPLEBG, PURPLE, PURPLE],
    ['Merchant', 'Coded merchant in All Merchants — or recycled to Good to Go.', GREENBG, '14532D', GREEN],
  ];
  stages.forEach(([t, sub, fill, tc, ac], i) => {
    s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: ac, width: 1.25 } });
    s.addShape(p.ShapeType.ellipse, { x: x + w / 2 - 0.2, y: y + 0.14, w: 0.4, h: 0.4, fill: { color: ac } });
    s.addText(String(i + 1), { x: x + w / 2 - 0.2, y: y + 0.14, w: 0.4, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
    s.addText(t, { x: x + 0.06, y: y + 0.6, w: w - 0.12, h: 0.4, fontFace: FONT, fontSize: 12.5, bold: true, color: tc, align: 'center' });
    s.addText(sub, { x: x + 0.08, y: y + 1.0, w: w - 0.16, h: h - 1.05, fontFace: FONT, fontSize: 9.5, color: SOFT, align: 'center', valign: 'top' });
    if (i < stages.length - 1) s.addShape(p.ShapeType.rightArrow, { x: x + w + (gap - 0.16) / 2, y: y + h / 2 - 0.17, w: 0.16, h: 0.34, fill: { color: MUTED }, line: { width: 0 } });
    x += w + gap;
  });
  s.addShape(p.ShapeType.roundRect, { x: 0.5, y: 4.75, w: 12.1, h: 1.5, rectRadius: 0.06, fill: { color: GREYBG }, line: { width: 0 } });
  s.addText('Along the way', { x: 0.72, y: 4.85, w: 11.6, h: 0.3, fontFace: FONT, fontSize: 12.5, bold: true, color: PRIMARY });
  s.addText([
    { text: 'Leadership (CEO, MD, C-level, Branch) is notified at every step and can flag interest or delegate a lead. ', options: { color: SOFT } },
    { text: 'An existing merchant can be cross-sold (different department + product, HoP-validated). ', options: { color: SOFT } },
    { text: 'Unfinished entries are kept as drafts. Idle merchants can be released to Good to Go and re-engaged group-wide.', options: { color: SOFT } },
  ], { x: 0.72, y: 5.15, w: 11.7, h: 1.0, fontFace: FONT, fontSize: 12, valign: 'top' });
})();

/* 5 — Governance */
(() => {
  const s = p.addSlide(); header(s, 'Governance', 5);
  const items = [
    ['Legal control gate', 'Before any agreement is signed, Legal confirms the deal and client exist on the portal — otherwise a ticket is required before signing.', TEAL, GREENBG],
    ['Head-of-Products validation', 'A single quality gate for typed, cross-sell, late, extend, close, edit and delete actions.', ORANGE, ORANGEBG],
    ['AML & no-duplication', 'Every prospect name is screened against the watchlist and checked across merchants, pipeline and Good to Go.', RED, 'FEE2E2'],
    ['Audit trail', 'Full comment & decision history on every entry; an admin log of every request.', PURPLE, PURPLEBG],
    ['Portal disclaimer', 'Investigation requests are not processed unless the entry is on the portal.', PRIMARY, BLUEBG],
    ['Initial data', 'Loaded from Finance (coded merchants) and Legal (signed agreements) for a verified starting book.', SOFT, GREYBG],
  ];
  const cw = 3.95, ch = 1.6, gx = 0.2, gy = 0.2;
  let i = 0;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const x = 0.6 + c * (cw + gx), y = 1.55 + r * (ch + gy);
    const [t, d, ac, bg] = items[i++];
    s.addShape(p.ShapeType.roundRect, { x, y, w: cw, h: ch, rectRadius: 0.07, fill: { color: bg }, line: { color: ac, width: 1 } });
    s.addText(t, { x: x + 0.18, y: y + 0.14, w: cw - 0.35, h: 0.4, fontFace: FONT, fontSize: 13.5, bold: true, color: ac });
    s.addText(d, { x: x + 0.18, y: y + 0.58, w: cw - 0.35, h: 0.95, fontFace: FONT, fontSize: 10.5, color: SOFT });
  }
  s.addText('Consistent data · enforced compliance · clear accountability across the whole group.', { x: 0.6, y: 5.5, w: 12.1, h: 0.5, fontFace: FONT, fontSize: 13.5, italic: true, bold: true, color: PRIMARY, align: 'center' });
})();

/* 6 — SLA */
(() => {
  const s = p.addSlide(); header(s, 'Service levels (SLA)', 6, 'Egypt working week (Sun–Thu). Missing an SLA flags the entry for follow-up.');
  tbl(s, [
    [th('Cycle / SLA'), th('Stage'), th('Target (working days)'), th('What must happen')],
    ['Cycle 1', 'First Meeting', '5', 'Log the outcome and advance to Negotiation.'],
    ['Cycle 2', 'Negotiation', '10', 'Progress the deal or update the entry.'],
    ['Cycle 3', 'Negotiation C1', '10', 'Second negotiation round before escalation.'],
    ['Cycle 4', 'Negotiation C2', '10', 'Final negotiation round before escalation.'],
    ['Extension', 'Extend Negotiation', '10', 'HoP approval, then 10 more days.'],
    ['Closing', 'Done Deal', '2', 'HoP validates the signed contract; approval creates the merchant.'],
  ], { y: 1.7, colW: [1.6, 2.5, 2.3, 5.2], rowH: 0.44 });
  s.addText('Cross-cutting SLAs', { x: 0.85, y: 5.35, w: 11, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  bullets(s, [
    { t: 'Interest / delegation follow-up — 2 working days for the RM to contact the leader or delegate, else it escalates to the manager.', b: false },
    { t: 'Stale-entry reminder — any entry idle 7+ working days is flagged to the Head of Products (weekly sweep).' },
  ], { x: 0.85, y: 5.65, w: 12, fontSize: 12, gap: 7 });
})();

/* 7 — Closing */
(() => {
  const s = p.addSlide(); s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addShape(p.ShapeType.rect, { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addText('One pipeline. One discipline. The whole group.', { x: 0.9, y: 2.7, w: 11.5, h: 0.9, fontFace: FONT, fontSize: 32, bold: true, color: 'FFFFFF' });
  s.addText('Every prospect captured cleanly, screened automatically, validated where it matters, and visible to leadership from first contact to onboarded merchant.', { x: 0.9, y: 3.75, w: 11.2, h: 1.0, fontFace: FONT, fontSize: 15, color: 'CBD5E1' });
  s.addText('Contact Group · Client & Pipeline Platform', { x: 0.9, y: 6.4, w: 11, h: 0.4, fontFace: FONT, fontSize: 12, color: '93C5FD' });
})();

const OUT = 'Contact-Group-Overview.pptx';
const outDocs = path.join(__dirname, 'public', 'docs', OUT);
p.writeFile({ fileName: outDocs }).then(() => {
  console.log('WROTE ' + outDocs);
  try { fs.copyFileSync(outDocs, path.join('C:', 'Users', 'do.orfy', 'Desktop', OUT)); console.log('COPIED to Desktop'); }
  catch (e) { console.log('Desktop copy skipped: ' + e.message); }
}).catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
