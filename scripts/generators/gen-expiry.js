// Generates the Lifecycle Expiry & SLA Matrix Word document.
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, PageNumber } = require('docx');
const DESK = 'C:/Users/do.orfy/Desktop';
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE', GREEN = '15803D', ORANGE = 'C2410C';
const run = (t, o = {}) => new TextRun({ text: t, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: 'Segoe UI' });
const P = (t, o = {}) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: o.after != null ? o.after : 120, line: 264 } });
const title = (t, sub) => [new Paragraph({ children: [run(t, { size: 40, bold: true, color: PRIMARY })], spacing: { after: 60 } }), new Paragraph({ children: [run(sub, { size: 24, color: MUTED })], spacing: { after: 70 } }), new Paragraph({ children: [run('Contact Group · Client & Pipeline Platform   ·   June 2026', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 220 } })];
const h2 = (t) => new Paragraph({ children: [run(t, { size: 27, bold: true, color: PRIMARY })], spacing: { before: 250, after: 100 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const bullet = (t, r) => new Paragraph({ children: r || [run(t, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 50, line: 260 } });
const callout = (t, bg, bc, tc) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, { color: tc || '1E3A8A', size: 20 })], shading: { fill: bg || 'EFF4FF' }, border: { left: { color: bc || PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 90, after: 130 }, indent: { left: 120 } });
function cell(t, o = {}) { return new TableCell({ children: [new Paragraph({ children: [run(t, { size: 18, bold: o.bold, color: o.color || (o.header ? PRIMARY : SOFT) })], spacing: { after: 20, line: 248 } })], shading: o.header ? { fill: HEADBG } : (o.fill ? { fill: o.fill } : undefined), width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 } }); }
function table(headers, rows, w) { const b = { style: BorderStyle.SINGLE, size: 4, color: LINE }; return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }, rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: w && w[i] })) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: w && w[i] })) }))] }); }

const children = [
  ...title('Lifecycle Expiry & SLA Matrix', 'How long entries last before Good to Go, and the expiry between negotiation cycles'),
  callout('The “no-update clock”: every pipeline entry tracks the days since its last update. The clock RESETS to zero whenever the entry is updated — a status change, a recorded meeting outcome, a comment, or an approved extension. The thresholds below act on that clock.'),

  h2('1. Inactivity expiry (any active entry)'),
  P('Applies to live entries (First Meeting through Negotiation C2). It does not run on entries that are already Closed, Done Deal, Good to Go, or awaiting a Head of Products decision.'),
  table(['Days with NO update', 'What happens', 'Who is notified'], [
    ['7 days', 'Automatic reminder to update the entry  (live in the system today)', 'Entrant'],
    ['14 days', 'Escalation reminder', 'Entrant + responsible RM + Head of Products'],
    ['30 days', 'Entry automatically moves to the Good to Go list', 'MD, CEO + full leadership list (system-originated update)'],
  ], [22, 48, 30]),
  callout([run('In short: ', { bold: true }), run('an untouched entry is reminded at 7 days, escalated at 14, and expires to Good to Go at 30 days — where any RM in the group may re-engage it.', {})], 'FEF3C7', ORANGE, '854D0E'),

  h2('2. Expiry between negotiation cycles'),
  P('Each stage is expected to progress (advance, close, or be extended) within its window. If the entry is updated, the clock resets and the next cycle begins; if not, the inactivity rules in Section 1 apply.'),
  table(['Stage / cycle', 'Max time with no update', 'If the window passes'], [
    ['First Meeting', '14 days', 'Reminder → escalation → Good to Go (per Section 1)'],
    ['Negotiation', '14 days', 'Same'],
    ['Negotiation C1', '14 days', 'Same'],
    ['Negotiation C2 (final cycle)', '14 days', 'Must reach Done Deal or an approved Extension, otherwise → Good to Go'],
    ['Extend Negotiation (HoP-approved)', '+30 days (max 60)', 'Clock restarts; if it lapses again → Good to Go'],
  ], [34, 26, 40]),
  P('Total active runway across the three negotiation cycles is therefore about 6 weeks (3 × 14 days) before a deal must close, be extended, or expire — extensions add up to 60 more days with Head of Products approval.', { before: 40 }),

  h2('3. Head of Products decision SLAs'),
  P('While an entry is awaiting a Head of Products decision, the inactivity clock is paused — but the HoP is expected to act within these targets.'),
  table(['Pending decision', 'Target turnaround'], [
    ['New-entry validation (Pending HoP — Validation)', '2 working days (reminder at day 2, escalate to MD at day 5)'],
    ['Extension request', '2 working days'],
    ['Done Deal validation', '2 working days'],
    ['Edit / Delete request', '2 working days'],
    ['Returned to RM (awaiting the RM)', 'RM resubmits within 5 working days, else → Good to Go'],
  ], [50, 50]),

  h2('4. Existing merchants (Master Ledger)'),
  P('Converted merchants follow a longer stagnation cycle, already reflected in the platform:'),
  bullet('6 months with no activity → the client is flagged as stagnant.'),
  bullet('30 days from the flag to reactivate → otherwise it moves to the Good to Go list for group-wide re-engagement.'),

  h2('5. Implementation note'),
  bullet('Live today: the 7-day no-update reminder (the “weekly reminder check”), the manual move to Good to Go, and the 6-month / 30-day merchant stagnation rule.'),
  bullet('Agreed policy (configurable): the 14-day per-cycle windows, the 14-day escalation, the 30-day auto Good to Go, and the HoP 2-working-day SLAs. These run as a scheduled daily job once deployed — all thresholds are adjustable without code changes.'),
  callout('This matrix is also attached as an annex to the New Entry — Lifecycle & Journey flow chart.'),
];

(async () => {
  const buf = await Packer.toBuffer(new Document({ styles: { default: { document: { run: { font: 'Segoe UI', size: 21, color: INK } } } }, sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Lifecycle Expiry & SLA Matrix          Page ', { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED })] })] }) }, children }] }));
  fs.writeFileSync(path.join(DESK, 'Contact-Group-Expiry-Matrix.docx'), buf);
  console.log('wrote Contact-Group-Expiry-Matrix.docx (' + buf.length + ' bytes)');
})();
