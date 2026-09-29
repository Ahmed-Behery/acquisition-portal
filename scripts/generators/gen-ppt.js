// Generates the management presentation (.pptx) on the Desktop.
const pptxgen = require('pptxgenjs');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';            // 13.33 x 7.5 in
p.author = 'Contact Group';
p.company = 'Contact Group';

const FONT = 'Segoe UI';
const PRIMARY = '1E40AF', DARK = '15306E', INK = '1A2332', SOFT = '475569', MUTED = '94A3B8';
const GREEN = '15803D', ORANGE = 'C2410C', RED = 'B91C1C';
const BLUEBG = 'DBEAFE', GREENBG = 'DCFCE7', ORANGEBG = 'FFEDD5', YELLOWBG = 'FEF3C7', LIGHT = 'F1F5F9';

function footer(slide, n) {
  slide.addText('Contact Group · Client & Pipeline Platform', { x: 0.5, y: 7.06, w: 8, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED });
  slide.addText('Management Overview · ' + n + '/7', { x: 9.0, y: 7.06, w: 3.83, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: 'right' });
}
function header(slide, title, n) {
  slide.background = { color: 'FFFFFF' };
  slide.addShape(p.ShapeType.rect, { x: 0.5, y: 0.52, w: 0.22, h: 0.52, fill: { color: PRIMARY } });
  slide.addText(title, { x: 0.85, y: 0.46, w: 12, h: 0.62, fontFace: FONT, fontSize: 25, bold: true, color: INK });
  slide.addShape(p.ShapeType.line, { x: 0.5, y: 1.22, w: 12.33, h: 0, line: { color: 'E2E8F0', width: 1 } });
  footer(slide, n);
}
function bullets(slide, items, o = {}) {
  slide.addText(items.map(it => ({
    text: (typeof it === 'string') ? it : it.t,
    options: { bullet: { indent: 16 }, breakLine: true, color: (it.c || SOFT), bold: !!it.b, fontSize: o.fontSize || 15, paraSpaceAfter: o.gap != null ? o.gap : 9 },
  })), { x: o.x || 0.9, y: o.y || 1.55, w: o.w || 11.5, h: o.h || 5.0, fontFace: FONT, valign: 'top' });
}
function fbox(slide, x, y, w, h, lines, fill, tc) {
  slide.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: PRIMARY, width: 1 } });
  slide.addText(lines, { x, y, w, h, fontFace: FONT, fontSize: 12.5, bold: true, color: tc || INK, align: 'center', valign: 'middle' });
}
function arrow(slide, x, y, w) {
  slide.addShape(p.ShapeType.line, { x, y, w, h: 0, line: { color: '64748B', width: 1.75, endArrowType: 'triangle' } });
}
function callout(slide, x, y, w, h, text, bg, bc, tcolor) {
  slide.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: bg }, line: { color: bc, width: 1 } });
  slide.addText(text, { x: x + 0.15, y, w: w - 0.3, h, fontFace: FONT, fontSize: 13, color: tcolor, align: 'left', valign: 'middle' });
}

