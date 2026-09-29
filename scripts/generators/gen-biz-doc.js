// Business (non-technical) stakeholder document: journey + features + action plans.
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, Footer, PageNumber } = require('docx');
const DESK = 'C:/Users/do.orfy/Desktop';
const IMG = path.join(__dirname, 'docimg');
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE', GREEN = '15803D', ORANGE = 'C2410C';
const dims = { 'fc-newentry':[960,1530] };
const run = (t, o = {}) => new TextRun({ text: t, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: 'Segoe UI' });
const P = (t, o = {}) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: o.after != null ? o.after : 130, line: 268 }, alignment: o.align });
const title = (t, sub) => [new Paragraph({ children: [run(t, { size: 40, bold: true, color: PRIMARY })], spacing: { after: 60 } }), new Paragraph({ children: [run(sub, { size: 24, color: MUTED })], spacing: { after: 70 } }), new Paragraph({ children: [run('Contact Group · Stakeholder Briefing · June 2026', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 220 } })];
const h2 = (t) => new Paragraph({ children: [run(t, { size: 27, bold: true, color: PRIMARY })], spacing: { before: 250, after: 100 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const h3 = (t) => new Paragraph({ children: [run(t, { size: 23, bold: true, color: INK })], spacing: { before: 160, after: 60 } });
const bullet = (t, r) => new Paragraph({ children: r || [run(t, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 60, line: 264 } });
const num = (n, t) => new Paragraph({ children: [run(n + '.  ', { bold: true, color: PRIMARY }), run(t, { color: SOFT })], spacing: { after: 70, line: 264 }, indent: { left: 360, hanging: 360 } });
const callout = (t, bg, bc, tc) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, { color: tc || '1E3A8A', size: 20 })], shading: { fill: bg || 'EFF4FF' }, border: { left: { color: bc || PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 90, after: 140 }, indent: { left: 120 } });
function cell(t, o = {}) { return new TableCell({ children: [new Paragraph({ children: [run(t, { size: o.size || 18, bold: o.bold, color: o.color || (o.header ? PRIMARY : SOFT) })], spacing: { after: 20, line: 248 } })], shading: o.header ? { fill: HEADBG } : undefined, width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 } }); }
function table(headers, rows, w) { const b = { style: BorderStyle.SINGLE, size: 4, color: LINE }; return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }, rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: w && w[i] })) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: w && w[i] })) }))] }); }
function image(name, dw) { const [w, h] = dims[name]; dw = dw || 330; const dh = Math.round(dw * h / w); return new Paragraph({ children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(IMG, name + '.png')), transformation: { width: dw, height: dh } })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 60 } }); }

