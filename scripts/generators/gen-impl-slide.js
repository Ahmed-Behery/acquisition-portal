// One-slide internal implementation roadmap: C-level sign-off -> parallel
// UI/UX + coding -> external & internal integrations -> testing -> go-live,
// with a milestone timeline (weekly) starting 1 September 2026.
const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE';                 // 13.33 x 7.5 in
p.author = 'Contact Group';
p.title = 'Contact Group — Implementation Roadmap';

const FONT = 'Segoe UI';
const PRIMARY='1E40AF', DARK='15306E', INK='1A2332', SOFT='475569', MUTED='94A3B8';
const PURPLE='6B21A8', TEAL='0F766E', ORANGE='C2410C', ROSE='BE185D', GREEN='15803D';
const GREY='E2E8F0', GREYBG='F1F5F9';

const s = p.addSlide();
s.background = { color: 'FFFFFF' };

// ---- Header ----
s.addShape(p.ShapeType.rect, { x: 0.5, y: 0.42, w: 0.22, h: 0.5, fill: { color: PRIMARY } });
s.addText('Internal Implementation Roadmap', { x: 0.84, y: 0.38, w: 12, h: 0.5, fontFace: FONT, fontSize: 23, bold: true, color: INK });
s.addText('Executive sign-off → parallel UI/UX & build → external + internal integrations → testing → go-live · from 1 September 2026',
  { x: 0.86, y: 0.9, w: 12, h: 0.3, fontFace: FONT, fontSize: 12.5, italic: true, color: PRIMARY });
s.addShape(p.ShapeType.line, { x: 0.5, y: 1.26, w: 12.33, h: 0, line: { color: GREY, width: 1 } });

// ---- Journey ribbon (compact) ----
function ribbon(x, w, title, sub, fill, tc) {
  s.addShape(p.ShapeType.roundRect, { x, y: 1.45, w, h: 0.66, rectRadius: 0.07, fill: { color: fill }, line: { width: 0 } });
  s.addText(title, { x: x + 0.06, y: 1.5, w: w - 0.12, h: 0.3, fontFace: FONT, fontSize: 11.5, bold: true, color: tc, align: 'center' });
  s.addText(sub, { x: x + 0.06, y: 1.78, w: w - 0.12, h: 0.28, fontFace: FONT, fontSize: 8.5, color: tc, align: 'center' });
}
function rArrow(x) { s.addShape(p.ShapeType.rightArrow, { x, y: 1.66, w: 0.18, h: 0.26, fill: { color: MUTED }, line: { width: 0 } }); }
const segs = [
  ['1 · Confirm', 'All C-level sign-off', 'F3E8FF', PURPLE],
  ['2 · Build (parallel)', 'UI/UX design + Coding', 'DBEAFE', PRIMARY],
  ['3 · Integrate', 'External + Internal', 'FFEDD5', ORANGE],
  ['4 · Test', 'QA + UAT', 'DCFCE7', GREEN],
  ['5 · Go-live', 'Launch to all users', DARK, 'FFFFFF'],
];
(() => {
  const gap = 0.28, x0 = 0.5, total = 12.33;
  const w = (total - gap * (segs.length - 1)) / segs.length;
  let x = x0;
  segs.forEach((sg, i) => { ribbon(x, w, sg[0], sg[1], sg[2], sg[3]); if (i < segs.length - 1) rArrow(x + w + (gap - 0.18) / 2); x += w + gap; });
})();

// ---- Gantt timeline ----
const WEEKS = 12;                 // W1 (Sep 1) .. W12 (Nov 17-23); go-live Nov 24
const gx0 = 3.5, gx1 = 12.85, gW = gx1 - gx0, colW = gW / WEEKS;
const colX = i => gx0 + i * colW;

// Month bands: Sep = cols 0-3, Oct = cols 4-8, Nov = cols 9-11
const monthBandY = 2.42, monthH = 0.28;
[['September', 0, 4, 'DBEAFE', PRIMARY], ['October', 4, 5, 'FFEDD5', ORANGE], ['November', 9, 3, 'DCFCE7', GREEN]].forEach(([m, start, span, bg, tc]) => {
  s.addShape(p.ShapeType.rect, { x: colX(start), y: monthBandY, w: colW * span, h: monthH, fill: { color: bg }, line: { color: 'FFFFFF', width: 1 } });
  s.addText(m + ' 2026', { x: colX(start), y: monthBandY, w: colW * span, h: monthH, fontFace: FONT, fontSize: 10, bold: true, color: tc, align: 'center', valign: 'middle' });
});
s.addText('Workstream', { x: 0.5, y: monthBandY, w: 2.9, h: monthH, fontFace: FONT, fontSize: 10, bold: true, color: SOFT, valign: 'middle' });

// Week ticks + light vertical gridlines
const rowsY0 = 2.86, rowH = 0.46, nRows = 7;
const gridBottom = rowsY0 + rowH * nRows;
for (let i = 0; i < WEEKS; i++) {
  s.addText('W' + (i + 1), { x: colX(i), y: monthBandY + monthH + 0.01, w: colW, h: 0.18, fontFace: FONT, fontSize: 7, color: MUTED, align: 'center' });
  s.addShape(p.ShapeType.line, { x: colX(i), y: rowsY0, w: 0, h: rowH * nRows, line: { color: 'EEF2F7', width: 0.5 } });
}
s.addShape(p.ShapeType.line, { x: colX(WEEKS), y: rowsY0, w: 0, h: rowH * nRows, line: { color: 'EEF2F7', width: 0.5 } });