// ---------- Slide 1 — Title ----------
(() => {
  const s = p.addSlide();
  s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addShape(p.ShapeType.rect, { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addText('CONTACT GROUP', { x: 0.9, y: 1.9, w: 11, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: '93C5FD', charSpacing: 3 });
  s.addText('Client & Pipeline Platform', { x: 0.85, y: 2.5, w: 11.6, h: 1.1, fontFace: FONT, fontSize: 44, bold: true, color: 'FFFFFF' });
  s.addText('Management Overview — objective, how it works, and proposed integration policy', { x: 0.9, y: 3.7, w: 11, h: 0.6, fontFace: FONT, fontSize: 17, color: 'CBD5E1' });
  s.addText('June 2026 · Confidential', { x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: FONT, fontSize: 12, color: '93C5FD' });
})();

// ---------- Slide 2 — Objective ----------
(() => {
  const s = p.addSlide(); header(s, 'Objective', 2);
  s.addText('A single, shared system to capture and govern every prospect across all Contact Group companies.',
    { x: 0.9, y: 1.45, w: 11.5, h: 0.7, fontFace: FONT, fontSize: 17, italic: true, color: PRIMARY });
  bullets(s, [
    { t: 'One group-wide view of prospects and the pipeline — search before approaching to avoid duplicate outreach.' },
    { t: 'Faster, consistent data capture using the Egyptian companies directory and managed dropdown lists.' },
    { t: 'Built-in governance — the Head of Products validates every new entry; extensions, deals, edits and deletions are approved.' },
    { t: 'Cross-sell across the group: Factoring, Leasing, Mortgage, Credit, Insurance and Contact Auto.' },
    { t: 'Full visibility for leadership, with automatic notifications to all relevant stakeholders.' },
  ], { y: 2.35, fontSize: 16, gap: 12 });
})();

// ---------- Slide 3 — How it works ----------
(() => {
  const s = p.addSlide(); header(s, 'How it works', 3);
  s.addText('From prospect capture to a converted merchant — every new entry is validated by the Head of Products.',
    { x: 0.9, y: 1.4, w: 11.5, h: 0.6, fontFace: FONT, fontSize: 15, color: SOFT });
  const y = 3.0, h = 1.05, w = 2.1, xs = [0.6, 3.0, 5.4, 7.8, 10.2];
  const labels = [
    ['1 · Capture', 'prospect'],
    ['2 · Notify', 'leadership'],
    ['3 · HoP', 'validates'],
    ['4 · Negotiate', '(stages)'],
    ['5 · Close →', 'Merchant'],
  ];
  const fills = [BLUEBG, BLUEBG, YELLOWBG, BLUEBG, GREENBG];
  labels.forEach((l, i) => fbox(s, xs[i], y, w, h, l.join('\n'), fills[i]));
  for (let i = 0; i < 4; i++) arrow(s, xs[i] + w + 0.02, y + h / 2, 0.26);
  callout(s, 1.6, 4.7, 10.1, 0.7, '↻  No update within the window → the entry moves to the Good to Go list, where any RM across the group can re-engage it.', LIGHT, 'CBD5E0', SOFT);
  s.addText('Notifications are sent at each step; the Administrator is alerted on every submitted request.',
    { x: 0.9, y: 5.7, w: 11.5, h: 0.5, fontFace: FONT, fontSize: 12.5, italic: true, color: MUTED });
})();

// ---------- Slide 4 — What it does / roles ----------
(() => {
  const s = p.addSlide(); header(s, 'What it does', 4);
  s.addText('Key capabilities', { x: 0.9, y: 1.45, w: 5.7, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  bullets(s, [
    'Prospect capture with directory lookup, contact details & Commercial Register no.',
    'Centrally-managed industry and product lists feeding every dropdown',
    'Notifications to the full leadership distribution list on each new prospect',
    'Head of Products validation, plus approvals for extensions / deals / edits',
    'Master Ledger of all merchants across the group',
    'Admin email alert on every submitted request',
  ], { x: 0.9, y: 1.95, w: 5.7, h: 4.6, fontSize: 13.5, gap: 9 });

  s.addShape(p.ShapeType.line, { x: 6.75, y: 1.5, w: 0, h: 4.7, line: { color: 'E2E8F0', width: 1 } });
  s.addText('Roles', { x: 7.0, y: 1.45, w: 5.7, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  bullets(s, [
    { t: 'Employee / RM — create and progress pipeline entries', b: true },
    { t: 'Head of Products — validate entries and govern approvals', b: true },
    { t: 'CEO / MD — group-wide oversight and visibility', b: true },
    { t: 'Administrator — manage lists, accounts and monitoring', b: true },
  ], { x: 7.0, y: 1.95, w: 5.7, h: 4.6, fontSize: 14, gap: 14 });
})();

// ---------- Slide 5 — Status & readiness ----------
(() => {
  const s = p.addSlide(); header(s, 'Status & readiness', 5);
  bullets(s, [
    { t: 'Live for testing with secure, per-user login and role-based dashboards.' },
    { t: 'All employees in the directory can sign in and insert entries.' },
    { t: 'Reference data (industries, products, prospect directory) is configurable in-app.' },
    { t: 'Ready to host on Contact servers: Node.js application + SMTP for email + company-data API.' },
    { t: 'Next step: deploy on the Contact network for a permanent internal address (IT pack provided).' },
  ], { y: 1.7, fontSize: 16, gap: 13 });
  callout(s, 0.9, 5.7, 11.5, 0.7, 'Provided alongside this deck: role guides, the entry-lifecycle guide, the IT go-live & integrations guide, and the full platform user guide.', BLUEBG, PRIMARY, DARK);
})();

// ---------- Slide 6 — Proposed procedure (1 of 2) ----------
(() => {
  const s = p.addSlide(); header(s, 'Proposed procedure (1 of 2): Link with lending platforms', 6);
  s.addText('Integrate the platform with any Contact lending system, matched on the Commercial Register number.',
    { x: 0.9, y: 1.4, w: 11.5, h: 0.6, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  s.addText('When a lending request is created for a company that is NOT yet an entry on the platform, the system automatically sends an email to:',
    { x: 0.9, y: 2.15, w: 11.5, h: 0.6, fontFace: FONT, fontSize: 14.5, color: SOFT });

  const y = 3.0, h = 1.25, w = 3.5;
  fbox(s, 0.9, y, w, h, 'Initiator\nof the lending request', BLUEBG);
  fbox(s, 4.9, y, w, h, 'Initiator’s manager\n→ insert client on the portal', BLUEBG);
  fbox(s, 8.9, y, w, h, 'Head of Products\n→ follow up', YELLOWBG);

  callout(s, 0.9, 4.7, 11.5, 1.4,
    'Trigger key: Commercial Register field.\n\nThe lending request proceeds in the lending system, but the platform now flags that this client must be added to the portal — and routes that responsibility to the initiator, their manager, and the Head of Products.',
    LIGHT, 'CBD5E0', SOFT);
})();

// ---------- Slide 7 — Proposed procedure (2 of 2) ----------
(() => {
  const s = p.addSlide(); header(s, 'Proposed procedure (2 of 2): Enforcement & sync', 7);
  bullets(s, [
    { t: 'If the client is still not on the portal by the investigation step, that step is blocked until the initiator inserts the client.' },
    { t: 'No override of this gate is allowed unless the Head of Products approves it.' },
    { t: 'Once the integrated systems confirm the client is active, the platform automatically adds them to the Merchants list.' },
    { t: 'All stakeholders are then notified that the merchant list was updated — flagged as a system-originated update.' },
  ], { y: 1.55, fontSize: 15, gap: 11, h: 3.0 });

  callout(s, 0.9, 4.55, 11.5, 0.95,
    '⚠  Override penalty: any override to proceed without inserting the client on the portal means 50% of the deal’s profitability is NOT credited to the initiator.',
    YELLOWBG, ORANGE, '7C2D12');
  callout(s, 0.9, 5.65, 11.5, 0.85,
    '✓  Result: lending and the platform stay in sync on the Commercial Register, the merchant list is always complete, and accountability is enforced automatically.',
    GREENBG, GREEN, '14532D');
})();

p.writeFile({ fileName: 'C:/Users/do.orfy/Desktop/Contact-Group-Management-Presentation.pptx' })
  .then(f => console.log('wrote', f))
  .catch(e => { console.error('ERR', e); process.exit(1); });
