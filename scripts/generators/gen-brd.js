// Business Requirements Document (BRD) — simple language, full detail.
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, PageNumber } = require('docx');

const DESK = 'C:/Users/do.orfy/Desktop';
const OUTDOCS = path.join(__dirname, 'public', 'docs');
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE';
const run = (t, o = {}) => new TextRun({ text: t, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: 'Segoe UI' });
const P = (t, o = {}) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: o.after != null ? o.after : 120, line: 268 }, alignment: o.align });
const h1 = (t) => new Paragraph({ children: [run(t, { size: 28, bold: true, color: PRIMARY })], spacing: { before: 260, after: 100 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const h2 = (t) => new Paragraph({ children: [run(t, { size: 23, bold: true, color: INK })], spacing: { before: 170, after: 60 } });
const bullet = (t) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 55, line: 264 } });
const callout = (t) => new Paragraph({ children: [run(t, { color: '1E3A8A', size: 20 })], shading: { fill: 'EFF4FF' }, border: { left: { color: PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 90, after: 140 }, indent: { left: 120 } });
function cell(t, o = {}) { return new TableCell({ children: (Array.isArray(t) ? t : [t]).map(x => new Paragraph({ children: [run(x, { size: o.size || 18, bold: o.bold, color: o.color || (o.header ? PRIMARY : SOFT) })], spacing: { after: 20, line: 248 } })), shading: o.header ? { fill: HEADBG } : undefined, width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 } }); }
function table(headers, rows, w) { const b = { style: BorderStyle.SINGLE, size: 4, color: LINE }; return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }, rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: w && w[i] })) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: w && w[i] })) }))] }); }
const REQ = (id, txt) => new Paragraph({ children: [run(id + '  ', { bold: true, color: PRIMARY, size: 19 }), run(txt, { color: SOFT })], spacing: { after: 55, line: 262 }, indent: { left: 360, hanging: 360 } });

