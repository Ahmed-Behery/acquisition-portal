// Generates the illustrative "New Entry — Lifecycle & Journey" presentation.
const pptxgen = require('pptxgenjs');
const path = require('path');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.author = 'Contact Group';

const IMG = path.join(__dirname, 'docimg');
const FONT = 'Segoe UI';
const PRIMARY = '1E40AF', DARK = '15306E', INK = '1A2332', SOFT = '475569', MUTED = '94A3B8', GREEN = '15803D', ORANGE = 'C2410C', PURPLE = '6B21A8';
const dims = { 'fc-newentry':[960,1530], 'fc-entry':[1520,940], 'fc-validation':[1520,860], 'fc-lifecycle':[1520,840], 'fc-access':[1520,720], 'fc-admin':[1520,600] };
const TOTAL = 8;

function footer(s, n) {
  s.addText('Contact Group · New Entry — Lifecycle & Journey', { x: 0.5, y: 7.06, w: 8, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED });
  s.addText(n + '/' + TOTAL, { x: 12.2, y: 7.06, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: 'right' });
}
function header(s, t, n) {
  s.background = { color: 'FFFFFF' };
  s.addShape(p.ShapeType.rect, { x: 0.5, y: 0.5, w: 0.22, h: 0.5, fill: { color: PRIMARY } });
  s.addText(t, { x: 0.84, y: 0.44, w: 12, h: 0.6, fontFace: FONT, fontSize: 25, bold: true, color: INK });
  s.addShape(p.ShapeType.line, { x: 0.5, y: 1.18, w: 12.33, h: 0, line: { color: 'E2E8F0', width: 1 } });
  footer(s, n);
}
function bullets(s, items, o = {}) {
  s.addText(items.map(it => ({ text: (typeof it === 'string') ? it : it.t, options: { bullet: { indent: 16 }, breakLine: true, color: (it.c || SOFT), bold: !!it.b, fontSize: o.fontSize || 14, paraSpaceAfter: o.gap != null ? o.gap : 9 } })),
    { x: o.x || 0.85, y: o.y || 1.5, w: o.w || 6.0, h: o.h || 5.2, fontFace: FONT, valign: 'top' });
}
// fit an image inside a box (inches), centered
function img(s, name, bx, by, bw, bh) {
  const [w, h] = dims[name]; const r = w / h;
  let iw = bw, ih = bw / r; if (ih > bh) { ih = bh; iw = bh * r; }
  s.addImage({ path: path.join(IMG, name + '.png'), x: bx + (bw - iw) / 2, y: by + (bh - ih) / 2, w: iw, h: ih });
}
function chip(s, x, y, w, label, fill, tc) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.62, rectRadius: 0.08, fill: { color: fill }, line: { color: 'FFFFFF', width: 0 } });
  s.addText(label, { x: x + 0.1, y, w: w - 0.2, h: 0.62, fontFace: FONT, fontSize: 12.5, bold: true, color: tc, align: 'center', valign: 'middle' });
}

