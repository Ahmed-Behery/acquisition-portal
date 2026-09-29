// Generates the six Word (.docx) deliverables on the Desktop.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, Footer, PageNumber,
} = require('docx');

const DESK = 'C:/Users/do.orfy/Desktop';
const IMG = path.join(__dirname, 'docimg');
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE';

const imgDims = { 'fc-access':[1520,720], 'fc-entry':[1520,940], 'fc-validation':[1520,860], 'fc-lifecycle':[1520,840], 'fc-admin':[1520,600] };

// ---------- helpers ----------
const run = (text, o = {}) => new TextRun({ text, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: 'Segoe UI' });
const P = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [run(children, o)], spacing: { after: o.after != null ? o.after : 120, before: o.before || 0, line: 264 }, alignment: o.align });
const title = (t, sub) => [
  new Paragraph({ children: [run(t, { size: 44, bold: true, color: PRIMARY })], spacing: { after: 60 } }),
  ...(sub ? [new Paragraph({ children: [run(sub, { size: 26, color: MUTED })], spacing: { after: 80 } })] : []),
  new Paragraph({ children: [run('Contact Group · Client & Pipeline Platform   ·   June 2026', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 240 } }),
];
const h2 = (t) => new Paragraph({ children: [run(t, { size: 30, bold: true, color: PRIMARY })], spacing: { before: 280, after: 120 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const h3 = (t) => new Paragraph({ children: [run(t, { size: 25, bold: true, color: INK })], spacing: { before: 200, after: 90 } });
const h4 = (t) => new Paragraph({ children: [run(t.toUpperCase(), { size: 18, bold: true, color: SOFT })], spacing: { before: 140, after: 60 } });
const bullet = (text, runs) => new Paragraph({ children: runs || [run(text, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 60, line: 264 } });
const step = (n, runs) => new Paragraph({ children: [run(n + '.  ', { bold: true, color: PRIMARY }), ...(Array.isArray(runs) ? runs : [run(runs, { color: SOFT })])], spacing: { after: 70, line: 264 }, indent: { left: 360, hanging: 360 } });
const callout = (text) => new Paragraph({ children: [run(text, { color: '1E3A8A', size: 20 })], shading: { fill: 'EFF4FF' }, border: { left: { color: PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 100, after: 140 }, indent: { left: 120 } });

function cell(text, opts = {}) {
  const runs = Array.isArray(text) ? text : [run(text, { size: opts.size || 19, bold: opts.bold, color: opts.color || (opts.header ? PRIMARY : SOFT) })];
  return new TableCell({
    children: [new Paragraph({ children: runs, spacing: { after: 20, line: 252 } })],
    shading: opts.header ? { fill: HEADBG } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
  });
}
function table(headers, rows, widths) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: widths && widths[i] })) }),
      ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths && widths[i] })) })),
    ],
  });
}
function image(name) {
  const [w, h] = imgDims[name];
  const dispW = 600, dispH = Math.round(dispW * h / w);
  return new Paragraph({
    children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(IMG, name + '.png')), transformation: { width: dispW, height: dispH } })],
    alignment: AlignmentType.CENTER, spacing: { before: 120, after: 120 },
  });
}
function caption(t) { return new Paragraph({ children: [run(t, { size: 17, italics: true, color: MUTED })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }); }

function buildDoc(children) {
  return new Document({
    styles: { default: { document: { run: { font: 'Segoe UI', size: 21, color: INK } } } },
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Client & Pipeline Platform          Page ', { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED })] })] }) },
      children,
    }],
  });
}
async function save(file, children) {
  const buf = await Packer.toBuffer(buildDoc(children));
  fs.writeFileSync(path.join(DESK, file), buf);
  console.log('wrote', file, '(' + buf.length + ' bytes)');
}