const children = [
  new Paragraph({ children: [run('Business Requirements Document', { size: 42, bold: true, color: PRIMARY })], spacing: { after: 60 } }),
  new Paragraph({ children: [run('Contact Group · Client & Pipeline Platform', { size: 24, color: MUTED })], spacing: { after: 60 } }),
  new Paragraph({ children: [run('Version 1.0 · Prepared for Business & IT stakeholders', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 200 } }),

  h1('1. Document control'),
  table(['Field', 'Detail'], [
    ['Document', 'Business Requirements Document (BRD)'],
    ['Product', 'Contact Group — Client & Pipeline Platform'],
    ['Version', '1.0'],
    ['Owner', 'Doaa Orfy (Product / Business owner)'],
    ['Audience', 'Executive Committee, Head of Products, IT, Legal, Finance'],
    ['Status', 'For review and sign-off'],
  ], [30, 70]),

  h1('2. Purpose & objective'),
  P('The Client & Pipeline Platform gives Contact Group one shared, disciplined way to capture and grow every client opportunity across all group companies (Factoring, Leasing, Mortgage, Credit, Insurance, Contact Auto, and Contact Now).'),
  h2('Objectives'),
  bullet('One group-wide pipeline so the group never pursues or onboards the same client twice.'),
  bullet('Clean, consistent data captured from a verified company directory instead of free typing.'),
  bullet('Compliance and quality enforced automatically — AML screening, no-duplication, and Head-of-Products validation where it matters.'),
  bullet('Full visibility for leadership, informed automatically at every step.'),
  bullet('A single master list of all merchants, with the sold products, payment behaviour and exposure in one place.'),

  h1('3. Scope'),
  h2('In scope'),
  bullet('Prospect capture, validation, negotiation lifecycle, and conversion to a coded merchant.'),
  bullet('Master merchant ledger, Good-to-Go re-engagement, cross-sell to existing merchants.'),
  bullet('Leadership engagement (interest + delegation), department-referred leads, product-level tracking.'),
  bullet('Reference-data management (industries, products, governorates, company-size definitions, notification recipients, SLAs).'),
  bullet('Role-based access, notifications, and an admin activity/email log.'),
  h2('Out of scope (this release)'),
  bullet('Real-time accounting / core-banking postings (exposure and sales are captured, not calculated).'),
  bullet('Automated document generation of signed contracts (contracts are attached by file reference).'),
  bullet('Mobile native apps (the platform is a responsive web application).'),

  h1('4. Stakeholders & roles'),
  table(['Role', 'Responsibility'], [
    ['Relationship Manager / Employee', 'Create prospects, progress opportunities, submit done deals, update product stages, record bookings.'],
    ['Head of Products (HoP)', 'Validate typed / cross-sell / late entries, approve extensions and closings, approve edits & deletes.'],
    ['CEO / MD / C-Level', 'Group-wide visibility; flag interest; delegate leads to their team; receive new-prospect alerts.'],
    ['Administrator', 'Maintain reference lists and accounts; receives a record of every request.'],
    ['Legal', 'Governance gate — confirms a signed deal exists on the portal before signature.'],
    ['Finance', 'Provides the coded-merchant backlog for initial data load.'],
  ], [32, 68]),

  h1('5. Functional requirements'),

  h2('5.1 Prospect capture'),
  REQ('FR-01', 'Any employee can create a new prospect. The responsible unit (company) is auto-set to the RM’s own company and drives the reference code (e.g. FACT-P002).'),
  REQ('FR-02', 'Prospect name is selected from a verified Egyptian company directory (live company lookup with a seeded fallback). Existing merchants, pipeline and Good-to-Go entries also appear in the list and are blocked from re-entry.'),
  REQ('FR-03', 'If a company is not listed, the user selects “Not included” and types the name; this routes the entry to HoP validation.'),
  REQ('FR-04', 'Mandatory fields: prospect name, industry, company size, governorate of premises, responsible RM, at least one product of interest, visit date, expected close date, summary, and at least one attendee.'),
  REQ('FR-05', 'Company size is a mandatory dropdown with three CBE-aligned segments: MVSEs, SMEs, MIDCAP.'),
  REQ('FR-06', 'Governorate is a mandatory dropdown listing all 27 Egyptian governorates.'),
  REQ('FR-07', 'Expected deal value / sales is optional.'),
  REQ('FR-08', 'Contact person, title, mobile and email are captured. The responsible RM’s phone and email are shown automatically from the contact database.'),
  REQ('FR-09', 'An unfinished entry is saved automatically as a draft and can be resumed from the Drafts button.'),

  h2('5.2 Compliance gates (automatic, on capture)'),
  REQ('FR-10', 'AML screening: the prospect name is screened against a compliance watchlist. A potential match blocks the entry until cleared by compliance.'),
  REQ('FR-11', 'No-duplication: the name is checked live against All Merchants, the Pipeline, and Good-to-Go. An active pipeline or Good-to-Go match is blocked and the user is directed to the existing record.'),
  REQ('FR-12', 'Cross-sell exception: if the name matches an existing merchant, the entry is allowed but routed to HoP to validate that it is a different department and a different product than already sold. The new entry keeps the merchant’s reference and company code, and the merchant keeps its original RM. It is reflected on the merchant profile as an “additional onboarding”.'),

  h2('5.3 Validation & governance'),
  REQ('FR-13', 'Directory-selected entries become active immediately (First Meeting) with no HoP step.'),
  REQ('FR-14', 'Typed (“Not included”) names, late entries, and cross-sell entries are routed to HoP as Pending Validation / Late Entry / Cross-sell.'),
  REQ('FR-15', 'HoP can approve, or return to the RM with a reason (e.g. “please choose the prospect name from the directory”). Edits and deletions also require HoP approval.'),
  REQ('FR-16', 'A late entry (visit date in the past) requires minutes of meeting or a call report before it can be submitted.'),

  h2('5.4 Negotiation lifecycle & product tracking'),
  REQ('FR-17', 'Stages: First Meeting → Negotiation → Negotiation C1 → Negotiation C2 → Extend Negotiation (HoP) → Done Deal (HoP + signed contract).'),
  REQ('FR-18', 'Each product on an entry is tracked separately with its own stage (Negotiation / Booked / On hold / Dropped), alongside the overall approach status; the RM updates each product stage.'),
  REQ('FR-19', 'On HoP approval of a Done Deal, a coded merchant is created in All Merchants and the entry leaves the active pipeline.'),

  h2('5.5 Leadership engagement & delegation'),
  REQ('FR-20', 'CEO, MD, C-Level and Branch managers are notified on every new prospect and can flag “I’m interested”, selecting their related product (which is added to the pipeline).'),
  REQ('FR-21', 'A leader can delegate a lead to a member of their team. The delegate is notified to open it; the responsible RM is told to call the delegate; the 2-working-day contact SLA and “mark contacted” apply at the delegate level; the delegating leader keeps visibility of the updates.'),

  h2('5.6 Department-referred leads'),
  REQ('FR-22', 'Any department (e.g. IT) can refer an opportunity and direct it to a chosen C-level. The C-level can delegate the referral to a team member. Status is tracked (Open → Delegated).'),

  h2('5.7 Merchant master ledger'),
  REQ('FR-23', 'All Merchants lists every client with: name, code, company, RM, sold products, onboarding date, payment behaviour, status and exposure.'),
  REQ('FR-24', 'Payment behaviour is shown with three colours — green (good), orange (not regular), red (bad).'),
  REQ('FR-25', 'The list supports search, filter (status, company) and sort. Merchant onboarding date, sold products and payment behaviour are also shown when a new prospect matches an existing merchant.'),
  REQ('FR-26', 'A “Request support” action on any merchant or pipeline row emails/notifies the responsible RM to coordinate before approaching the client.'),

  h2('5.8 Good to Go & re-engagement'),
  REQ('FR-27', 'A merchant can be released to the Good-to-Go list, where any RM group-wide can re-engage it. Re-engagement opens the standard new-prospect form with the prospect’s history shown and the company fixed.'),

  h2('5.9 Notifications & audit'),
  REQ('FR-28', 'Notifications are generated on every material event (new prospect, validation, interest, delegation, done deal, product update, referral). A full comment/decision history is retained on every entry. An admin activity/email log records every request.'),

  h2('5.10 Reference data (Admin & Lists)'),
  REQ('FR-29', 'Admin/HoP maintain industries, products, the Egypt directory fallback, notification recipients, and the AML watchlist.'),
  REQ('FR-30', 'The Codes tab documents the merchant code scheme, the company-size (CBE) segmentation, and the lifecycle SLAs.'),

  h2('5.11 Compliance disclaimer'),
  REQ('FR-31', 'A portal-wide disclaimer states that investigation requests for any merchant will not be processed unless the entry has been created on the portal.'),

  h1('6. Service levels (SLA)'),
  P('Working days follow the Egypt working week (Sunday–Thursday).'),
  table(['Cycle / SLA', 'Target (working days)', 'Rule'], [
    ['Cycle 1 — First Meeting', '5', 'Log the outcome and advance to Negotiation.'],
    ['Cycle 2 — Negotiation', '10', 'Progress the deal or update the entry.'],
    ['Cycle 3 — Negotiation C1', '10', 'Second negotiation round before escalation.'],
    ['Cycle 4 — Negotiation C2', '10', 'Final negotiation round before escalation.'],
    ['Extension', '10', 'HoP approval, then 10 more days.'],
    ['Closing — Done Deal', '2', 'HoP validates the signed contract; approval creates the merchant.'],
    ['Interest / delegation follow-up', '2', 'RM contacts the interested leader or delegate, else it escalates to the manager.'],
    ['Stale-entry reminder', '7', 'Any entry idle 7+ working days is flagged to HoP (weekly sweep).'],
  ], [40, 18, 42]),

  h1('7. Governance'),
  bullet('Legal control gate — before any agreement is signed, Legal confirms the deal and client exist on the portal; if not, a ticket is required before signing.'),
  bullet('Head-of-Products validation — a single, consistent quality gate for typed, cross-sell, late, extend, close, edit and delete actions.'),
  bullet('Audit trail — full comment and decision history on every entry; admin log of all requests.'),
  callout('The result: consistent data, enforced compliance, and clear accountability across the whole group.'),

  h1('8. Data & integrations'),
  table(['Integration', 'Purpose', 'Type'], [
    ['Company registry / directory', 'Verified prospect names & Commercial Register (live lookup + fallback).', 'External'],
    ['AML watchlist', 'Screen prospect names on capture.', 'External / internal list'],
    ['Contact database', 'Auto-populate responsible RM phone & email.', 'Internal'],
    ['Email (SMTP) gateway', 'Deliver notifications and admin alerts.', 'External'],
    ['HR / Active Directory (SSO)', 'Single sign-on and employee accounts.', 'Internal'],
    ['Finance', 'Coded-merchant backlog for initial load.', 'Internal'],
    ['Legal', 'Signed-agreements list for initial load and the control gate.', 'Internal'],
  ], [26, 52, 22]),

  h1('9. Non-functional requirements'),
  bullet('Availability: served while the host is running; target business-hours availability once hosted centrally.'),
  bullet('Security: role-based access, hashed passwords, session cookies; SSO recommended at go-live.'),
  bullet('Deployment: currently served on the office network; a permanent internal address (contact.eg) is recommended for remote access.'),
  bullet('Usability: responsive web UI, English interface, Egypt working-week logic for SLAs.'),

  h1('10. Assumptions & constraints'),
  bullet('Company-size turnover thresholds are working values aligned to the CBE SME decree and must be confirmed against the current CBE circular.'),
  bullet('Exposure, sales and payment behaviour are entered/maintained by users pending accounting integration.'),
  bullet('Real email delivery requires the SMTP gateway; until then, alerts are in-app and logged.'),

  h1('11. Glossary'),
  table(['Term', 'Meaning'], [
    ['MVSEs / SMEs / MIDCAP', 'Company-size segments per the CBE definition.'],
    ['Good to Go', 'Released merchants/entries available group-wide for re-engagement.'],
    ['Cross-sell', 'A new onboarding of an existing merchant for a different department & product.'],
    ['HoP', 'Head of Products — the validation authority.'],
    ['Department lead', 'An opportunity referred by another department and directed to a C-level.'],
  ], [30, 70]),
];

const doc = new Document({
  styles: { default: { document: { run: { font: 'Segoe UI' } } } },
  sections: [{
    properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Client & Pipeline Platform — BRD v1.0     Page ', { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: 'Segoe UI' })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  const out = path.join(OUTDOCS, 'Contact-Group-BRD.docx');
  fs.writeFileSync(out, buf);
  console.log('WROTE ' + out);
  try { fs.writeFileSync(path.join(DESK, 'Contact-Group-BRD.docx'), buf); console.log('COPIED to Desktop'); } catch (e) { console.log('Desktop copy skipped: ' + e.message); }
});