const children = [
  ...title('Client & Pipeline Platform', 'A business overview for stakeholders — the client journey, the features, and the plan to go live'),

  h2('Executive summary'),
  P('The Client & Pipeline Platform gives Contact Group one shared, disciplined way to capture and grow every client opportunity across all group companies. Any employee can log a prospect; leadership is informed automatically; the Head of Products validates each opportunity; and every deal is tracked through to a won client — all in a single system, with full visibility and built-in approvals. This document explains how it works in plain terms, the value it creates, and the recommended plan to put it live.'),

  h2('Why we built it'),
  bullet('One group-wide view of prospects, so teams check before approaching and we stop pursuing the same client twice.'),
  bullet('Faster, cleaner capture — company details come from a verified directory rather than free typing.'),
  bullet('Clear governance — the Head of Products reviews every new opportunity, and approvals are required to extend timelines or close deals.'),
  bullet('Cross-sell across the group — Factoring, Leasing, Mortgage, Credit, Insurance and Contact Auto, all in one place.'),
  bullet('Full visibility for leadership — the right people are informed automatically at each step.'),

  h2('The client journey'),
  P('Every opportunity follows the same five simple stages. The diagram shows the full journey; the steps below describe it in business terms.'),
  image('fc-newentry', 300),
  h3('1 · Capture'),
  P('The team selects the company from a verified Egyptian directory — the company name and Commercial Register are filled in automatically. If a company is not listed, they flag it and type it in for the Head of Products to check. They add the sector, the products of interest, and the client contact details. Each opportunity receives its own reference code (for example, FACT-P002) for easy tracking.'),
  h3('2 · Inform'),
  P('The moment an opportunity is saved, the entire leadership distribution list is notified — no one has to chase updates. Notifications also go out at every status change and when a deal is validated or won.'),
  h3('3 · Validate'),
  P('The Head of Products reviews every new opportunity before it can progress — a single, consistent quality gate. They can approve it or send it back with a clear reason for the team to fix and resubmit. (When the Head of Products enters an opportunity themselves, it is approved automatically.) A full history of comments and decisions is kept on every opportunity.'),
  h3('4 · Negotiate'),
  P('The opportunity moves through clear stages toward a decision. Extending the timeline or closing a deal requires Head of Products sign-off, giving control at the moments that matter. Opportunities with no activity are moved to a “re-engage” list so no lead is quietly lost.'),
  h3('5 · Outcome'),
  P('When a deal is won, the client is added automatically to the master client list with a unique code. Unsuccessful opportunities are closed, and stale ones become available for re-engagement across the group.'),

  h2('What the platform gives the business'),
  table(['Capability', 'Business benefit'], [
    ['Verified company directory', 'Clean, consistent data — no duplicate or misspelt clients'],
    ['One master list of all group clients', 'A single source of truth across companies'],
    ['Reference codes on every opportunity', 'Easy tracking, reporting and hand-over'],
    ['Standard industry & product lists', 'Consistent, comparable pipeline data'],
    ['Role-based access', 'The right people see the right information'],
    ['Automatic emails at every step', 'Leadership always up to date, without chasing'],
    ['Full audit trail of decisions', 'Accountability and compliance built in'],
  ], [42, 58]),

  h2('Who does what'),
  table(['Role', 'What they do'], [
    ['Relationship Managers & employees', 'Log prospects, manage their opportunities, move deals forward.'],
    ['Head of Products', 'Validates every new opportunity; approves extensions, deals, edits and deletions; maintains the standard lists.'],
    ['CEO / MD', 'See a group-wide view; can flag interest to join a client visit.'],
    ['Administrator', 'Maintains the lists and receives a record of every request made in the platform.'],
  ], [34, 66]),

  h2('Governance controls & initial data'),
  h3('Legal control gate'),
  P('Governance sits with the Legal department. Before any agreement is signed, Legal checks that the deal and client are already recorded in the portal. If they are not, Legal requires a ticket to be submitted before the signing can proceed. This ensures every signed deal exists in the system — no off-portal exceptions — and enforces full adoption at the point of signature.'),
  h3('Initial data backlog'),
  P('The existing book is loaded into the portal from two authoritative sources, so it reflects reality from day one:'),
  bullet('Finance — the coded merchant list.'),
  bullet('Legal — the list of signed agreements and partnerships.'),
  callout('Together these give a complete, verified starting book across the whole group on launch day, and a Legal-owned control that keeps every future signed deal on the portal.', 'EFF4FF', PRIMARY),

  h2('IT action plan & integrations'),
  P('To put the platform live and connected, IT needs to complete the following. A working, shareable link can be ready within days; a hardened production setup is about one week (mostly waiting on server, certificate and mail approvals).'),
  table(['Integration', 'What it delivers', 'Owner', 'Timing'], [
    ['Company directory (Egypt)', 'Verified company names + Commercial Register auto-filled on entry', 'IT', 'Week 1'],
    ['Industry list (standard sectors)', 'Consistent industry categories across every opportunity', 'IT + Head of Products', 'Week 1'],
    ['Email notifications (Contact mail)', 'Automatic alerts to the leadership list + admin at every step', 'IT + Mail team', 'Week 1'],
    ['Secure hosting on a Contact server', 'One permanent, company-wide link', 'IT', 'Week 1–2'],
    ['Phase 2 — link to lending systems', 'No lending proceeds unless the client is on the portal (via Commercial Register)', 'IT + Integration team', 'Post-launch'],
  ], [24, 40, 20, 16]),
  h3('Integration specifics'),
  bullet('', [run('Company directory: ', { bold: true, color: INK }), run('OpenCorporates — Egypt company data (opencorporates.com), providing verified names and Commercial Register numbers. Alternatives if preferred later: companiesdata.cloud, developer.willro.com.', { color: SOFT })]),
  bullet('', [run('Industries (10 sectors): ', { bold: true, color: INK }), run('ICT/Software & Digital · Tourism, Hospitality & Travel · Renewable Energy & Green · Manufacturing & Export-Led · Healthcare & MedTech · Construction, Real Estate & Infrastructure · Agribusiness & Food Processing · Food & beverage · FMCG · Automotive.', { color: SOFT })]),
  bullet('', [run('Emails: ', { bold: true, color: INK }), run('sent through Contact’s email system to the leadership distribution list — MD, C-level and Branch Managers (about 74 people) — plus the Administrator (doaa.orfy@contact.eg). Triggered on new prospect, every status change, validation, extension, deal and approval.', { color: SOFT })]),

  h2('Business action plan — alignment to ExCo'),
  P('Before the Executive Committee, we hold separate working sessions with key stakeholders to review the platform and workflow, gather feedback, and build buy-in. Cadence: two meetings per week.'),
  table(['#', 'Stakeholder', 'Purpose'], [
    ['1', 'Mohsen ElShaarani', 'Review the platform & workflow; capture feedback'],
    ['2', 'Moustafa Adel', 'Review the platform & workflow; capture feedback'],
    ['3', 'Ahmed Khalifa', 'Review the platform & workflow; capture feedback'],
    ['4', 'Khaled Riad', 'Review the platform & workflow; capture feedback'],
    ['5', 'Youssef Fahmy', 'Front-line (RM) review of usability & the entry journey'],
  ], [8, 42, 50]),
  h3('Timeline (5 weeks)'),
  num(1, 'Weeks 1–3 — Stakeholder sessions at two meetings per week:  Week 1: Mohsen ElShaarani & Moustafa Adel · Week 2: Ahmed Khalifa & Khaled Riad · Week 3: Youssef Fahmy.'),
  num(2, 'Week 4 — Reflect and incorporate all feedback and amendments.'),
  num(3, 'Week 5 — Present to the Executive Committee for approval to apply.'),
  callout('The platform is available for all of these sessions on a shared link, so every stakeholder reviews a working system, not a concept.', 'EFF4FF', PRIMARY),

  h2('Recommendation'),
  bullet('Approve the IT action plan so the company directory, industry list and email notifications are connected and the platform is hosted on a Contact server.'),
  bullet('Approve the 5-week alignment plan: stakeholder sessions (2/week), a week to reflect amendments, then ExCo approval to apply.'),
  bullet('On ExCo approval, roll out group-wide and begin Phase 2 (link to lending systems via the Commercial Register).'),
  callout('Outcome: one disciplined, group-wide way to capture and grow every client opportunity — with full visibility, built-in governance, and no duplicated effort.', 'DCFCE7', GREEN, '14532D'),
];

(async () => {
  const buf = await Packer.toBuffer(new Document({ styles: { default: { document: { run: { font: 'Segoe UI', size: 21, color: INK } } } }, sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Client & Pipeline Platform — Stakeholder Briefing          Page ', { size: 15, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 15, color: MUTED })] })] }) }, children }] }));
  const name = 'Contact-Group-Stakeholder-Document.docx';
  fs.writeFileSync(path.join(__dirname, 'public', 'docs', name), buf); // download copy (always writable)
  let deskOk = true;
  try { fs.writeFileSync(path.join(DESK, name), buf); } catch (e) { deskOk = false; console.log('Desktop copy LOCKED (file open in Word):', e.code); }
  console.log('wrote docx (' + buf.length + ' bytes). Desktop updated: ' + deskOk);
})();