// ===================================================================
// DOC 1 — Entry Creator profile (Employee / RM)
// ===================================================================
async function doc1() {
  await save('Contact-Group-Profile-Entry-Creator.docx', [
    ...title('Profile: Entry Creator (Employee / RM)', 'Features and options for the person who enters a new prospect'),
    h2('Who this is for'),
    P('Any employee in the Contact Group directory can sign in and create pipeline entries. This profile also covers Relationship Managers, who additionally own and progress their deals. Username = the part of your work email before the @ sign (e.g. John.Saad@contact.eg → john.saad). Default password: Contact@123.'),

    h2('What you can do'),
    table(['Area', 'Capabilities'], [
      ['Dashboard', 'See your own book, your open pipeline value, and a “+ New pipeline entry” button.'],
      ['New Entry', 'Create a prospect: pick its name from the Egypt company directory (or “Not included” + free text), choose industry & products, add Commercial Register no. and contact details, value, dates, attendees and a summary.'],
      ['My pipeline', 'View and open your entries; track status and comments.'],
      ['Manage your entry', 'Change negotiation stage, request an extension, submit a Done Deal, request an edit or deletion (all routed to the Head of Products).'],
      ['Resubmit', 'If the Head of Products returns your entry, address the comment and resubmit for validation.'],
      ['Reference', 'Browse the Master Ledger (all merchants), Good to Go list, Companies and Product Catalogue.'],
      ['Notifications', 'Receive alerts for assignments, returns, approvals and group prospect activity.'],
    ], [28, 72]),

    h2('The New Entry form — field by field'),
    table(['Field', 'Notes'], [
      ['Prospect name *', 'Searchable dropdown from the Egyptian companies directory. If the company is not listed, choose “Not included” and type the legal name — the Head of Products will validate it.'],
      ['Industry / Sector *', 'Dropdown from the managed industries list.'],
      ['Products of interest *', 'Tick all that apply from the product catalogue.'],
      ['Commercial Register no.', 'Auto-filled when picked from the directory; editable.'],
      ['Contact person / mobile / email', 'The prospect’s point of contact.'],
      ['Group company *', 'Which group company owns the negotiation.'],
      ['Expected value, visit date, close date *', 'Pipeline planning fields.'],
      ['Attendees *', 'You are added automatically; add others from anywhere in the group.'],
      ['Negotiation summary *', 'Current status, key points, next steps.'],
    ], [30, 70]),

    h2('Step by step — create a prospect'),
    step(1, 'Sign in, then click New Entry (sidebar) or “+ New pipeline entry”.'),
    step(2, 'In Prospect name, start typing and pick the company from the directory. If it isn’t there, click “Not included” and type the legal name.'),
    step(3, 'Select the industry and tick the products of interest.'),
    step(4, 'Enter the Commercial Register number and the contact person, mobile and email.'),
    step(5, 'Set the company, expected value, visit and close dates, attendees and a short summary.'),
    step(6, 'Click “Save & notify leadership”.'),
    callout('On save: the whole leadership distribution list (74 recipients) and the Administrator are notified, the entry becomes “Pending HoP — Validation”, and you are taken to the Product Catalogue to consider cross-sell.'),

    h2('After you submit'),
    bullet('The Head of Products validates the entry. If approved, it becomes “First Meeting” and you progress it through the stages.'),
    bullet('If returned, you receive a notification with a comment (e.g. “please choose prospect name”). Open the entry, fix it, and click “Resubmit for validation”.'),
    bullet('You can change the stage, request an extension, or submit a Done Deal as the negotiation advances — each is reviewed by the Head of Products.'),

    h2('Flow chart — new prospect entry'),
    image('fc-entry'),
    caption('From opening the form to validation and the Product Catalogue.'),
  ]);
}