// Rows: [label, startCol, endCol(inclusive), color, dateText]
const rows = [
  ['C-level confirmation & sign-off', 0, 0, PURPLE, 'Sep 1–7'],
  ['UI/UX design', 1, 3, TEAL, 'Sep 8–28'],
  ['Development / coding', 1, 6, PRIMARY, 'Sep 8 – Oct 19'],
  ['External integrations', 5, 8, ORANGE, 'Oct 6 – Nov 2'],
  ['Internal integrations', 5, 8, ROSE, 'Oct 6 – Nov 2'],
  ['Testing & UAT', 9, 11, GREEN, 'Nov 3–23'],
  ['Go-live', 11, 11, DARK, 'Nov 24'],
];
rows.forEach((r, i) => {
  const [label, a, b, color, dt] = r;
  const y = rowsY0 + i * rowH;
  if (i % 2 === 0) s.addShape(p.ShapeType.rect, { x: 0.5, y, w: 12.35, h: rowH, fill: { color: 'FAFBFC' }, line: { width: 0 } });
  s.addText(label, { x: 0.55, y, w: 2.85, h: rowH, fontFace: FONT, fontSize: 10.5, bold: true, color: INK, valign: 'middle' });
  const barY = y + (rowH - 0.30) / 2;
  const bx = colX(a), bw = (b - a + 1) * colW;
  if (label === 'Go-live') {
    // milestone flag at Nov 24 (just after W12)
    s.addShape(p.ShapeType.rect, { x: colX(WEEKS) - 0.015, y: rowsY0, w: 0.03, h: rowH * nRows, fill: { color: GREEN }, line: { width: 0 } });
    s.addShape(p.ShapeType.chevron, { x: colX(WEEKS) - 0.02, y: barY, w: 1.15, h: 0.30, fill: { color: GREEN }, line: { width: 0 } });
    s.addText('▶ GO-LIVE · Nov 24', { x: colX(WEEKS) - 0.02, y: barY, w: 1.15, h: 0.30, fontFace: FONT, fontSize: 8.5, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
  } else {
    s.addShape(p.ShapeType.roundRect, { x: bx, y: barY, w: bw, h: 0.30, rectRadius: 0.05, fill: { color: color }, line: { width: 0 } });
    s.addText(dt, { x: bx + 0.04, y: barY, w: bw - 0.08, h: 0.30, fontFace: FONT, fontSize: 8, bold: true, color: 'FFFFFF', align: (bw > 1.2 ? 'center' : 'left'), valign: 'middle' });
  }
});
s.addShape(p.ShapeType.rect, { x: 0.5, y: rowsY0, w: 12.35, h: 0, line: { color: GREY, width: 0.75 }, fill: { color: GREY } });

// ---- Milestone strip ----
const msY = gridBottom + 0.22;
s.addText('KEY MILESTONES', { x: 0.5, y: msY, w: 12.3, h: 0.24, fontFace: FONT, fontSize: 10, bold: true, color: SOFT, charSpacing: 2 });
const miles = [
  ['Sep 1', 'Kickoff — C-level sign-off', PURPLE],
  ['Sep 28', 'UI/UX design complete', TEAL],
  ['Oct 19', 'Build complete', PRIMARY],
  ['Nov 2', 'Integrations complete', ORANGE],
  ['Nov 23', 'UAT sign-off', GREEN],
  ['Nov 24', 'GO-LIVE', DARK],
];
(() => {
  const gap = 0.2, x0 = 0.5, total = 12.33, w = (total - gap * (miles.length - 1)) / miles.length;
  let x = x0;
  miles.forEach(([d, t, c]) => {
    s.addShape(p.ShapeType.roundRect, { x, y: msY + 0.28, w, h: 0.62, rectRadius: 0.06, fill: { color: GREYBG }, line: { color: GREY, width: 1 } });
    s.addShape(p.ShapeType.rect, { x, y: msY + 0.28, w: 0.08, h: 0.62, fill: { color: c }, line: { width: 0 } });
    s.addText(d, { x: x + 0.16, y: msY + 0.33, w: w - 0.2, h: 0.24, fontFace: FONT, fontSize: 11, bold: true, color: c });
    s.addText(t, { x: x + 0.16, y: msY + 0.57, w: w - 0.22, h: 0.3, fontFace: FONT, fontSize: 8.5, color: SOFT });
    x += w + gap;
  });
})();

// ---- Footnotes ----
s.addText([
  { text: 'External integrations: ', options: { bold: true, color: INK } },
  { text: 'company registry / AML screening, email (SMTP) gateway.   ', options: { color: SOFT } },
  { text: 'Internal integrations: ', options: { bold: true, color: INK } },
  { text: 'Finance (coded-merchant backlog), Legal (signed agreements), HR / Active Directory (single sign-on & logins).', options: { color: SOFT } },
], { x: 0.5, y: 7.04, w: 12.33, h: 0.3, fontFace: FONT, fontSize: 8.5, valign: 'top' });

// ---- Write ----
const OUT = 'Contact-Group-Implementation-Roadmap.pptx';
const outDocs = path.join(__dirname, 'public', 'docs', OUT);
p.writeFile({ fileName: outDocs }).then(() => {
  console.log('WROTE ' + outDocs);
  try { fs.copyFileSync(outDocs, path.join('C:', 'Users', 'do.orfy', 'Desktop', OUT)); console.log('COPIED to Desktop'); }
  catch (e) { console.log('Desktop copy skipped: ' + e.message); }
}).catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
