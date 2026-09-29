// Briefed stakeholder deck: the journey of a NEW PROSPECT + a tour of every
// portal feature. Self-contained — draws the flow with native shapes (no image
// dependencies), reflecting the current build (AML, duplicate-block, drafts,
// conditional HoP validation, per-cycle SLAs, re-engage, RM own-exposure).
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';           // 13.33 x 7.5 in
p.author = 'Contact Group';
p.title = 'Contact Group — New Prospect Journey & Feature Tour';

const FONT = 'Segoe UI';
const PRIMARY = '1E40AF', DARK = '15306E', INK = '1A2332', SOFT = '475569', MUTED = '94A3B8';
const GREEN = '15803D', ORANGE = 'C2410C', PURPLE = '6B21A8', RED = 'B91C1C', TEAL = '0F766E';
const BLUEBG = 'DBEAFE', GREENBG = 'DCFCE7', ORANGEBG = 'FFEDD5', YELLOWBG = 'FEF3C7', PURPLEBG = 'F3E8FF', REDBG = 'FEE2E2', GREYBG = 'F1F5F9';
let TOTAL = 15;

function footer(s, n) {
  s.addText('Contact Group · Client & Pipeline Platform — New Prospect Journey', { x: 0.5, y: 7.06, w: 9, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED });
  if (n) s.addText(n + '/' + TOTAL, { x: 12.2, y: 7.06, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: 'right' });
}
function header(s, t, n, sub) {
  s.background = { color: 'FFFFFF' };
  s.addShape(p.ShapeType.rect, { x: 0.5, y: 0.5, w: 0.22, h: 0.5, fill: { color: PRIMARY } });
  s.addText(t, { x: 0.84, y: 0.42, w: 12, h: 0.55, fontFace: FONT, fontSize: 23, bold: true, color: INK });
  if (sub) s.addText(sub, { x: 0.86, y: 0.97, w: 12, h: 0.3, fontFace: FONT, fontSize: 12.5, italic: true, color: PRIMARY });
  s.addShape(p.ShapeType.line, { x: 0.5, y: sub ? 1.32 : 1.14, w: 12.33, h: 0, line: { color: 'E2E8F0', width: 1 } });
  footer(s, n);
}
function bullets(s, items, o = {}) {
  s.addText(items.map(it => ({ text: (typeof it === 'string') ? it : it.t, options: { bullet: (it.nb ? false : { indent: 16 }), breakLine: true, color: (it.c || SOFT), bold: !!it.b, fontSize: it.fs || o.fontSize || 14, paraSpaceAfter: o.gap != null ? o.gap : 9, indentLevel: it.lvl || 0 } })),
    { x: o.x || 0.85, y: o.y || 1.5, w: o.w || 11.6, h: o.h || 5.2, fontFace: FONT, valign: 'top' });
}
function chip(s, x, y, w, h, label, fill, tc, fs) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.06, fill: { color: fill }, line: { width: 0 } });
  s.addText(label, { x: x + 0.08, y, w: w - 0.16, h, fontFace: FONT, fontSize: fs || 12, bold: true, color: tc, align: 'center', valign: 'middle' });
}
// vertical stage card with number badge, title, subtitle
function card(s, x, y, w, h, num, title, subtitle, fill, tc, accent) {
  s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: accent, width: 1.25 } });
  s.addShape(p.ShapeType.ellipse, { x: x + w / 2 - 0.22, y: y + 0.16, w: 0.44, h: 0.44, fill: { color: accent } });
  s.addText(String(num), { x: x + w / 2 - 0.22, y: y + 0.16, w: 0.44, h: 0.44, fontFace: FONT, fontSize: 15, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  s.addText(title, { x: x + 0.06, y: y + 0.66, w: w - 0.12, h: 0.5, fontFace: FONT, fontSize: 12.5, bold: true, color: tc, align: 'center', valign: 'middle' });
  s.addText(subtitle, { x: x + 0.08, y: y + 1.12, w: w - 0.16, h: h - 1.2, fontFace: FONT, fontSize: 9.5, color: SOFT, align: 'center', valign: 'top' });
}
function arrow(s, x, y) {
  s.addShape(p.ShapeType.rightArrow, { x, y, w: 0.16, h: 0.34, fill: { color: MUTED }, line: { width: 0 } });
}
function tbl(s, rows, opts) {
  s.addTable(rows, Object.assign({ x: 0.85, y: 1.6, w: 11.6, fontFace: FONT, fontSize: 11.5, color: SOFT, border: { type: 'solid', color: 'E2E8F0', pt: 0.5 }, align: 'left', valign: 'middle', autoPage: false }, opts));
}
function th(t) { return { text: t, options: { bold: true, color: 'FFFFFF', fill: PRIMARY, fontSize: 11.5 } }; }

/* ─────────────────────────── 1 · TITLE ─────────────────────────── */
(() => {
  const s = p.addSlide(); s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addShape(p.ShapeType.rect, { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addText('CONTACT GROUP', { x: 0.9, y: 1.85, w: 11, h: 0.5, fontFace: FONT, fontSize: 15, bold: true, color: '93C5FD', charSpacing: 3 });
  s.addText('Client & Pipeline Platform', { x: 0.85, y: 2.4, w: 11.6, h: 1.0, fontFace: FONT, fontSize: 42, bold: true, color: 'FFFFFF' });
  s.addText('The journey of a new prospect — and a tour of every feature', { x: 0.9, y: 3.55, w: 11.4, h: 0.6, fontFace: FONT, fontSize: 18, color: 'CBD5E1' });
  s.addShape(p.ShapeType.line, { x: 0.92, y: 4.35, w: 3.2, h: 0, line: { color: '3B82F6', width: 2 } });
  s.addText('A briefed walkthrough for the Executive Committee & business stakeholders', { x: 0.9, y: 6.45, w: 11, h: 0.4, fontFace: FONT, fontSize: 12, color: '93C5FD' });
})();

/* ─────────────────── 2 · WHAT THIS PORTAL IS ───────────────────── */
(() => {
  const s = p.addSlide(); header(s, 'What the portal is', 2, 'One shared, disciplined way to capture and grow every client opportunity across the whole group.');
  bullets(s, [
    { t: 'A single group-wide pipeline — every RM records prospects in one place, so the group never chases the same client twice.', b: false },
    { t: 'Company names come from a verified Egyptian directory, not free typing — clean, consistent data from the first click.' },
    { t: 'Built-in controls run automatically: AML screening, no-duplication, and Head-of-Products validation where it matters.' },
    { t: 'Leadership is informed at every step — no chasing status updates.' },
  ], { y: 1.55, w: 7.3, h: 3.2, fontSize: 14.5, gap: 12 });
  // group companies panel
  s.addShape(p.ShapeType.roundRect, { x: 8.35, y: 1.6, w: 4.45, h: 5.05, rectRadius: 0.08, fill: { color: GREYBG }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('The group, one platform', { x: 8.55, y: 1.75, w: 4.1, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  const cos = [['FACT', 'Contact Factoring'], ['LEASE', 'Contact Leasing'], ['MORT', 'Contact Mortgage'], ['CRED', 'Contact Credit'], ['INS', 'Contact Insurance'], ['MOTOR', 'Contact Auto'], ['NOW', 'Contact Now — consumer / BNPL']];
  let yy = 2.2;
  cos.forEach(([code, name]) => {
    s.addShape(p.ShapeType.roundRect, { x: 8.55, y: yy, w: 0.95, h: 0.4, rectRadius: 0.05, fill: { color: PRIMARY }, line: { width: 0 } });
    s.addText(code, { x: 8.55, y: yy, w: 0.95, h: 0.4, fontFace: FONT, fontSize: 10.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
    s.addText(name, { x: 9.62, y: yy, w: 3.05, h: 0.4, fontFace: FONT, fontSize: 11, color: INK, valign: 'middle' });
    yy += 0.61;
  });
})();

/* ─────────────── 3 · THE JOURNEY AT A GLANCE (HERO) ─────────────── */
(() => {
  const s = p.addSlide(); header(s, 'The new-prospect journey — at a glance', 3, 'From first contact to an onboarded merchant — six stages, with controls built in.');
  const y = 1.75, w = 1.83, h = 2.55, gap = 0.20;
  let x = 0.5;
  const stages = [
    ['Capture', 'RM logs the prospect. Company auto-set to their unit; name from the directory.', BLUEBG, '1E3A8A', PRIMARY],
    ['Screen', 'AML watchlist + no-duplication run automatically before it can be saved.', REDBG, RED, RED],
    ['Validate', 'Directory names go live instantly; typed names go to Head of Products.', YELLOWBG, '854D0E', ORANGE],
    ['Negotiate', 'Tracked through First Meeting → C1 → C2, each with an SLA.', BLUEBG, '1E3A8A', PRIMARY],
    ['Close', 'Done Deal: Head of Products approves the signed contract.', PURPLEBG, PURPLE, PURPLE],
    ['Merchant', 'Becomes a coded merchant in All Merchants — or is recycled to Good to Go.', GREENBG, '14532D', GREEN],
  ];
  stages.forEach(([t, sub, fill, tc, ac], i) => {
    card(s, x, y, w, h, i + 1, t, sub, fill, tc, ac);
    if (i < stages.length - 1) arrow(s, x + w + (gap - 0.16) / 2, y + h / 2 - 0.17);
    x += w + gap;
  });
  s.addShape(p.ShapeType.roundRect, { x: 0.5, y: 4.55, w: 12.1, h: 0.9, rectRadius: 0.06, fill: { color: GREYBG }, line: { width: 0 } });
  s.addText([
    { text: 'At every stage: ', options: { bold: true, color: INK } },
    { text: 'leadership (CEO, MD, C-level, Branch) is notified automatically, a full comment history is kept, and nothing moves forward without the right approval.', options: { color: SOFT } },
  ], { x: 0.75, y: 4.6, w: 11.6, h: 0.8, fontFace: FONT, fontSize: 13, valign: 'middle' });
  s.addText('Unfinished entries are never lost — they are saved to a Drafts area to resume later.', { x: 0.75, y: 5.65, w: 11.8, h: 0.4, fontFace: FONT, fontSize: 12.5, italic: true, color: MUTED });
})();

/* ─────────────────────── 4 · STAGE 1 · CAPTURE ─────────────────── */
(() => {
  const s = p.addSlide(); header(s, 'Stage 1 · Capturing a prospect', 4);
  bullets(s, [
    { t: 'Company is set automatically to the RM’s own unit — a Factoring RM creates FACT entries, and the reference code follows (e.g. FACT-P002).', b: false },
    { t: 'Prospect name is picked from a verified Egyptian directory — the legal name and Commercial Register fill in for you.' },
    { t: 'Not in the directory? Choose “Not included” and type it — that name is flagged for the Head of Products to validate.' },
    { t: 'Add the sector, products of interest, contact person and title, mobile and email, expected value, dates and attendees.' },
    { t: 'Save as draft any time — resume later from the Drafts button on the Pipeline page.', c: PRIMARY },
  ], { x: 0.7, y: 1.5, w: 6.7, h: 5.2, fontSize: 13.5, gap: 13 });
  // mini form mock
  const fx = 7.7, fw = 5.1;
  s.addShape(p.ShapeType.roundRect, { x: fx, y: 1.55, w: fw, h: 5.05, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1 } });
  s.addText('New Pipeline Entry', { x: fx + 0.25, y: 1.72, w: fw - 0.5, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: INK });
  const fields = [
    ['Prospect name', '✓ from directory', GREENBG, GREEN],
    ['Group company', 'FACT · auto-locked', BLUEBG, PRIMARY],
    ['Reference', 'FACT-P002', GREYBG, SOFT],
    ['Industry / sector', 'select…', GREYBG, MUTED],
    ['Contact person + title', 'name · CFO', GREYBG, MUTED],
    ['Products of interest', 'multi-select', GREYBG, MUTED],
    ['Expected value / dates', 'EGP …', GREYBG, MUTED],
  ];
  let fy = 2.2;
  fields.forEach(([lab, val, bg, vc]) => {
    s.addText(lab, { x: fx + 0.25, y: fy, w: 2.3, h: 0.34, fontFace: FONT, fontSize: 10.5, color: SOFT, valign: 'middle' });
    s.addShape(p.ShapeType.roundRect, { x: fx + 2.55, y: fy + 0.02, w: 2.3, h: 0.3, rectRadius: 0.04, fill: { color: bg }, line: { width: 0 } });
    s.addText(val, { x: fx + 2.6, y: fy + 0.02, w: 2.2, h: 0.3, fontFace: FONT, fontSize: 9.5, bold: true, color: vc, valign: 'middle' });
    fy += 0.42;
  });
  chip(s, fx + 0.25, 5.95, 2.3, 0.45, 'Save as draft', GREYBG, SOFT, 11);
  chip(s, fx + 2.6, 5.95, 2.25, 0.45, 'Save & notify', PRIMARY, 'FFFFFF', 11);
})();

/* ───────────── 5 · STAGE 2 · AUTOMATIC GATES (AML + DUP) ────────── */
(() => {
  const s = p.addSlide(); header(s, 'Stage 2 · Two automatic gates before it can be saved', 5, 'Compliance and data-quality are enforced by the system, not left to memory.');
  // AML card
  s.addShape(p.ShapeType.roundRect, { x: 0.55, y: 1.6, w: 6.0, h: 5.0, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: RED, width: 1.25 } });
  s.addText('①  AML watchlist screening', { x: 0.8, y: 1.78, w: 5.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: RED });
  bullets(s, [
    { t: 'The prospect name is screened against the compliance watchlist the moment it is entered.', b: false },
    { t: 'A potential match is shown immediately and the entry is blocked from being saved.' },
    { t: 'The name must be cleared by compliance before it can proceed.' },
    { t: 'A clean name shows a green “no match” confirmation.', c: GREEN },
  ], { x: 0.8, y: 2.35, w: 5.5, h: 3.0, fontSize: 12.5, gap: 11 });
  chip(s, 0.8, 5.55, 5.5, 0.7, '⚠  “Sanctioned Holdings” — watchlist match. Cleared by compliance required.', REDBG, RED, 11);
  // Dup card
  s.addShape(p.ShapeType.roundRect, { x: 6.8, y: 1.6, w: 6.0, h: 5.0, rectRadius: 0.08, fill: { color: 'FFFFFF' }, line: { color: PRIMARY, width: 1.25 } });
  s.addText('②  No-duplication check', { x: 7.05, y: 1.78, w: 5.5, h: 0.4, fontFace: FONT, fontSize: 15, bold: true, color: PRIMARY });
  bullets(s, [
    { t: 'The name is checked live against All Merchants, the Pipeline, and the Good-to-Go list — all three at once.', b: false },
    { t: 'If it already exists, the entry cannot continue.' },
    { t: 'The RM is told exactly where it lives and taken straight to that record with one click.' },
    { t: 'Result: the group never opens the same client twice.', c: GREEN },
  ], { x: 7.05, y: 2.35, w: 5.5, h: 3.0, fontSize: 12.5, gap: 11 });
  chip(s, 7.05, 5.45, 5.5, 0.8, '“Oasis Retail” already in All Merchants (FACT-003) →  Go to record', BLUEBG, '1E3A8A', 11);
})();

/* ───────────── 6 · STAGE 3 · SAVE OUTCOME (CONDITIONAL HoP) ─────── */
(() => {
  const s = p.addSlide(); header(s, 'Stage 3 · What happens on save', 6, 'Validation is applied only where it adds value — trusted sources go live instantly.');
  const y = 1.75, w = 3.75, h = 2.05;
  // three routes
  const routes = [
    ['Picked from directory', 'Goes live immediately as First Meeting — no Head-of-Products step.', GREENBG, GREEN, '→ Active now'],
    ['“Not included” (typed)', 'Routed to the Head of Products as Pending Validation before it progresses.', YELLOWBG, '854D0E', '→ Pending HoP'],
    ['Late entry (past visit)', 'Requires minutes or a call report, then Head-of-Products approval.', ORANGEBG, ORANGE, '→ Pending HoP · Late'],
  ];
  let x = 0.6;
  routes.forEach(([t, sub, bg, tc, tag]) => {
    s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: bg }, line: { color: tc, width: 1 } });
    s.addText(t, { x: x + 0.15, y: y + 0.14, w: w - 0.3, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: tc });
    s.addText(sub, { x: x + 0.15, y: y + 0.6, w: w - 0.3, h: 1.0, fontFace: FONT, fontSize: 11, color: SOFT });
    s.addText(tag, { x: x + 0.15, y: y + h - 0.42, w: w - 0.3, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: tc });
    x += w + 0.2;
  });
  s.addText('Head-of-Products validation workflow', { x: 0.6, y: 4.15, w: 11, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: PRIMARY });
  bullets(s, [
    { t: 'Approve — the entry activates and leadership is notified; or Return — sent back with a clear reason (e.g. “please choose the prospect name from the directory”) for the RM to fix and resubmit.', b: false },
    { t: 'When the Head of Products enters an opportunity themselves, it is auto-validated — no double-checking their own work.' },
    { t: 'Edits and deletions to an entry also require Head-of-Products approval — a complete, transparent audit trail.' },
  ], { x: 0.6, y: 4.55, w: 12.1, h: 2.0, fontSize: 12.5, gap: 10 });
})();

/* ───────────── 7 · STAGE 4 · LEADERSHIP + I'M INTERESTED ────────── */
(() => {
  const s = p.addSlide(); header(s, 'Stage 4 · Leadership visibility & engagement', 7);
  bullets(s, [
    { t: 'The instant an entry is saved, the full leadership distribution list is notified — CEO, MD, C-level and Branch managers.', b: false },
    { t: 'Any of them can press “I’m interested” on an opportunity to flag it as a potential client — a message is optional.', c: PRIMARY },
    { t: 'That alerts the initiator, the responsible RM, the Head of Products and the other leaders — everyone is aligned before the visit.' },
    { t: 'A 2-working-day contact SLA then applies: the RM must reach out, or it escalates automatically to their manager.' },
    { t: 'When the RM records that they made contact, the interested leader is notified back — the loop is closed.' },
  ], { x: 0.7, y: 1.5, w: 7.1, h: 5.0, fontSize: 14, gap: 13 });
  // notify panel
  s.addShape(p.ShapeType.roundRect, { x: 8.1, y: 1.55, w: 4.7, h: 5.05, rectRadius: 0.08, fill: { color: GREYBG }, line: { color: 'E2E8F0', width: 1 } });
  s.addText('Notified on a new prospect', { x: 8.3, y: 1.7, w: 4.3, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  const who = [['Hala Mansour', 'CEO', GREENBG, GREEN], ['Managing Director', 'MD', GREENBG, GREEN], ['John Saad', 'C-Level', PURPLEBG, PURPLE], ['Adel Kamel', 'Branch Manager', BLUEBG, PRIMARY], ['Dina El Sayed', 'Head of Products', YELLOWBG, '854D0E'], ['Responsible RM', 'assigned owner', GREYBG, SOFT]];
  let wy = 2.15;
  who.forEach(([n, r, bg, c]) => {
    s.addShape(p.ShapeType.roundRect, { x: 8.3, y: wy, w: 4.3, h: 0.58, rectRadius: 0.05, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 } });
    s.addText(n, { x: 8.45, y: wy, w: 2.6, h: 0.58, fontFace: FONT, fontSize: 11.5, bold: true, color: INK, valign: 'middle' });
    chip(s, 10.9, wy + 0.12, 1.55, 0.34, r, bg, c, 9.5);
    wy += 0.68;
  });
})();

/* ───────────── 8 · STAGE 5 · NEGOTIATION STAGES + SLAs ──────────── */
(() => {
  const s = p.addSlide(); header(s, 'Stage 5 · Negotiation stages & service levels', 8, 'Egypt working week (Sun–Thu). Missing an SLA flags the entry for follow-up.');
  const rows = [
    [th('Cycle'), th('Stage'), th('SLA (working days)'), th('What must happen')],
    ['Cycle 1', 'First Meeting', '5', 'Log the outcome and advance to Negotiation.'],
    ['Cycle 2', 'Negotiation', '10', 'Progress the deal or update the entry.'],
    ['Cycle 3', 'Negotiation C1', '10', 'Second negotiation round before escalation.'],
    ['Cycle 4', 'Negotiation C2', '10', 'Final negotiation round before escalation.'],
    ['Extension', 'Extend Negotiation', '10', 'Head-of-Products approval, then 10 more days.'],
    ['Closing', 'Done Deal', '2', 'HoP validates the signed contract; approval creates the merchant.'],
  ];
  tbl(s, rows, { y: 1.6, colW: [1.5, 2.6, 2.2, 5.3], rowH: 0.5 });
  s.addText('Cross-cutting SLAs', { x: 0.85, y: 5.5, w: 11, h: 0.3, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  bullets(s, [
    { t: 'Interest follow-up — 2 working days for the RM to make contact, or it escalates to the manager.', b: false },
    { t: 'Stale-entry reminder — any entry idle 7+ working days is flagged to the Head of Products (weekly sweep).' },
  ], { x: 0.85, y: 5.85, w: 12, h: 1.1, fontSize: 12, gap: 8 });
})();

/* ───────────── 9 · STAGE 6 · DONE DEAL → MERCHANT ──────────────── */
(() => {
  const s = p.addSlide(); header(s, 'Stage 6 · Winning the deal → a coded merchant', 9);
  bullets(s, [
    { t: 'To close, the RM submits the Done Deal with the sold products and the signed contract attached.', b: false },
    { t: 'It waits as “Pending HoP — Done Deal” until the Head of Products validates it.' },
    { t: 'On approval, a new merchant is created in All Merchants with a unique code (e.g. FACT-004) and the entry leaves the active pipeline.' },
    { t: 'Leadership, the RM and the admin are all notified of the onboarding.' },
    { t: 'Governance: Legal confirms every signed agreement exists in the portal — if not, a ticket is required before proceeding.', c: PURPLE },
  ], { x: 0.7, y: 1.5, w: 7.2, h: 5.0, fontSize: 14, gap: 13 });
  // transition visual
  s.addShape(p.ShapeType.roundRect, { x: 8.2, y: 2.2, w: 4.6, h: 1.05, rectRadius: 0.08, fill: { color: YELLOWBG }, line: { color: '854D0E', width: 1 } });
  s.addText('Pending HoP — Done Deal', { x: 8.2, y: 2.35, w: 4.6, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: '854D0E', align: 'center' });
  s.addText('signed contract attached', { x: 8.2, y: 2.75, w: 4.6, h: 0.35, fontFace: FONT, fontSize: 10.5, color: SOFT, align: 'center' });
  s.addShape(p.ShapeType.downArrow, { x: 10.35, y: 3.35, w: 0.3, h: 0.5, fill: { color: GREEN }, line: { width: 0 } });
  s.addText('Head of Products approves', { x: 8.2, y: 3.4, w: 4.6, h: 0.4, fontFace: FONT, fontSize: 10, italic: true, color: GREEN, align: 'center' });
  s.addShape(p.ShapeType.roundRect, { x: 8.2, y: 3.95, w: 4.6, h: 1.15, rectRadius: 0.08, fill: { color: GREENBG }, line: { color: GREEN, width: 1.25 } });
  s.addText('Merchant in All Merchants', { x: 8.2, y: 4.1, w: 4.6, h: 0.4, fontFace: FONT, fontSize: 13, bold: true, color: '14532D', align: 'center' });
  s.addText('code FACT-004 · exposure tracked', { x: 8.2, y: 4.5, w: 4.6, h: 0.35, fontFace: FONT, fontSize: 10.5, color: SOFT, align: 'center' });
  s.addText('leaves the active pipeline', { x: 8.2, y: 4.8, w: 4.6, h: 0.3, fontFace: FONT, fontSize: 10, italic: true, color: MUTED, align: 'center' });
})();

/* ───────────── 10 · STAGNANT → GOOD TO GO → RE-ENGAGE ──────────── */
(() => {
  const s = p.addSlide(); header(s, 'No lead is lost · Stagnant → Good to Go → Re-engage', 10);
  const y = 1.8, w = 3.7, h = 1.7;
  const steps = [
    ['Stagnant', 'A merchant with no activity for 6 months is flagged. The RM has 30 days to reactivate.', ORANGEBG, ORANGE],
    ['Good to Go', 'If not reactivated, it is released group-wide — any RM can re-engage it.', BLUEBG, PRIMARY],
    ['Re-engage', 'A fresh opportunity is opened, with the prospect’s full history alongside it.', GREENBG, GREEN],
  ];
  let x = 0.7;
  steps.forEach(([t, sub, bg, tc], i) => {
    s.addShape(p.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: bg }, line: { color: tc, width: 1 } });
    s.addText(t, { x: x + 0.15, y: y + 0.14, w: w - 0.3, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: tc });
    s.addText(sub, { x: x + 0.15, y: y + 0.6, w: w - 0.3, h: 1.0, fontFace: FONT, fontSize: 11, color: SOFT });
    if (i < 2) arrow(s, x + w + 0.02, y + h / 2 - 0.17);
    x += w + 0.2;
  });
  s.addText('What the RM sees on re-engagement', { x: 0.7, y: 3.9, w: 11, h: 0.35, fontFace: FONT, fontSize: 14, bold: true, color: PRIMARY });
  bullets(s, [
    { t: 'A history panel — the previous reference, owner, industry, last value, products and prior activity log.', b: false },
    { t: 'A fresh new-prospect form beside it — same as a new entry, but the company name is fixed so it can’t be changed.' },
    { t: 'The new opportunity is coded under the re-engaging RM’s own unit, and screened by AML and no-duplication like any entry.' },
  ], { x: 0.7, y: 4.3, w: 12.1, h: 2.2, fontSize: 12.5, gap: 10 });
})();

/* ───────────── 11 · FEATURE TOUR (THE PAGES) ───────────────────── */
(() => {
  const s = p.addSlide(); header(s, 'Feature tour · every page in the portal', 11);
  const items = [
    ['Dashboard', 'Role-aware home. RMs see only their own book & exposure; leadership sees the whole group.', PRIMARY],
    ['Pipeline', 'All active opportunities with filter, sort & search. RMs see only what they entered.', PRIMARY],
    ['All Merchants', 'The master client ledger — filter, sort, cross-company alignment before approaching.', GREEN],
    ['Good to Go', 'Released merchants & idle entries, available group-wide to re-engage.', ORANGE],
    ['Companies', 'The seven group units, their focus and their live merchant counts.', PRIMARY],
    ['Product Catalogue', 'Every product across the group — shown after a save to prompt cross-sell.', TEAL],
    ['Admin & Lists', 'Manage industries, products, directory, recipients, codes & the SLA reference.', PURPLE],
    ['Inbox', 'Every notification, per user — new prospects, approvals, interest, escalations.', PRIMARY],
    ['Interests', 'Leaders’ “I’m interested” flags with the 2-day contact SLA & escalation status.', RED],
  ];
  const cw = 4.0, ch = 1.5, gx = 0.18, gy = 0.16;
  let i = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 0.6 + c * (cw + gx), y = 1.55 + r * (ch + gy);
      const [t, d, ac] = items[i++];
      s.addShape(p.ShapeType.roundRect, { x, y, w: cw, h: ch, rectRadius: 0.06, fill: { color: 'FFFFFF' }, line: { color: 'E2E8F0', width: 1 } });
      s.addShape(p.ShapeType.rect, { x, y, w: 0.09, h: ch, fill: { color: ac }, line: { width: 0 } });
      s.addText(t, { x: x + 0.22, y: y + 0.12, w: cw - 0.35, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: INK });
      s.addText(d, { x: x + 0.22, y: y + 0.5, w: cw - 0.38, h: 0.9, fontFace: FONT, fontSize: 10.5, color: SOFT });
    }
  }
})();

/* ───────────── 12 · CONTROLS & GOVERNANCE ──────────────────────── */
(() => {
  const s = p.addSlide(); header(s, 'Controls & governance built in', 12);
  const items = [
    ['AML screening', 'Every prospect name checked against the compliance watchlist — matches are blocked.', RED, REDBG],
    ['No-duplication', 'One name can exist once across Merchants, Pipeline & Good to Go.', PRIMARY, BLUEBG],
    ['HoP validation', 'Typed names, extensions, closings, edits & deletes all require sign-off.', ORANGE, ORANGEBG],
    ['Audit trail', 'Full comment & decision history retained on every opportunity.', PURPLE, PURPLEBG],
    ['Legal gate', 'Signed agreements must exist in the portal, else a ticket is required.', TEAL, GREENBG],
    ['Backlog capture', 'Seeded from Finance (coded merchants) and Legal (signed agreements).', SOFT, GREYBG],
  ];
  const cw = 3.95, ch = 1.55, gx = 0.2, gy = 0.2;
  let i = 0;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 0.6 + c * (cw + gx), y = 1.7 + r * (ch + gy);
      const [t, d, ac, bg] = items[i++];
      s.addShape(p.ShapeType.roundRect, { x, y, w: cw, h: ch, rectRadius: 0.07, fill: { color: bg }, line: { color: ac, width: 1 } });
      s.addText(t, { x: x + 0.18, y: y + 0.14, w: cw - 0.35, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: ac });
      s.addText(d, { x: x + 0.18, y: y + 0.6, w: cw - 0.35, h: 0.85, fontFace: FONT, fontSize: 11, color: SOFT });
    }
  }
  s.addText('The result: consistent data, enforced compliance, and clear accountability across the whole group.', { x: 0.6, y: 5.5, w: 12.1, h: 0.5, fontFace: FONT, fontSize: 13.5, italic: true, bold: true, color: PRIMARY, align: 'center' });
})();

/* ───────────── 13 · ROLES & ACCESS ─────────────────────────────── */
(() => {
  const s = p.addSlide(); header(s, 'Roles & access', 13);
  const rows = [
    [th('Role'), th('Sees'), th('Can do')],
    ['RM / Employee', 'Only their own prospects & book', 'Create entries (own unit auto-set), progress, submit Done Deals, re-engage.'],
    ['Head of Products', 'The whole group pipeline', 'Validate, approve extensions/closings, approve edits & deletes.'],
    ['CEO / MD', 'Everything, group-wide', 'Flag “I’m interested”, monitor exposure & activity.'],
    ['C-Level / Branch', 'Group-wide visibility', 'Receive new-prospect alerts, flag “I’m interested”.'],
    ['Admin', 'Everything + lists', 'Manage reference lists, recipients, accounts & the SLA table.'],
  ];
  tbl(s, rows, { y: 1.6, colW: [2.6, 3.6, 5.4], rowH: 0.62 });
  s.addText([
    { text: '85 user accounts seeded · ', options: { bold: true, color: INK } },
    { text: 'every employee can log in and insert prospects. Username = the part of the work email before “@”. Codes: FACT · LEASE · MORT · CRED · INS · MOTOR · NOW.', options: { color: SOFT } },
  ], { x: 0.85, y: 5.85, w: 11.8, h: 0.8, fontFace: FONT, fontSize: 12.5, valign: 'top' });
})();

/* ───────────── 14 · HOW TO ACCESS ──────────────────────────────── */
(() => {
  const s = p.addSlide(); header(s, 'How to access it', 14);
  s.addShape(p.ShapeType.roundRect, { x: 0.6, y: 1.6, w: 12.1, h: 1.5, rectRadius: 0.08, fill: { color: BLUEBG }, line: { width: 0 } });
  s.addText('On the office network', { x: 0.85, y: 1.72, w: 11, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: '1E3A8A' });
  s.addText([
    { text: 'http://192.168.21.96:3000', options: { bold: true, color: PRIMARY, fontSize: 17 } },
    { text: '   (backup: http://192.168.0.233:3000)', options: { color: SOFT, fontSize: 13 } },
  ], { x: 0.85, y: 2.12, w: 11.6, h: 0.5, fontFace: FONT, valign: 'middle' });
  s.addText('No tunnel, no sign-in, no IT ticket — colleagues on the company network open it directly.', { x: 0.85, y: 2.6, w: 11.6, h: 0.35, fontFace: FONT, fontSize: 11.5, italic: true, color: SOFT });
  s.addText('Sign-in (all demo accounts use password Contact@123)', { x: 0.6, y: 3.35, w: 11, h: 0.35, fontFace: FONT, fontSize: 13, bold: true, color: PRIMARY });
  const rows = [
    [th('Role'), th('Username'), th('Role'), th('Username')],
    ['Admin', 'doaa.orfy', 'RM (Factoring)', 'y.fahmy'],
    ['Head of Products', 'd.elsayed', 'C-Level employee', 'john.saad'],
    ['CEO', 'h.mansour', 'Branch employee', 'adel.kamel'],
  ];
  tbl(s, rows, { y: 3.75, colW: [2.9, 3.0, 2.9, 2.8], rowH: 0.5 });
  s.addText('For colleagues working from home, the permanent contact.eg address is set up by IT (one-time).', { x: 0.6, y: 6.1, w: 12, h: 0.4, fontFace: FONT, fontSize: 11.5, italic: true, color: MUTED });
})();

/* ───────────── 15 · CLOSING ────────────────────────────────────── */
(() => {
  const s = p.addSlide(); s.background = { color: DARK };
  s.addShape(p.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addShape(p.ShapeType.rect, { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: PRIMARY } });
  s.addText('One pipeline. One discipline. The whole group.', { x: 0.9, y: 2.7, w: 11.5, h: 0.9, fontFace: FONT, fontSize: 32, bold: true, color: 'FFFFFF' });
  s.addText('Every prospect captured cleanly, screened automatically, validated where it matters, and visible to leadership from first contact to onboarded merchant.', { x: 0.9, y: 3.75, w: 11.2, h: 1.0, fontFace: FONT, fontSize: 15, color: 'CBD5E1' });
  s.addText('Contact Group · Client & Pipeline Platform', { x: 0.9, y: 6.4, w: 11, h: 0.4, fontFace: FONT, fontSize: 12, color: '93C5FD' });
})();

/* ─────────────────────────── WRITE ─────────────────────────────── */
const OUT_NAME = 'Contact-Group-New-Prospect-Journey.pptx';
const outDocs = path.join(__dirname, 'public', 'docs', OUT_NAME);
p.writeFile({ fileName: outDocs }).then(() => {
  console.log('WROTE ' + outDocs);
  // Also try to drop a copy on the Desktop (ignore if locked/open).
  try {
    fs.copyFileSync(outDocs, path.join('C:', 'Users', 'do.orfy', 'Desktop', OUT_NAME));
    console.log('COPIED to Desktop');
  } catch (e) { console.log('Desktop copy skipped: ' + e.message); }
}).catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