// ===================================================================
// DOC 2 — CEO / MD profile
// ===================================================================
async function doc2() {
  await save('Contact-Group-Profile-CEO-MD.docx', [
    ...title('Profile: CEO & MD', 'Features and options for group leadership'),
    h2('Who this is for'),
    P('Chief Executive Officer and Managing Director accounts have a group-wide view across all Contact Group companies. They oversee the pipeline, see total exposure and activity, and can engage on individual prospects.'),

    h2('What you can do'),
    table(['Area', 'Capabilities'], [
      ['Group dashboard', 'Total group exposure, active pipeline value and count, Good to Go count, unread alerts, and recent activity across every company.'],
      ['Full visibility', 'Open any pipeline entry or merchant across all companies — not limited to one company’s book.'],
      ['Express interest', 'Flag a prospect as a potential client to join the client visit; the responsible RM is notified to coordinate before the visit.'],
      ['Master Ledger', 'Search all merchants group-wide before approaching, to avoid duplicate outreach.'],
      ['Good to Go list', 'See stagnant merchants and inactive entries available for re-engagement.'],
      ['Notifications', 'Receive a new-prospect alert whenever any entry is created.'],
    ], [28, 72]),

    h2('Notifications you receive'),
    bullet('A “New Prospect” alert for every entry created across the group.'),
    bullet('Coordination notes when an RM responds to your interest flag.'),

    h2('Step by step — review & engage'),
    step(1, 'Sign in to reach the group-wide dashboard.'),
    step(2, 'Review total exposure, active pipeline and the latest entries.'),
    step(3, 'Open any pipeline entry to read the full details and history.'),
    step(4, 'If you want to join the client visit, click “I’m interested — flag as potential client”. The RM is notified to coordinate with you before the visit date.'),
    step(5, 'Use the Master Ledger to check existing relationships across companies.'),

    callout('CEO/MD accounts focus on oversight and engagement. Validation, approvals and list management belong to the Head of Products and the Administrator.'),

    h2('Flow chart — access & roles'),
    image('fc-access'),
    caption('How each user reaches their role-specific dashboard.'),
  ]);
}

// ===================================================================
// DOC 3 — Head of Products profile
// ===================================================================
async function doc3() {
  await save('Contact-Group-Profile-Head-of-Products.docx', [
    ...title('Profile: Head of Products', 'Features and options for the HoP — validation, approvals & list governance'),
    h2('Who this is for'),
    P('The Head of Products (HoP) is the governance gate of the platform. Every new entry passes through HoP validation, and all extensions, done deals, edits, deletions and late entries require HoP approval. The HoP also maintains the managed reference lists.'),

    h2('What you can do'),
    table(['Area', 'Capabilities'], [
      ['Validate new entries', 'Approve an entry (→ First Meeting), or return it to the RM — either with the preset “please choose prospect name”, or with a required free-text comment.'],
      ['Approvals', 'Approve or reject extension requests, Done Deals (which convert to a merchant), edit requests, deletion requests, and late entries.'],
      ['Comments', 'Add comments to any entry; the full validation/comment history is preserved.'],
      ['Manage lists', 'Add or delete industries, products and Egypt-source companies in Admin & Lists; every dropdown updates instantly.'],
      ['Full visibility', 'See all pipeline entries and merchants across the group.'],
    ], [30, 70]),

    h2('Validating a new entry'),
    P('Open a “Pending HoP — Validation” entry and review the whole case (prospect, whether it was found in the directory, products, contact details and value). Then choose one of:'),
    bullet('', [run('Approve — case validated', { bold: true, color: '15803D' }), run('  → the entry becomes “First Meeting” and the RM continues.', { color: SOFT })]),
    bullet('', [run('Return — “please choose prospect name”', { bold: true, color: 'B91C1C' }), run('  → use this when the RM typed a name as “Not included” but the company actually exists in the directory. The entry returns to the RM to re-pick it.', { color: SOFT })]),
    bullet('', [run('Return to RM (with comment)', { bold: true, color: 'B91C1C' }), run('  → for any other issue; a comment is mandatory and is shown to the RM.', { color: SOFT })]),

    h2('Other approvals'),
    table(['Request', 'HoP decision'], [
      ['Extension', 'Approve (moves to Negotiation C2) or reject (closes the entry).'],
      ['Done Deal', 'Approve (creates a merchant in the Master Ledger with a new code) or reject (returns to Negotiation).'],
      ['Edit', 'Approve (applies the changes) or reject (keeps the original).'],
      ['Delete', 'Approve (permanent removal) or reject (keeps the entry).'],
      ['Late entry', 'Approve or reject an entry created after the visit date.'],
    ], [26, 74]),

    h2('Step by step — validate & govern'),
    step(1, 'Open a pending entry from the dashboard or Notifications.'),
    step(2, 'Review the case; check the “in directory / not in directory” flag.'),
    step(3, 'Approve, or Return with the preset name comment, or Return with your own comment.'),
    step(4, 'Handle extension / done-deal / edit / delete / late-entry requests with the matching Approve / Reject buttons.'),
    step(5, 'Keep the Industries, Products and Egypt-source lists current in Admin & Lists.'),

    h2('Flow chart — Head of Products validation'),
    image('fc-validation'),
    caption('Approve, return for name correction, or return with a comment.'),
  ]);
}

