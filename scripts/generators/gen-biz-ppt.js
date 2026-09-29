// Business stakeholder presentation (non-technical) + IT action plan + business action plan.
const pptxgen = require('pptxgenjs');
const path = require('path');
const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';
p.author = 'Contact Group';

const IMG = path.join(__dirname, 'docimg');
const FONT = 'Segoe UI';
const PRIMARY = '1E40AF', DARK = '15306E', INK = '1A2332', SOFT = '475569', MUTED = '94A3B8', GREEN = '15803D', ORANGE = 'C2410C', PURPLE = '6B21A8';
const BLUEBG = 'DBEAFE', GREENBG = 'DCFCE7', ORANGEBG = 'FFEDD5', YELLOWBG = 'FEF3C7';
const dims = { 'fc-newentry':[960,1530], 'fc-entry':[1520,940], 'fc-validation':[1520,860], 'fc-lifecycle':[1520,840], 'fc-admin':[1520,600] };
const TOTAL = 14;

function footer(s, n) {
  s.addText('Contact Group · Client & Pipeline Platform — Stakeholder Briefing', { x: 0.5, y: 7.06, w: 9, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED });
  s.addText(n + '/' + TOTAL, { x: 12.2, y: 7.06, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: 'right' });
}
function header(s, t, n) {
  s.background = { color: 'FFFFFF' };
  s.addShape(p.ShapeType.rect, { x: 0.5, y: 0.5, w: 0.22, h: 0.5, fill: { color: PRIMARY } });
  s.addText(t, { x: 0.84, y: 0.44, w: 12, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: INK });
  s.addShape(p.ShapeType.line, { x: 0.5, y: 1.16, w: 12.33, h: 0, line: { color: 'E2E8F0', width: 1 } });
  footer(s, n);
}
function bullets(s, items, o = {}) {
  s.addText(items.map(it => ({ text: (typeof it === 'string') ? it : it.t, options: { bullet: { indent: 16 }, breakLine: true, color: (it.c || SOFT), bold: !!it.b, fontSize: o.fontSize || 14, paraSpaceAfter: o.gap != null ? o.gap : 9 } })),
    { x: o.x || 0.85, y: o.y || 1.45, w: o.w || 6.0, h: o.h || 5.4, fontFace: FONT, valign: 'top' });
}
function img(s, name, bx, by, bw, bh) {
  const [w, h] = dims[name]; const r = w / h; let iw = bw, ih = bw / r; if (ih > bh) { ih = bh; iw = bh * r; }
  s.addImage({ path: path.join(IMG, name + '.png'), x: bx + (bw - iw) / 2, y: by + (bh - ih) / 2, w: iw, h: ih });
}
function chip(s, x, y, w, label, fill, tc) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h: 0.58, rectRadius: 0.08, fill: { color: fill }, line: { width: 0 } });
  s.addText(label, { x: x + 0.1, y, w: w - 0.2, h: 0.58, fontFace: FONT, fontSize: 12, bold: true, color: tc, align: 'center', valign: 'middle' });
}
function tbl(s, rows, opts) {
  s.addTable(rows, Object.assign({ x: 0.85, y: 1.55, w: 11.6, fontFace: FONT, fontSize: 12, color: SOFT, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, align: 'left', valign: 'middle', autoPage: false }, opts));
}
function th(t) { return { text: t, options: { bold: true, color: PRIMARY, fill: BLUEBG, fontSize: 12 } }; }