// 1 — Title
(() => {
  const s = p.addSlide(); s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addShape(p.ShapeType.rect, { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addText('CONTACT GROUP · CLIENT & PIPELINE PLATFORM', { x: 0.9, y: 2.0, w: 11.5, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: '93C5FD', charSpacing: 2 });
  s.addText('New Entry — Lifecycle & Journey', { x: 0.85, y: 2.55, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 42, bold: true, color: 'FFFFFF' });
  s.addText('An illustrated walkthrough of every step, branch and validation — from capture to a converted merchant', { x: 0.9, y: 3.7, w: 11, h: 0.7, fontFace: FONT, fontSize: 16, color: 'CBD5E1' });
  s.addText('June 2026 · Confidential', { x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: FONT, fontSize: 12, color: '93C5FD' });
})();

// 2 — The journey at a glance (full flow chart)
(() => {
  const s = p.addSlide(); header(s, 'The journey at a glance', 2);
  img(s, 'fc-newentry', 0.3, 1.35, 5.2, 5.7);
  s.addText('Five phases, end to end:', { x: 6.0, y: 1.6, w: 6.8, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  chip(s, 6.0, 2.15, 6.6, '1 · Create — RM/Employee captures the prospect', 'DBEAFE', '1E3A8A');
  chip(s, 6.0, 2.95, 6.6, '2 · Notify & route — leadership + admin alerted, sent to HoP', 'F3E8FF', PURPLE);
  chip(s, 6.0, 3.75, 6.6, '3 · Validate — HoP approves or returns', 'FEF3C7', '854D0E');
  chip(s, 6.0, 4.55, 6.6, '4 · Negotiate — stages, extensions, edits (HoP-approved)', 'DBEAFE', '1E3A8A');
  chip(s, 6.0, 5.35, 6.6, '5 · Outcome — Merchant created · Good to Go · or Lost', 'DCFCE7', '14532D');
  s.addText('Full-size chart: Contact-Group-New-Entry-Lifecycle-Flowchart (HTML/PDF).', { x: 6.0, y: 6.25, w: 6.6, h: 0.4, fontFace: FONT, fontSize: 11.5, italic: true, color: MUTED });
})();

// 3 — Phase 1: Create
(() => {
  const s = p.addSlide(); header(s, 'Phase 1 — Create the prospect (RM / Employee)', 3);
  img(s, 'fc-entry', 6.0, 1.5, 6.9, 5.2);
  bullets(s, [
    { t: 'Prospect name from the Egypt company directory, or "Not included" → free text (flagged for HoP).', b: false },
    'Industry from the managed list; Products multi-select from the catalogue.',
    'Commercial Register no. (auto-filled from the directory) + contact person, mobile, email.',
    'Company, expected value, visit & close dates, attendees, summary.',
    { t: 'Validations: required fields checked; a past visit date requires late-entry details.', c: ORANGE },
    { t: 'On Save: all 74 leadership recipients notified, Admin emailed, status → Pending HoP Validation, RM taken to the Product Catalogue.', c: PURPLE },
  ], { x: 0.7, y: 1.6, w: 5.1, h: 5.3, fontSize: 14, gap: 12 });
})();

// 4 — Phase 2: Validate
(() => {
  const s = p.addSlide(); header(s, 'Phase 2 — Head of Products validation', 4);
  img(s, 'fc-validation', 6.0, 1.6, 6.9, 4.8);
  bullets(s, [
    { t: 'The HoP reviews the whole case before it can progress.', b: true },
    { t: 'Approve → status becomes "First Meeting".', c: GREEN },
    { t: 'Return — "please choose prospect name": used when a "Not included" prospect is actually in the directory.', c: ORANGE },
    { t: 'Return with a mandatory comment: for any other issue.', c: ORANGE },
    'Returned entries go back to the RM, who corrects and clicks "Resubmit for validation".',
    'A full comment / validation history is kept on every entry.',
  ], { x: 0.7, y: 1.7, w: 5.1, h: 5.0, fontSize: 14.5, gap: 13 });
})();

// 5 — Phase 3: Negotiate & approvals
(() => {
  const s = p.addSlide(); header(s, 'Phase 3 — Negotiate, extend & approvals', 5);
  img(s, 'fc-lifecycle', 6.0, 1.6, 6.9, 4.9);
  bullets(s, [
    { t: 'Stages: First Meeting → Negotiation → C1 → C2.', b: true },
    'Extension request → Head of Products approves (continue) or rejects (close).',
    'Edit or Delete request → Head of Products approves or rejects.',
    'Meeting outcome (closure date, minutes / call report) recorded after each visit.',
    { t: 'Every request also emails the Administrator (doaa.orfy).', c: PURPLE },
  ], { x: 0.7, y: 1.7, w: 5.1, h: 5.0, fontSize: 14.5, gap: 13 });
})();

// 6 — Phase 4: Outcome
(() => {
  const s = p.addSlide(); header(s, 'Phase 4 — Outcome', 6);
  chip(s, 0.85, 1.7, 3.7, 'Done Deal → HoP approves', 'DCFCE7', '14532D');
  s.addText('A new merchant is created in the Master Ledger with an automatic code (e.g. FACT-005), and all stakeholders are notified of the system update.', { x: 0.85, y: 2.45, w: 3.7, h: 1.6, fontFace: FONT, fontSize: 13, color: SOFT, valign: 'top' });
  chip(s, 4.8, 1.7, 3.7, 'No activity → Good to Go', 'FFEDD5', '7C2D12');
  s.addText('Stagnant entries move to the Good to Go list and become available group-wide; any RM may request to re-engage.', { x: 4.8, y: 2.45, w: 3.7, h: 1.6, fontFace: FONT, fontSize: 13, color: SOFT, valign: 'top' });
  chip(s, 8.75, 1.7, 3.7, 'Closed — Lost', 'FEE2E2', '7F1D1D');
  s.addText('If the negotiation ends without a deal (or an extension is rejected), the entry is closed as Lost.', { x: 8.75, y: 2.45, w: 3.7, h: 1.6, fontFace: FONT, fontSize: 13, color: SOFT, valign: 'top' });
  s.addShape(p.ShapeType.roundRect, { x: 0.85, y: 4.5, w: 11.6, h: 1.7, rectRadius: 0.06, fill: { color: 'EFF4FF' }, line: { color: PRIMARY, width: 1 } });
  s.addText([
    { text: 'Converted merchants appear in the Master Ledger for the whole group.\n', options: { bold: true, color: '1E3A8A', fontSize: 15 } },
    { text: 'Everyone searches the ledger before approaching a prospect — avoiding duplicate outreach — and can raise an alignment request to the owning RM of another company.', options: { color: SOFT, fontSize: 13 } },
  ], { x: 1.1, y: 4.6, w: 11.1, h: 1.5, fontFace: FONT, valign: 'middle' });
})();

// 7 — Validations & safeguards
(() => {
  const s = p.addSlide(); header(s, 'Validations & safeguards (built in)', 7);
  bullets(s, [
    { t: 'Prospect source — directory lookup keeps names consistent; un-listed names are flagged for HoP.', b: true },
    { t: 'Required-field validation before an entry can be saved.', b: true },
    { t: 'Late-entry control — a past visit date forces closure date + minutes / call report.', b: true },
    { t: 'HoP validation gate on every new entry (approve / return).', b: true },
    { t: 'Approval gates on extensions, Done Deals, edits and deletions.', b: true },
    { t: 'Ownership — only the entrant can edit/delete (with HoP approval).', b: true },
    { t: 'Notifications — leadership broadcast on each prospect; admin email on every request.', b: true },
    { t: 'Audit trail — full comment / validation history on each entry; admin email log.', b: true },
  ], { x: 0.85, y: 1.6, w: 11.6, h: 5.2, fontSize: 15, gap: 12 });
})();

// 8 — Notifications & admin oversight
(() => {
  const s = p.addSlide(); header(s, 'Notifications & admin oversight', 8);
  img(s, 'fc-admin', 6.0, 1.7, 6.9, 4.2);
  bullets(s, [
    { t: 'Every new prospect notifies the full leadership distribution list (74 people).' },
    { t: 'The Administrator (doaa.orfy) gets an in-app alert + email log entry on every submitted request.' },
    { t: 'Managed lists (industries, products, Egypt source, recipients) are editable by Admin/HoP and update every dropdown instantly.' },
    { t: 'Real mailbox delivery switches on by adding SMTP settings on the server — no code change.', c: PURPLE },
  ], { x: 0.7, y: 1.8, w: 5.1, h: 4.6, fontSize: 14.5, gap: 14 });
})();

p.writeFile({ fileName: 'C:/Users/do.orfy/Desktop/Contact-Group-New-Entry-Journey-Presentation.pptx' })
  .then(f => console.log('wrote', f)).catch(e => { console.error('ERR', e); process.exit(1); });