// ===================================================================
// DOC 4 — Entry lifecycle (to Good to Go), with extensions & approvals
// ===================================================================
async function doc4() {
  await save('Contact-Group-Entry-Lifecycle.docx', [
    ...title('New Entry Lifecycle', 'From creation, through extensions and approvals, to conversion or the Good to Go list'),
    h2('Overview'),
    P('A prospect entry travels through validation and the negotiation stages. It ends either as a converted merchant in the Master Ledger, on the Good to Go list (if it goes stale), or Closed – Lost. The Head of Products approves the key transitions.'),

    h2('Stages & statuses'),
    table(['Status', 'Meaning'], [
      ['Pending HoP — Validation', 'Just created; awaiting Head of Products validation.'],
      ['Returned to RM', 'HoP returned it with a comment; RM fixes and resubmits.'],
      ['First Meeting', 'Validated; initial engagement.'],
      ['Negotiation / C1 / C2', 'Active negotiation rounds.'],
      ['Pending HoP — Extend', 'Extension requested; awaiting approval.'],
      ['Pending HoP — Done Deal', 'Deal submitted with contract; awaiting approval.'],
      ['Done Deal / Converted', 'Approved; a merchant is created in the Master Ledger.'],
      ['Good to Go', 'No activity within the window; released for group-wide re-engagement.'],
      ['Closed – Lost', 'Negotiation ended without a deal.'],
    ], [34, 66]),

    h2('1. Creation & validation'),
    step(1, 'An employee/RM submits the entry; leadership and the Administrator are notified.'),
    step(2, 'Head of Products validates: Approve → First Meeting, or Return (with comment) → Returned to RM.'),
    step(3, 'If returned, the RM corrects it and resubmits for validation.'),
    image('fc-entry'),
    caption('New prospect entry and routing to validation.'),

    h2('2. Negotiation & extensions'),
    P('The RM moves the entry through First Meeting → Negotiation → Negotiation C1 → Negotiation C2. If more time is needed:'),
    step(1, 'The RM submits an Extension request with a reason (and optional document).'),
    step(2, 'The entry locks as “Pending HoP — Extend”.'),
    step(3, 'The Head of Products approves (→ Negotiation C2) or rejects (closes the entry).'),

    h2('3. Closing the deal'),
    step(1, 'The RM submits a Done Deal with the sold products and a signed contract.'),
    step(2, 'The entry locks as “Pending HoP — Done Deal”.'),
    step(3, 'On approval, a new merchant is created in the Master Ledger with an automatic code (e.g. FACT-005).'),

    h2('4. Good to Go'),
    P('If an entry sees no update within its lifecycle window, it automatically moves to the Good to Go list and MD/CEO are notified. Any RM across the group may then request to re-engage it.'),

    h2('Flow chart — deal lifecycle'),
    image('fc-lifecycle'),
    caption('Negotiation outcomes: extend, done deal (→ merchant), Good to Go, or lost.'),

    h2('Approvals summary'),
    table(['Action', 'Requested by', 'Approved by', 'Result'], [
      ['Validation', 'Auto on create', 'Head of Products', 'First Meeting / Returned'],
      ['Extension', 'RM', 'Head of Products', 'Negotiation C2 / Closed'],
      ['Done Deal', 'RM', 'Head of Products', 'Merchant created'],
      ['Edit', 'RM', 'Head of Products', 'Changes applied / kept'],
      ['Delete', 'RM', 'Head of Products', 'Removed / kept'],
    ], [22, 22, 26, 30]),
  ]);
}