// 1 — Title
(() => {
  const s = p.addSlide(); s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addShape(p.ShapeType.rect, { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addText('CONTACT GROUP', { x: 0.9, y: 1.9, w: 11, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: '93C5FD', charSpacing: 3 });
  s.addText('Client & Pipeline Platform', { x: 0.85, y: 2.45, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 44, bold: true, color: 'FFFFFF' });
  s.addText('Stakeholder Briefing — how it works, the value it creates, and the plan to go live', { x: 0.9, y: 3.6, w: 11.2, h: 0.7, fontFace: FONT, fontSize: 17, color: 'CBD5E1' });
  s.addText('Prepared for the Executive Committee & business stakeholders · June 2026', { x: 0.9, y: 6.5, w: 11, h: 0.4, fontFace: FONT, fontSize: 12, color: '93C5FD' });
})();

// 2 — Objective / why
(() => {
  const s = p.addSlide(); header(s, 'Why we built this', 2);
  s.addText('One shared, disciplined way to capture and grow every client opportunity across the whole group.', { x: 0.85, y: 1.35, w: 11.6, h: 0.6, fontFace: FONT, fontSize: 17, italic: true, color: PRIMARY });
  bullets(s, [
    { t: 'One group-wide view of prospects — teams check before approaching, so we stop chasing the same client twice.', b: false },
    { t: 'Faster, cleaner capture — company names and details come from a verified directory, not free typing.' },
    { t: 'Clear governance — the Head of Products reviews every new opportunity; approvals are required to extend or close.' },
    { t: 'Cross-sell across the group — Factoring, Leasing, Mortgage, Credit, Insurance and Contact Auto in one place.' },
    { t: 'Full visibility for leadership — the right people are informed automatically at every step.' },
  ], { x: 0.85, y: 2.25, w: 11.6, h: 4.4, fontSize: 16, gap: 13 });
})();

// 3 — Journey at a glance
(() => {
  const s = p.addSlide(); header(s, 'The client journey — at a glance', 3);
  img(s, 'fc-newentry', 0.3, 1.3, 5.0, 5.7);
  s.addText('From first contact to a new client — five simple stages:', { x: 5.9, y: 1.5, w: 6.9, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  chip(s, 5.9, 2.05, 6.8, '1 · Capture — the team logs a new prospect', BLUEBG, '1E3A8A');
  chip(s, 5.9, 2.8, 6.8, '2 · Inform — leadership is alerted instantly', PURPLE === '6B21A8' ? 'F3E8FF' : 'F3E8FF', PURPLE);
  chip(s, 5.9, 3.55, 6.8, '3 · Validate — Head of Products signs it off', YELLOWBG, '854D0E');
  chip(s, 5.9, 4.3, 6.8, '4 · Negotiate — tracked through to a decision', BLUEBG, '1E3A8A');
  chip(s, 5.9, 5.05, 6.8, '5 · Outcome — becomes a client, or is recycled', GREENBG, '14532D');
  s.addText('Every stage keeps the leadership team informed, and nothing moves forward without the right approval.', { x: 5.9, y: 5.95, w: 6.8, h: 0.8, fontFace: FONT, fontSize: 13, italic: true, color: MUTED });
})();

// 4 — Capture
(() => {
  const s = p.addSlide(); header(s, 'Stage 1 — Capturing a prospect', 4);
  img(s, 'fc-entry', 5.95, 1.5, 6.9, 5.2);
  bullets(s, [
    { t: 'The team picks the company from a verified Egyptian directory — the name and Commercial Register are filled in automatically.', b: false },
    { t: 'If a company isn’t listed, they flag it and type it in — and the Head of Products checks it.' },
    { t: 'They add the sector, the products of interest, and the client contact (name, mobile, email).' },
    { t: 'The moment it’s saved, the entire leadership distribution list is notified — no chasing updates.' },
    { t: 'Each opportunity gets its own reference code (e.g. FACT-P002) for easy tracking.', c: PRIMARY },
  ], { x: 0.7, y: 1.55, w: 5.1, h: 5.3, fontSize: 14, gap: 13 });
})();

// 5 — Validate
(() => {
  const s = p.addSlide(); header(s, 'Stage 2 — Validation & governance', 5);
  img(s, 'fc-validation', 5.95, 1.6, 6.9, 4.8);
  bullets(s, [
    { t: 'The Head of Products reviews every new opportunity before it progresses — a single, consistent quality gate.', b: false },
    { t: 'They can approve it, or send it back with a clear reason for the team to fix and resubmit.' },
    { t: 'When the Head of Products enters an opportunity themselves, it is approved automatically — no double-checking their own work.' },
    { t: 'A full history of comments and decisions is kept on every opportunity — complete transparency.' },
  ], { x: 0.7, y: 1.65, w: 5.1, h: 5.0, fontSize: 14.5, gap: 14 });
})();

// 6 — Negotiate & close
(() => {
  const s = p.addSlide(); header(s, 'Stage 3 — Negotiation to outcome', 6);
  img(s, 'fc-lifecycle', 5.95, 1.6, 6.9, 4.9);
  bullets(s, [
    { t: 'The opportunity moves through clear stages toward a decision.', b: false },
    { t: 'Extending the timeline or closing a deal requires Head of Products sign-off — control at the key moments.' },
    { t: 'When a deal is won, the client is added to the master client list automatically, with a unique code.' },
    { t: 'Opportunities with no activity are moved to a “re-engage” list so no lead is quietly lost.' },
    { t: 'Leadership is notified at every step — including approvals and the final win.', c: PURPLE },
  ], { x: 0.7, y: 1.65, w: 5.1, h: 5.0, fontSize: 14, gap: 12 });
})();

// 7 — Key features (business value)
(() => {
  const s = p.addSlide(); header(s, 'What the platform gives the business', 7);
  s.addText('Left: capability', { x: 0.85, y: 1.35, w: 5.7, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  bullets(s, [
    'Verified company directory — clean, consistent data',
    'One master list of all group clients',
    'Reference codes on every opportunity',
    'Standard industry & product lists',
    'Role-based access for each team',
    'Automatic emails at every step',
    'Full audit trail of decisions',
  ], { x: 0.85, y: 1.75, w: 5.7, h: 5.0, fontSize: 14, gap: 11 });
  s.addShape(p.ShapeType.line, { x: 6.75, y: 1.4, w: 0, h: 4.9, line: { color: 'E2E8F0', width: 1 } });
  s.addText('Right: business benefit', { x: 7.0, y: 1.35, w: 5.7, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  bullets(s, [
    'No duplicate outreach to the same client',
    'A single source of truth across companies',
    'Easy tracking and reporting',
    'Consistent, comparable pipeline data',
    'Right people see the right information',
    'Leadership always up to date, no chasing',
    'Accountability and compliance built in',
  ], { x: 7.0, y: 1.75, w: 5.7, h: 5.0, fontSize: 14, gap: 11 });
})();

// 8 — Roles & transparency
(() => {
  const s = p.addSlide(); header(s, 'Who does what — and who sees what', 8);
  tbl(s, [
    [th('Role'), th('What they do')],
    [{ text: 'Relationship Managers & employees', options: { bold: true, color: INK } }, 'Log new prospects, manage their opportunities, move deals forward.'],
    [{ text: 'Head of Products', options: { bold: true, color: INK } }, 'Validates every new opportunity; approves extensions, deals, edits and deletions; maintains the standard lists.'],
    [{ text: 'CEO / MD', options: { bold: true, color: INK } }, 'See a group-wide view; can flag interest to join a client visit.'],
    [{ text: 'Administrator', options: { bold: true, color: INK } }, 'Maintains the lists and receives a record of every request made in the platform.'],
  ], { y: 1.55, w: 11.6, colW: [3.6, 8.0], rowH: 0.62 });
  s.addShape(p.ShapeType.roundRect, { x: 0.85, y: 5.0, w: 11.6, h: 1.3, rectRadius: 0.06, fill: { color: 'EFF4FF' }, line: { color: PRIMARY, width: 1 } });
  s.addText([
    { text: 'Everyone stays informed, automatically.  ', options: { bold: true, color: '1E3A8A', fontSize: 15 } },
    { text: 'The full leadership distribution list is notified when a prospect is created, at every status change, and when a deal is validated or won. The Administrator receives a record of every request.', options: { color: SOFT, fontSize: 13 } },
  ], { x: 1.1, y: 5.1, w: 11.1, h: 1.1, fontFace: FONT, valign: 'middle' });
})();

// 9 — Governance controls & initial data
(() => {
  const s = p.addSlide(); header(s, 'Governance controls & initial data', 9);
  // Legal control gate
  s.addShape(p.ShapeType.roundRect, { x: 0.85, y: 1.45, w: 5.7, h: 4.9, rectRadius: 0.06, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('⚖  Legal control gate', { x: 1.05, y: 1.6, w: 5.3, h: 0.45, fontFace: FONT, fontSize: 16, bold: true, color: PRIMARY });
  s.addText('Governance sits with the Legal department.', { x: 1.05, y: 2.1, w: 5.3, h: 0.4, fontFace: FONT, fontSize: 13.5, italic: true, color: SOFT });
  s.addText([
    { text: 'Before any agreement is signed, Legal checks that the deal and client are already recorded in the portal.\n\n', options: { fontSize: 13.5, color: SOFT } },
    { text: 'If they are not, Legal requires a ticket to be submitted before signing can proceed.\n\n', options: { fontSize: 13.5, color: SOFT, bold: true } },
    { text: 'Effect: every signed deal exists in the system — no off-portal exceptions, and full adoption is enforced at the point of signature.', options: { fontSize: 12.5, color: MUTED, italic: true } },
  ], { x: 1.05, y: 2.55, w: 5.3, h: 3.6, fontFace: FONT, valign: 'top' });
  // Initial data backlog
  s.addShape(p.ShapeType.roundRect, { x: 6.75, y: 1.45, w: 5.7, h: 4.9, rectRadius: 0.06, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('📚  Initial data backlog', { x: 6.95, y: 1.6, w: 5.3, h: 0.45, fontFace: FONT, fontSize: 16, bold: true, color: PRIMARY });
  s.addText('Populating the portal from day one.', { x: 6.95, y: 2.1, w: 5.3, h: 0.4, fontFace: FONT, fontSize: 13.5, italic: true, color: SOFT });
  s.addText([
    { text: 'The existing book is loaded from two authoritative sources:\n', options: { fontSize: 13.5, color: SOFT } },
  ], { x: 6.95, y: 2.55, w: 5.3, h: 0.6, fontFace: FONT, valign: 'top' });
  s.addText([
    { text: 'Finance — the coded merchant list.', options: { bullet: { indent: 14 }, breakLine: true, fontSize: 13.5, color: SOFT, paraSpaceAfter: 10 } },
    { text: 'Legal — the list of signed agreements and partnerships.', options: { bullet: { indent: 14 }, breakLine: true, fontSize: 13.5, color: SOFT, paraSpaceAfter: 10 } },
  ], { x: 7.05, y: 3.15, w: 5.2, h: 1.4, fontFace: FONT, valign: 'top' });
  s.addText('Result: a complete, verified starting book across the whole group — so the portal reflects reality on launch day.', { x: 6.95, y: 4.7, w: 5.35, h: 1.2, fontFace: FONT, fontSize: 12.5, italic: true, color: MUTED, valign: 'top' });
})();

// 10 — IT action plan & integrations
(() => {
  const s = p.addSlide(); header(s, 'IT action plan & integrations needed', 10);
  tbl(s, [
    [th('Integration'), th('What it delivers'), th('Owner'), th('Timing')],
    ['Company directory (Egypt)', 'Verified company names + Commercial Register auto-filled on entry', 'IT', 'Week 1'],
    ['Industry list (standard sectors)', 'Consistent industry categories across every opportunity', 'IT + Head of Products', 'Week 1'],
    ['Email notifications (Contact mail)', 'Automatic alerts to the leadership list + admin at every step', 'IT + Mail team', 'Week 1'],
    ['Secure hosting on a Contact server', 'One permanent, company-wide link (e.g. pipeline.contact.eg)', 'IT', 'Week 1–2'],
    ['Phase 2 — link to lending systems', 'No lending proceeds unless the client is on the portal (via Commercial Register)', 'IT + Integration team', 'Post-launch'],
  ], { y: 1.5, w: 11.6, colW: [3.1, 5.0, 2.2, 1.3], rowH: 0.6, fontSize: 11.5 });
  s.addText('Timeline: a working, shareable link can be ready within days; a hardened production setup is about one week (mostly waiting on server, certificate and mail approvals).', { x: 0.85, y: 5.75, w: 11.6, h: 0.7, fontFace: FONT, fontSize: 12.5, italic: true, color: MUTED });
})();

// 10 — Integration specifics (the names)
(() => {
  const s = p.addSlide(); header(s, 'Integrations — the specifics', 11);
  // Company directory
  s.addShape(p.ShapeType.roundRect, { x: 0.85, y: 1.4, w: 3.75, h: 4.9, rectRadius: 0.06, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('Company directory', { x: 1.0, y: 1.55, w: 3.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  s.addText([
    { text: 'Source: OpenCorporates — Egypt company data (opencorporates.com).\n\n', options: { fontSize: 12.5, color: SOFT } },
    { text: 'Provides verified company names and Commercial Register numbers as the team types.\n\n', options: { fontSize: 12.5, color: SOFT } },
    { text: 'Alternatives if preferred later: companiesdata.cloud · developer.willro.com.', options: { fontSize: 11.5, color: MUTED, italic: true } },
  ], { x: 1.0, y: 2.05, w: 3.45, h: 4.1, fontFace: FONT, valign: 'top' });
  // Industries
  s.addShape(p.ShapeType.roundRect, { x: 4.79, y: 1.4, w: 3.75, h: 4.9, rectRadius: 0.06, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('Industries (10 sectors)', { x: 4.94, y: 1.55, w: 3.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  s.addText(['ICT, Software & Digital', 'Tourism, Hospitality & Travel', 'Renewable Energy & Green', 'Manufacturing & Export-Led', 'Healthcare & MedTech', 'Construction, Real Estate & Infrastructure', 'Agribusiness & Food Processing', 'Food & beverage', 'FMCG', 'Automotive'].map(t => ({ text: t, options: { bullet: { indent: 12 }, breakLine: true, fontSize: 11.5, color: SOFT, paraSpaceAfter: 5 } })), { x: 4.98, y: 2.05, w: 3.45, h: 4.1, fontFace: FONT, valign: 'top' });
  // Emails
  s.addShape(p.ShapeType.roundRect, { x: 8.73, y: 1.4, w: 3.72, h: 4.9, rectRadius: 0.06, fill: { color: 'F8FAFC' }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('Email notifications', { x: 8.88, y: 1.55, w: 3.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  s.addText([
    { text: 'Sent through Contact’s email system.\n\n', options: { fontSize: 12.5, color: SOFT } },
    { text: 'Recipients: the leadership distribution list — MD, C-level and Branch Managers (about 74 people) — plus the Administrator (doaa.orfy@contact.eg).\n\n', options: { fontSize: 12.5, color: SOFT } },
    { text: 'Triggered on: new prospect, every status change, validation, extension, deal and approval.', options: { fontSize: 12, color: MUTED, italic: true } },
  ], { x: 8.88, y: 2.05, w: 3.42, h: 4.1, fontFace: FONT, valign: 'top' });
})();

// 11 — Business action plan (meetings)
(() => {
  const s = p.addSlide(); header(s, 'Business action plan — stakeholder alignment', 12);
  s.addText('Separate working sessions to review the platform and workflow, gather feedback, and build buy-in — before ExCo.', { x: 0.85, y: 1.35, w: 11.6, h: 0.5, fontFace: FONT, fontSize: 14.5, color: SOFT });
  tbl(s, [
    [th('#'), th('Stakeholder'), th('Purpose of the session')],
    ['1', 'Mohsen ElShaarani', 'Walk through the platform & workflow; capture feedback'],
    ['2', 'Moustafa Adel', 'Walk through the platform & workflow; capture feedback'],
    ['3', 'Ahmed Khalifa', 'Walk through the platform & workflow; capture feedback'],
    ['4', 'Khaled Riad', 'Walk through the platform & workflow; capture feedback'],
    ['5', 'Youssef Fahmy', 'Front-line (RM) review of usability & the entry journey'],
  ], { y: 2.0, w: 11.6, colW: [0.8, 4.0, 6.8], rowH: 0.55, fontSize: 12.5 });
  s.addShape(p.ShapeType.roundRect, { x: 0.85, y: 5.6, w: 11.6, h: 0.75, rectRadius: 0.06, fill: { color: YELLOWBG }, line: { color: ORANGE, width: 1 } });
  s.addText([{ text: 'Cadence: 2 meetings per week.  ', options: { bold: true, color: '7C2D12', fontSize: 14 } }, { text: 'The five sessions run over three weeks — see the timeline on the next slide.', options: { color: SOFT, fontSize: 13 } }], { x: 1.1, y: 5.6, w: 11.1, h: 0.75, fontFace: FONT, valign: 'middle' });
})();

// 12 — Timeline to ExCo (Gantt)
(() => {
  const s = p.addSlide(); header(s, 'Timeline — from alignment to ExCo approval', 13);
  const x0 = 1.6, y0 = 1.9, colW = 2.15, rowY = 2.7, barH = 0.6;
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  weeks.forEach((wk, i) => {
    s.addShape(p.ShapeType.rect, { x: x0 + i * colW, y: y0, w: colW - 0.08, h: 0.5, fill: { color: 'EEF2F7' }, line: { color: 'E2E8F0', width: 1 } });
    s.addText(wk, { x: x0 + i * colW, y: y0, w: colW - 0.08, h: 0.5, fontFace: FONT, fontSize: 13, bold: true, color: INK, align: 'center', valign: 'middle' });
  });
  // Bar 1: stakeholder meetings weeks 1-3
  s.addShape(p.ShapeType.roundRect, { x: x0, y: rowY, w: colW * 3 - 0.08, h: barH, rectRadius: 0.05, fill: { color: PRIMARY }, line: { width: 0 } });
  s.addText('Stakeholder meetings  ·  2 per week', { x: x0, y: rowY, w: colW * 3 - 0.08, h: barH, fontFace: FONT, fontSize: 12.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  // Bar 2: amendments week 4
  s.addShape(p.ShapeType.roundRect, { x: x0 + colW * 3, y: rowY + 0.8, w: colW - 0.08, h: barH, rectRadius: 0.05, fill: { color: ORANGE }, line: { width: 0 } });
  s.addText('Reflect amendments', { x: x0 + colW * 3, y: rowY + 0.8, w: colW - 0.08, h: barH, fontFace: FONT, fontSize: 11.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  // Bar 3: ExCo week 5
  s.addShape(p.ShapeType.roundRect, { x: x0 + colW * 4, y: rowY + 1.6, w: colW - 0.08, h: barH, rectRadius: 0.05, fill: { color: GREEN }, line: { width: 0 } });
  s.addText('Present to ExCo — apply', { x: x0 + colW * 4, y: rowY + 1.6, w: colW - 0.08, h: barH, fontFace: FONT, fontSize: 11, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  // Meeting allocation labels under weeks 1-3
  s.addText([
    { text: 'Wk 1: Mohsen ElShaarani · Moustafa Adel\n', options: { fontSize: 12, color: SOFT } },
    { text: 'Wk 2: Ahmed Khalifa · Khaled Riad\n', options: { fontSize: 12, color: SOFT } },
    { text: 'Wk 3: Youssef Fahmy\n', options: { fontSize: 12, color: SOFT } },
    { text: 'Wk 4: incorporate all feedback & amendments\n', options: { fontSize: 12, color: ORANGE } },
    { text: 'Wk 5: ExCo review & approval to apply', options: { fontSize: 12, color: GREEN, bold: true } },
  ], { x: 1.6, y: 5.4, w: 11, h: 1.4, fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.15 });
})();

// 13 — The ask
(() => {
  const s = p.addSlide(); header(s, 'Recommendation & the ask', 14);
  bullets(s, [
    { t: 'The platform is built and working — ready for stakeholder review on a shared link.', b: true },
    { t: 'Approve the IT action plan so the company directory, industry list and email notifications are connected and the platform is hosted on a Contact server.', b: true },
    { t: 'Approve the 5-week alignment plan: stakeholder sessions (2/week), a week to reflect amendments, then ExCo approval to apply.', b: true },
    { t: 'On ExCo approval, roll out group-wide and begin Phase 2 (link to lending systems).', b: true },
  ], { x: 0.85, y: 1.6, w: 11.6, h: 3.8, fontSize: 16, gap: 15 });
  s.addShape(p.ShapeType.roundRect, { x: 0.85, y: 5.5, w: 11.6, h: 0.95, rectRadius: 0.06, fill: { color: GREENBG }, line: { color: GREEN, width: 1 } });
  s.addText('Outcome: one disciplined, group-wide way to capture and grow every client opportunity — with full visibility, built-in governance, and no duplicated effort.', { x: 1.1, y: 5.5, w: 11.1, h: 0.95, fontFace: FONT, fontSize: 14, color: '14532D', valign: 'middle', bold: true });
})();

p.writeFile({ fileName: 'C:/Users/do.orfy/Desktop/Contact-Group-Stakeholder-Presentation.pptx' })
  .then(f => console.log('wrote', f)).catch(e => { console.error('ERR', e); process.exit(1); });