// ===================================================================
// DOC 5 — IT go-live & integrations
// ===================================================================
async function doc5() {
  await save('Contact-Group-IT-GoLive-and-Integrations.docx', [
    ...title('IT Go-Live & Integrations Guide', 'Hosting on Contact servers, email notifications, and the client-data API'),
    h2('1. What the application is'),
    table(['Component', 'Detail'], [
      ['Frontend', 'Single-page application (HTML/CSS/JavaScript), served as static files.'],
      ['Backend', 'Node.js 18+ with Express; REST API; bcrypt password hashing; httpOnly session cookies.'],
      ['Data store', 'JSON file (data/store.json), auto-seeded on first run. Recommend migrating to a managed database for production.'],
      ['Email', 'Nodemailer; sends admin alerts via SMTP when configured.'],
      ['Port', 'Listens on PORT (default 3000).'],
    ], [26, 74]),

    h2('2. Steps for the IT team to go live on Contact servers'),
    step(1, 'Provision a server (Windows Server or Linux) on the Contact network with outbound internet access for the company-data API.'),
    step(2, 'Install Node.js 18 LTS or later.'),
    step(3, 'Copy the application folder (the “app” directory) to the server.'),
    step(4, 'Install production dependencies: run “npm install --omit=dev” in the app folder.'),
    step(5, 'Set the environment variables (see section 5), especially the SMTP settings and a strong session configuration.'),
    step(6, 'Run the app as a managed service so it restarts automatically: PM2 (cross-platform), a Windows Service (e.g. via NSSM), or systemd on Linux.'),
    step(7, 'Put it behind a reverse proxy (IIS, nginx or Apache) terminating HTTPS with a Contact TLS certificate.'),
    step(8, 'Create an internal DNS record / subdomain, e.g. pipeline.contact.eg, pointing to the proxy.'),
    step(9, 'Open the required firewall ports (443 inbound to the proxy; outbound 443 to the company-data API and the mail relay).'),
    step(10, 'Configure scheduled backups of data/store.json (or the database if migrated).'),
    step(11, 'Smoke-test: load the site over HTTPS, sign in, create a test entry, confirm the admin email arrives, then remove the test entry.'),

    callout('Production hardening: change all default passwords (currently Contact@123), enforce HTTPS only, set secure session cookies, add rate limiting on the login endpoint, and restrict who can register accounts.'),

    h2('3. Email notification integration'),
    P('Admin alerts (and any future email notifications) are sent through standard SMTP. The application already contains the sending logic — IT only needs to provide credentials via environment variables. Until they are set, alerts remain in-app and are logged (no email leaves the server).'),
    table(['Variable', 'Purpose / example'], [
      ['SMTP_HOST', 'Contact mail server / relay host, e.g. smtp.office365.com or an internal Exchange relay.'],
      ['SMTP_PORT', '587 (STARTTLS) or 465 (SSL).'],
      ['SMTP_SECURE', '“true” for port 465, otherwise false.'],
      ['SMTP_USER / SMTP_PASS', 'Mailbox or relay credentials (a dedicated service account is recommended).'],
      ['SMTP_FROM', 'Sender, e.g. “Contact Pipeline <no-reply@contact.eg>”.'],
      ['ADMIN_EMAIL', 'Recipient of admin alerts (default doaa.orfy@contact.eg).'],
    ], [26, 74]),
    bullet('If using an internal relay, allow the application server’s IP to relay without authentication, or use a service account.'),
    bullet('Add the sender address to SPF / allowed senders so messages are not blocked.'),

    h2('4. Client-data integration (prospect directory)'),
    P('From the three sources shared, the platform integrates OpenCorporates — the only one offering a free, programmatic reconciliation endpoint with an Egypt jurisdiction filter (the other two require paid datasets or commercial API keys).'),
    table(['Item', 'Detail'], [
      ['Website used', 'opencorporates.com'],
      ['API used', 'OpenCorporates Reconciliation API (Egypt jurisdiction).'],
      ['Endpoint', 'https://opencorporates.com/reconcile/eg?query=<company name>'],
      ['Auth', 'Optional API token via env var OPENCORPORATES_API_TOKEN (recommended for production volume / higher rate limits).'],
      ['Behaviour', 'The server queries this API as the user types a prospect name; results are Egypt-scoped and ranked.'],
      ['Fallback', 'If the API is unavailable or unconfigured, a curated Egyptian-companies list is used so prospect search always works; the user can also choose “Not included” and type the name.'],
    ], [24, 76]),
    P('Sources considered (shared by the business):', { after: 40 }),
    bullet('opencorporates.com — Reconciliation API (selected).'),
    bullet('companiesdata.cloud (Egypt company data) — paid dataset; can be substituted later.'),
    bullet('developer.willro.com (business-info API) — commercial API key required; can be substituted later.'),
    callout('To raise limits or switch provider: obtain an OpenCorporates API token and set OPENCORPORATES_API_TOKEN, or swap the lookup function in server.js for companiesdata.cloud / willro using their API key.'),

    h2('5. Environment variables (summary)'),
    table(['Variable', 'Default / note'], [
      ['PORT', '3000'],
      ['ADMIN_EMAIL', 'doaa.orfy@contact.eg'],
      ['SMTP_HOST / PORT / SECURE / USER / PASS / FROM', 'Email delivery (unset = in-app + log only).'],
      ['OPENCORPORATES_API_TOKEN', 'Optional; enables/expands live company lookup.'],
    ], [40, 60]),
  ]);
}

// ===================================================================
// DOC 6 — Full platform guide (the shared HTML) as Word
// ===================================================================
async function doc6() {
  await save('Contact-Group-Platform-Guide.docx', [
    ...title('Contact Group · Platform Flow Charts & User Guide', 'All features and journeys — complete reference'),
    callout('This is the Word version of the shared guide. It covers the platform overview, roles, login, all flow charts, a screen-by-screen feature guide, per-role journeys, and the configuration reference.'),

    h2('1. Platform overview'),
    P('The Contact Group platform is a shared, multi-user system for managing prospects and the sales pipeline across all group companies (Factoring, Leasing, Mortgage, Credit, Insurance, Contact Auto). Every user signs in with their own account; data is shared in real time, so when one person adds a prospect the relevant people are notified and can act on it.'),
    bullet('Prospects & pipeline — capture a prospect, route it through Head of Products validation, then move it through the negotiation stages to a closed deal (which becomes a merchant in the Master Ledger).'),
    bullet('Governance — the Head of Products validates every new entry; extensions, done deals, edits and deletions require approval; the Administrator is alerted on every submitted request.'),
    bullet('Controlled reference data — prospect names come from the Egyptian companies directory; industry and product lists are centrally managed so every dropdown stays consistent.'),

    h2('2. Roles & access'),
    table(['Role', 'What they can do'], [
      ['Employee / RM', 'Sign in, insert pipeline entries, manage their own entries, progress deals, request extensions/done deals/edits/deletions, browse reference data. All directory employees can insert entries.'],
      ['Head of Products', 'Validate new entries (approve/return), approve/reject extensions, done deals, edits, deletions and late entries, and edit the managed lists.'],
      ['CEO / MD', 'Group-wide dashboards and visibility; flag interest to join a client visit.'],
      ['Administrator', 'Edit every managed list, add accounts, and receive an alert + email on every submitted request (account: doaa.orfy).'],
    ], [26, 74]),

    h2('3. Getting started — login & registration'),
    h4('Sign in'),
    step(1, 'On the Sign In tab, enter your username (email local-part, e.g. john.saad) and password.'),
    step(2, 'Click Sign In to reach your role dashboard.'),
    h4('Register'),
    step(1, 'Click the Register tab.'),
    step(2, 'Enter full name, username (min 3 chars), email, department, job title.'),
    step(3, 'Set a password (8+ chars, one uppercase, one number) and confirm.'),
    step(4, 'Click Create Account.'),
    callout('Demo accounts (password Contact@123): doaa.orfy (Admin), d.elsayed (Head of Products), h.mansour (CEO), y.fahmy (RM), john.saad & adel.kamel (Employees).'),

    h2('4. Flow charts'),
    h3('4.1 Access & roles'), image('fc-access'),
    h3('4.2 New prospect entry'), image('fc-entry'),
    h3('4.3 Head of Products validation'), image('fc-validation'),
    h3('4.4 Deal lifecycle'), image('fc-lifecycle'),
    h3('4.5 Admin, lists & alerts'), image('fc-admin'),

    h2('5. Feature guide (screen by screen)'),
    h3('Dashboard'), P('Role-aware home screen with quick access to a new entry and the items relevant to your role.'),
    h3('Notifications'), P('Email-style alerts. New-prospect alerts go to the leadership list; validation requests to the HoP; approvals/returns back to the entrant; the Administrator is alerted on every request.'),
    h3('New Entry'), P('The prospect capture form — prospect directory dropdown (or “Not included”), industry, products multi-select, Commercial Register, contact details, value, dates, attendees, summary.'),
    h3('Pipeline & Pipeline Entry'), P('The list of entries and the detail page (details, lifecycle, attachments, comment/validation history, and your available actions).'),
    h3('Master Ledger & Client profile'), P('All merchants across the group, searchable; send an alignment request to another company’s RM.'),
    h3('Good to Go list'), P('Stagnant merchants and inactive entries released for group-wide re-engagement.'),
    h3('Companies & Product Catalogue'), P('Group companies and the full product list; the catalogue is also where an RM lands after saving an entry.'),
    h3('Bundles'), P('Empty by design; cross-sell is driven from the Product Catalogue.'),
    h3('Admin & Lists'), P('Control centre for Admin/HoP: Industries, Products, Egypt company source, Notification recipients, Codes & access, and (Admin) the Admin email log.'),

    h2('6. Step-by-step journeys'),
    h3('Employee / RM — submit a new prospect'),
    step(1, 'New Entry → pick the prospect from the directory, or “Not included” + type it.'),
    step(2, 'Select industry, tick products, add Commercial Register and contact details.'),
    step(3, 'Set company, value, dates, attendees, summary.'),
    step(4, 'Save & notify leadership; you land on the Product Catalogue.'),
    step(5, 'If returned, fix the comment and resubmit for validation.'),
    h3('Head of Products — validate & govern'),
    step(1, 'Open a Pending HoP — Validation entry; review the whole case.'),
    step(2, 'Approve, return “please choose prospect name”, or return with a comment.'),
    step(3, 'Handle extension/done-deal/edit/delete/late-entry approvals.'),
    step(4, 'Maintain the managed lists in Admin & Lists.'),
    h3('CEO / MD — oversight'),
    step(1, 'Review the group-wide dashboard.'),
    step(2, 'Open entries; flag interest to join a visit.'),
    step(3, 'Use the Master Ledger for group-wide relationships.'),
    h3('Administrator — configure & monitor'),
    step(1, 'Open Admin & Lists.'),
    step(2, 'Edit Industries / Products / Egypt source; dropdowns update instantly.'),
    step(3, 'Manage Notification recipients (adding one creates a login).'),
    step(4, 'Review the Admin email log of submitted requests.'),

    h2('7. Administration & configuration'),
    h3('Admin email alerts'), P('Every submitted request alerts the Administrator in-app and as a logged email to doaa.orfy@contact.eg (Admin & Lists → Admin email log). Real delivery turns on once SMTP_* environment variables are set.'),
    image('fc-admin'),
    h3('Managed lists & the Egypt source'), P('Industries, products and the Egypt fallback list are edited in Admin & Lists. The prospect dropdown first queries the live OpenCorporates Egypt API, falling back to the curated list so search always works.'),

    h2('8. Reference data & credentials'),
    h4('Industries'), P('ICT/Software/Digital · Tourism/Hospitality/Travel · Renewable Energy & Green · Manufacturing & Export-Led · Healthcare/MedTech · Construction/Real Estate/Infrastructure · Agribusiness & Food Processing · Food & beverage · FMCG · Automotive.'),
    h4('Products'), P('Reverse / Normal / Consumer Factoring · Mortgage Finance · Equity Finance · Portfolio acquisition · Leasing Finance (Machinery / Real estate / Fleet) · Sale and lease back · Contact Now · Contact Credit · Insurance · Contact Auto. (Credit Card removed.)'),
    h4('Demo credentials — password Contact@123'),
    table(['Username', 'Name', 'Role'], [
      ['doaa.orfy', 'Doaa Orfy', 'Administrator'],
      ['d.elsayed', 'Dina El Sayed', 'Head of Products'],
      ['h.mansour', 'Hala Mansour', 'CEO'],
      ['k.hatem', 'Karim Hatem', 'MD'],
      ['y.fahmy', 'Youssef Fahmy', 'RM (Factoring)'],
      ['john.saad', 'John Saad', 'Employee (C-Level)'],
      ['adel.kamel', 'Adel Kamel', 'Employee (Branch)'],
    ], [30, 36, 34]),
  ]);
}

(async () => {
  await doc1(); await doc2(); await doc3(); await doc4(); await doc5(); await doc6();
  console.log('ALL DOCS DONE');
})().catch(e => { console.error('ERROR', e); process.exit(1); });
