// Generates two more Word deliverables: the Go-Live Runbook and the Scenarios & Journeys catalogue.
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, Footer, PageNumber } = require('docx');

const DESK = 'C:/Users/do.orfy/Desktop';
const IMG = path.join(__dirname, 'docimg');
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE', GREEN = '15803D', RED = 'B91C1C', ORANGE = 'C2410C';
const imgDims = { 'fc-access':[1520,720], 'fc-entry':[1520,940], 'fc-validation':[1520,860], 'fc-lifecycle':[1520,840], 'fc-admin':[1520,600] };

const run = (t, o = {}) => new TextRun({ text: t, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: 'Segoe UI' });
const P = (t, o = {}) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: o.after != null ? o.after : 120, before: o.before || 0, line: 264 } });
const title = (t, sub) => [
  new Paragraph({ children: [run(t, { size: 44, bold: true, color: PRIMARY })], spacing: { after: 60 } }),
  ...(sub ? [new Paragraph({ children: [run(sub, { size: 26, color: MUTED })], spacing: { after: 80 } })] : []),
  new Paragraph({ children: [run('Contact Group · Client & Pipeline Platform   ·   June 2026', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 240 } }),
];
const h2 = (t) => new Paragraph({ children: [run(t, { size: 29, bold: true, color: PRIMARY })], spacing: { before: 280, after: 110 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const h3 = (t, color) => new Paragraph({ children: [run(t, { size: 24, bold: true, color: color || INK })], spacing: { before: 180, after: 70 } });
const h4 = (t) => new Paragraph({ children: [run(t.toUpperCase(), { size: 18, bold: true, color: SOFT })], spacing: { before: 120, after: 50 } });
const bullet = (t, runs) => new Paragraph({ children: runs || [run(t, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 50, line: 260 } });
const step = (n, runs) => new Paragraph({ children: [run(n + '.  ', { bold: true, color: PRIMARY }), ...(Array.isArray(runs) ? runs : [run(runs, { color: SOFT })])], spacing: { after: 60, line: 260 }, indent: { left: 360, hanging: 360 } });
const callout = (t, bg, bc, tc) => new Paragraph({ children: [run(t, { color: tc || '1E3A8A', size: 20 })], shading: { fill: bg || 'EFF4FF' }, border: { left: { color: bc || PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 90, after: 130 }, indent: { left: 120 } });
function cell(t, o = {}) {
  return new TableCell({ children: [new Paragraph({ children: Array.isArray(t) ? t : [run(t, { size: o.size || 18, bold: o.bold, color: o.color || (o.header ? PRIMARY : SOFT) })], spacing: { after: 20, line: 248 } })], shading: o.header ? { fill: HEADBG } : undefined, width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 } });
}
function table(headers, rows, widths) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: LINE };
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b },
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: widths && widths[i] })) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths && widths[i] })) }))] });
}
function image(name) { const [w, h] = imgDims[name]; const dw = 600, dh = Math.round(dw * h / w); return new Paragraph({ children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(IMG, name + '.png')), transformation: { width: dw, height: dh } })], alignment: AlignmentType.CENTER, spacing: { before: 110, after: 60 } }); }
const cap = (t) => new Paragraph({ children: [run(t, { size: 17, italics: true, color: MUTED })], alignment: AlignmentType.CENTER, spacing: { after: 150 } });

function buildDoc(children) {
  return new Document({ styles: { default: { document: { run: { font: 'Segoe UI', size: 21, color: INK } } } },
    sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Client & Pipeline Platform          Page ', { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED })] })] }) }, children }] });
}
async function save(file, children) { const buf = await Packer.toBuffer(buildDoc(children)); fs.writeFileSync(path.join(DESK, file), buf); console.log('wrote', file, '(' + buf.length + ' bytes)'); }

// helper: a scenario block
function scenario(id, name, actor, trigger, steps, result, opts = {}) {
  const out = [
    new Paragraph({ children: [run(id + '. ' + name, { size: 23, bold: true, color: opts.proposed ? ORANGE : INK })], spacing: { before: 170, after: 40 } }),
    new Paragraph({ children: [run('Actor: ', { bold: true, size: 19, color: SOFT }), run(actor + '     ', { size: 19, color: SOFT }), run('Trigger: ', { bold: true, size: 19, color: SOFT }), run(trigger, { size: 19, color: SOFT })], spacing: { after: 60 } }),
  ];
  steps.forEach((s, i) => out.push(step(i + 1, s)));
  out.push(new Paragraph({ children: [run('Result: ', { bold: true, color: GREEN }), run(result, { color: SOFT })], spacing: { after: 80, before: 30 } }));
  return out;
}

// ===================================================================
// DOC A — Go-Live Runbook & Integrations (ordered)
// ===================================================================
async function runbook() {
  await save('Contact-Group-GoLive-Runbook.docx', [
    ...title('Go-Live Runbook & Integrations', 'Ordered steps to deploy the platform on Contact servers and connect every integration'),
    callout('Follow the phases in order. Phases 0–2 stand the app up; Phase 3 connects the integrations (email, company data, lending platform); Phases 4–9 productionise it; Phases 10–11 are go-live and rollback. Steps marked “Dev” require a small development effort by the IT/integration team.'),

    h2('Phase 0 — Prerequisites & decisions'),
    step(1, 'Approve a hosting server on the Contact network: Windows Server or Linux, 2 vCPU / 4 GB RAM minimum, with outbound HTTPS to the internet (for the company-data API) and to the mail relay.'),
    step(2, 'Decide the internal address (DNS name), e.g. pipeline.contact.eg, and obtain a TLS certificate for it (internal CA or public).'),
    step(3, 'Obtain mail-relay details from IT: SMTP host, port, and either an allow-listed sending IP or a service-account mailbox + password.'),
    step(4, 'Obtain an OpenCorporates API token (for the prospect/company lookup) — optional but recommended for production volume.'),
    step(5, 'Identify the lending platform(s) to integrate and a technical contact / API owner on that side.'),

    h2('Phase 1 — Prepare the server'),
    step(1, 'Install Node.js 18 LTS (or later) and confirm with: node -v'),
    step(2, 'Create a dedicated service account / user to run the application (least privilege).'),
    step(3, 'Create the application directory, e.g. C:\\Apps\\contact-pipeline (Windows) or /opt/contact-pipeline (Linux).'),

    h2('Phase 2 — Deploy the application'),
    step(1, 'Copy the application folder (the “app” directory: server.js, db.js, seed.js, public/, package.json) to the server.'),
    step(2, 'In that folder run: npm install --omit=dev'),
    step(3, 'Create the environment configuration (see the Environment Variables table at the end). At minimum set PORT and the SMTP_* variables.'),
    step(4, 'Start once to verify: node server.js — confirm it prints the running message and that http://localhost:3000 responds locally.'),
    step(5, 'Stop the test run; it will be managed as a service in Phase 4.'),

    h2('Phase 3 — Integrations'),
    h3('3A · Email notifications (SMTP)'),
    step(1, 'Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM in the environment (see table).'),
    step(2, 'If using an internal relay, ask IT to allow the app server’s IP to relay, or use the service-account credentials.'),
    step(3, 'Add the SMTP_FROM address to SPF / allowed senders so messages are not blocked.'),
    step(4, 'Restart the app; on boot it logs “SMTP configured”. Submit a test request and confirm the admin email arrives at ADMIN_EMAIL (doaa.orfy@contact.eg).'),
    h3('3B · Company-data API (prospect directory)'),
    step(1, 'Set OPENCORPORATES_API_TOKEN if a token was obtained (raises rate limits).'),
    step(2, 'Confirm outbound HTTPS to opencorporates.com is open on the firewall.'),
    step(3, 'In the app, open New Entry and type a company name — verify Egyptian results appear (the curated fallback list is used automatically if the API is unavailable).'),
    callout('Source used: opencorporates.com — OpenCorporates Reconciliation API (Egypt), endpoint https://opencorporates.com/reconcile/eg?query=<name>. To switch to companiesdata.cloud or developer.willro.com later, replace the lookup function in server.js with their API + key.', 'EFF4FF', PRIMARY),
    h3('3C · Lending-platform integration (proposed — keyed on Commercial Register)'),
    P('This connects the platform to any Contact lending system so that no client can progress in lending without existing on the portal. The integration team implements the contract below; the data key throughout is the Commercial Register number.'),
    step(1, '[Dev] On the lending side, when a lending request is created, call the platform “lookup by Commercial Register” check (or have the platform expose a read API the lending system queries).'),
    step(2, '[Dev] If the company is NOT found on the platform, the system sends an automated email to: the initiator of the lending request, the initiator’s manager (to insert the client on the portal), and the Head of Products (to follow up).'),
    step(3, '[Dev] At the lending “investigation” step, enforce a gate: if the client is still not on the portal, the step cannot proceed.'),
    step(4, '[Dev] Allow an override of that gate only with Head of Products approval. Record the approver.'),
    step(5, '[Dev] If an override is used (proceeding without inserting), flag the deal so that 50% of its profitability is NOT credited to the initiator.'),
    step(6, '[Dev] When the integrated systems confirm the client is active, the platform reads this, adds the client to the Merchants list automatically, and notifies all stakeholders that the merchant list was updated — flagged as a system-originated update.'),
    P('Integration data contract (suggested):', { before: 60, after: 40 }),
    table(['Event / call', 'Direction', 'Key fields'], [
      ['Lookup client', 'Lending → Platform', 'commercialRegister → {exists, status, prospectId}'],
      ['Client-missing alert', 'Platform → Email', 'initiator, manager, HoP; company name + CR'],
      ['Investigation gate', 'Lending (internal)', 'block unless exists==true OR hopOverride==true'],
      ['Override record', 'Lending → Platform', 'commercialRegister, approver(HoP), profitabilityFlag=50%'],
      ['Client-active sync', 'Core systems → Platform', 'commercialRegister, status=Active → add to merchants + notify'],
    ], [30, 28, 42]),

    h2('Phase 4 — Run as a managed service'),
    step(1, 'Choose a process manager: PM2 (cross-platform), a Windows Service via NSSM, or systemd on Linux.'),
    step(2, 'Configure it to start node server.js on boot, restart on crash, and load the environment variables.'),
    step(3, 'Start the service and confirm it survives a reboot.'),

    h2('Phase 5 — Reverse proxy + HTTPS'),
    step(1, 'Install/configure a reverse proxy (IIS with ARR, nginx, or Apache).'),
    step(2, 'Proxy the public hostname to http://localhost:3000.'),
    step(3, 'Bind the TLS certificate and force HTTPS (redirect 80 → 443).'),

    h2('Phase 6 — DNS'),
    step(1, 'Create the internal DNS A/CNAME record (e.g. pipeline.contact.eg) pointing to the reverse proxy.'),
    step(2, 'Confirm the name resolves from a user workstation.'),

    h2('Phase 7 — Firewall'),
    step(1, 'Allow inbound 443 from the user network to the reverse proxy.'),
    step(2, 'Allow outbound 443 from the app server to opencorporates.com and to the mail relay.'),

    h2('Phase 8 — Data persistence & backups'),
    step(1, 'For production, migrate the data store from the bundled JSON file to a managed database (e.g. PostgreSQL) — recommended for concurrency and reporting.'),
    step(2, 'Until then, schedule regular backups of data/store.json.'),
    step(3, 'Document a restore procedure and test it once.'),

    h2('Phase 9 — Security hardening'),
    bullet('Change all default passwords (currently Contact@123) and require a reset on first login.'),
    bullet('Enforce HTTPS only; set secure, httpOnly session cookies.'),
    bullet('Add rate limiting on the login endpoint.'),
    bullet('Restrict who can self-register (or disable registration and provision accounts centrally).'),
    bullet('Store SMTP and API secrets in the OS secret store / environment, never in source.'),

    h2('Phase 10 — Go-live testing checklist'),
    step(1, 'Load the site over HTTPS at the DNS name; sign in as Admin, HoP and an Employee.'),
    step(2, 'Create a test entry (directory pick and “Not included”); confirm leadership + admin notifications.'),
    step(3, 'As HoP, approve and also return an entry; confirm the RM is notified.'),
    step(4, 'Confirm the admin email is delivered to a real mailbox (Phase 3A).'),
    step(5, 'Confirm prospect lookup returns Egyptian companies (Phase 3B).'),
    step(6, 'If the lending integration is live, run one end-to-end lending scenario (Phase 3C).'),
    step(7, 'Remove test data; confirm backups are running.'),

    h2('Phase 11 — Cutover & rollback'),
    step(1, 'Announce the URL and credentials policy to users.'),
    step(2, 'Keep the previous testing link available for a short overlap.'),
    step(3, 'Rollback plan: if a blocking issue appears, stop the service, restore the last good backup, and revert DNS if needed.'),

    h2('Appendix — Environment variables'),
    table(['Variable', 'Required', 'Purpose / example'], [
      ['PORT', 'No', 'Listen port (default 3000).'],
      ['ADMIN_EMAIL', 'No', 'Admin alert recipient (default doaa.orfy@contact.eg).'],
      ['SMTP_HOST', 'For email', 'Mail relay host, e.g. smtp.office365.com.'],
      ['SMTP_PORT', 'For email', '587 (STARTTLS) or 465 (SSL).'],
      ['SMTP_SECURE', 'For email', '“true” for 465, else false.'],
      ['SMTP_USER / SMTP_PASS', 'For email', 'Service-account credentials.'],
      ['SMTP_FROM', 'For email', '“Contact Pipeline <no-reply@contact.eg>”.'],
      ['OPENCORPORATES_API_TOKEN', 'Optional', 'Enables/raises live company lookup limits.'],
    ], [30, 16, 54]),
  ]);
}

// ===================================================================
// DOC B — Scenarios & Journeys
// ===================================================================
async function scenarios() {
  const children = [
    ...title('Scenarios & Journeys', 'Every scenario available on the platform, with actor, trigger, steps and outcome'),
    callout('This catalogue lists each scenario the platform supports today, grouped by area, followed by the proposed lending-integration scenarios (Phase 2). Roles: Employee/RM, Head of Products (HoP), CEO/MD, Administrator.'),

    h2('A. Access'),
    ...scenario('A1', 'Register a new account', 'Any employee', 'First-time use',
      ['Open the platform; click the Register tab.', 'Enter name, username (min 3), email, department, job title.', 'Set a password (8+ chars, 1 uppercase, 1 number) and confirm.', 'Click Create Account.'],
      'Account is created and the user is signed in to their dashboard.'),
    ...scenario('A2', 'Sign in', 'Any user', 'Returning user',
      ['On the Sign In tab, enter username (email local-part) and password.', 'Click Sign In.'],
      'User lands on their role-specific dashboard.'),
    ...scenario('A3', 'Sign out / switch user', 'Any user', 'End of session',
      ['Click Sign out (sidebar) or the user chip (top-right).'],
      'Session ends and the login screen is shown.'),

    h2('B. Creating an entry'),
    ...scenario('B1', 'New entry — prospect from the directory', 'Employee / RM', 'New prospect identified',
      ['Click New Entry.', 'Type the company name and pick it from the Egypt directory dropdown.', 'Select industry, tick products, confirm/enter Commercial Register and contact details.', 'Set company, value, dates, attendees and summary.', 'Click Save & notify leadership.'],
      'Entry saved as “Pending HoP — Validation”; leadership (74) + Admin notified; user taken to the Product Catalogue.'),
    ...scenario('B2', 'New entry — prospect “Not included”', 'Employee / RM', 'Company not in the directory',
      ['Click New Entry; in Prospect name choose “Not included”.', 'Type the prospect’s legal name in the free-text field.', 'Complete the remaining fields and Save.'],
      'Entry saved with an in-directory = No flag for the HoP to verify; same notifications as B1.'),
    ...scenario('B3', 'Late entry (visit already passed)', 'Employee / RM', 'Visit date is in the past',
      ['Create the entry with a past visit date.', 'Provide the closure date, reason, and minutes or a call report.', 'Save.'],
      'Entry is captured with late-entry details for HoP review.'),

    h2('C. Validation (Head of Products)'),
    ...scenario('C1', 'Approve a new entry', 'Head of Products', 'Entry is Pending Validation',
      ['Open the entry from the dashboard or Notifications.', 'Review the whole case.', 'Click “Approve — case validated”.'],
      'Status becomes First Meeting; the entrant is notified.'),
    ...scenario('C2', 'Return — “please choose prospect name”', 'Head of Products', 'A “Not included” prospect is actually in the directory',
      ['Open the entry.', 'Click “Return — please choose prospect name”.'],
      'Status becomes Returned to RM with the preset comment; entrant notified to re-pick from the directory.'),
    ...scenario('C3', 'Return with a comment', 'Head of Products', 'Any other issue with the entry',
      ['Open the entry; click “Return to RM (with comment)”.', 'Type the required reason.'],
      'Status becomes Returned to RM with the comment; entrant notified.'),
    ...scenario('C4', 'Resubmit after a return', 'Employee / RM', 'Entry was returned',
      ['Open the returned entry; read the comment.', 'Fix the issue (e.g. re-pick the prospect).', 'Click “Resubmit for validation”.'],
      'Status returns to Pending Validation; HoP notified.'),

    h2('D. Negotiation lifecycle'),
    ...scenario('D1', 'Advance negotiation stages', 'Employee / RM', 'Deal progresses',
      ['Open your entry.', 'Use “Update status” to move First Meeting → Negotiation → C1 → C2.'],
      'Stage updated; history and last-update recorded.'),
    ...scenario('D2', 'Request an extension', 'Employee / RM → HoP', 'More time needed',
      ['Choose the Extend action; enter a reason (and optional document).', 'Submit.', 'HoP approves (→ Negotiation C2) or rejects (closes the entry).'],
      'Entry extended or closed per HoP decision; requester notified; Admin alerted.'),
    ...scenario('D3', 'Close a deal (Done Deal)', 'Employee / RM → HoP', 'Deal won',
      ['Submit Done Deal with sold products and the signed contract.', 'Entry locks as Pending HoP — Done Deal.', 'HoP approves.'],
      'A new merchant is created in the Master Ledger with an automatic code; stakeholders notified.'),
    ...scenario('D4', 'Done Deal rejected', 'Head of Products', 'Deal not validated',
      ['HoP reviews the Done Deal and rejects it.'],
      'Entry returns to Negotiation; requester notified.'),
    ...scenario('D5', 'Entry goes stale → Good to Go', 'System / any RM', 'No activity within the window',
      ['The entry is moved to the Good to Go list automatically; MD/CEO notified.', 'Any RM across the group requests to re-engage.'],
      'Entry becomes available for group-wide re-engagement.'),

    h2('E. Edit & delete'),
    ...scenario('E1', 'Request an edit', 'Employee / RM → HoP', 'Details need changing',
      ['Open your entry; click Edit details; change fields; give a reason; submit.', 'HoP approves or rejects.'],
      'Changes applied (or kept) per HoP decision; requester notified; Admin alerted.'),
    ...scenario('E2', 'Request a deletion', 'Employee / RM → HoP', 'Entry should be removed',
      ['Click Request delete; give a reason; submit.', 'HoP approves (permanent removal) or rejects.'],
      'Entry removed or kept per HoP decision; requester notified; Admin alerted.'),

    h2('F. Notifications & oversight'),
    ...scenario('F1', 'New-prospect broadcast', 'System', 'Any new entry saved',
      ['On save, the system notifies all 74 leadership recipients and the HoP.'],
      'Everyone on the distribution list sees the new prospect in their inbox.'),
    ...scenario('F2', 'Admin alert on every request', 'System', 'Any request submitted',
      ['On any submission (entry, extend, done deal, edit, delete, resubmit, alignment) the system alerts the Administrator in-app and logs an email to doaa.orfy@contact.eg.'],
      'Administrator has a complete trail under Admin & Lists → Admin email log.'),
    ...scenario('F3', 'Leadership flags interest', 'CEO / MD', 'Wants to join a client visit',
      ['Open a pipeline entry; click “I’m interested — flag as potential client”.'],
      'The responsible RM is notified to coordinate before the visit.'),

    h2('G. Master Ledger & alignment'),
    ...scenario('G1', 'Search before approaching', 'Any user', 'Considering a prospect',
      ['Open the Master Ledger; search by name / status / company.'],
      'Existing relationships are visible group-wide, avoiding duplicate outreach.'),
    ...scenario('G2', 'Alignment request', 'Employee / RM', 'Another company already owns the client',
      ['Open the client; send an alignment request to its RM.'],
      'That RM is notified to coordinate; the Administrator is alerted.'),

    h2('H. Administration & lists'),
    ...scenario('H1', 'Add / delete an industry', 'Admin / HoP', 'Industry list needs updating',
      ['Open Admin & Lists → Industries; add a new item or delete one.'],
      'The industry dropdown updates everywhere immediately.'),
    ...scenario('H2', 'Add / delete a product', 'Admin / HoP', 'Catalogue change',
      ['Open Admin & Lists → Products; add or delete a product.'],
      'The product list and New-Entry selection update immediately.'),
    ...scenario('H3', 'Extend the Egypt company source', 'Admin / HoP', 'Add a company to the fallback list',
      ['Open Admin & Lists → Egypt company source; add a company.'],
      'The prospect-name fallback list is extended.'),
    ...scenario('H4', 'Add a recipient / login', 'Administrator', 'Onboard a new employee',
      ['Open Admin & Lists → Notification recipients; add name, email, group.'],
      'A login account is created (default password) and the person joins the distribution list.'),
    ...scenario('H5', 'Review the admin email log', 'Administrator', 'Audit submitted requests',
      ['Open Admin & Lists → Admin email log.'],
      'See every request that triggered an admin alert, with delivery status.'),

    h2('I. Reference'),
    ...scenario('I1', 'Browse Product Catalogue / Companies', 'Any user', 'Cross-sell or reference',
      ['Open Product Catalogue or Companies from the sidebar.'],
      'View products (with referral contacts) and group companies.'),
    ...scenario('I2', 'Bundles', 'Any user', 'Open Bundles',
      ['Open the Bundles page.'],
      'Shows an empty state by design; cross-sell is driven from the Product Catalogue.'),

    h2('J. Proposed — lending-platform integration (Phase 2)'),
    P('These scenarios describe the proposed link between the platform and Contact lending systems, keyed on the Commercial Register number. They are not yet enabled; see the Go-Live Runbook, Phase 3C.', { after: 80 }),
  ];
  // proposed scenarios (orange headings)
  [
    scenario('J1', 'Lending request for a client not on the platform', 'Lending system → Platform', 'A lending request is created',
      ['The lending system checks the platform by Commercial Register.', 'No matching entry is found.', 'An automated email is sent to the initiator, the initiator’s manager, and the Head of Products.'],
      'The client-insertion responsibility is assigned and tracked; HoP follows up.', { proposed: true }),
    scenario('J2', 'Investigation gate', 'Lending system', 'Lending reaches the investigation step',
      ['The system checks whether the client now exists on the platform.', 'If not, the investigation step is blocked.'],
      'Lending cannot proceed until the initiator inserts the client on the portal.', { proposed: true }),
    scenario('J3', 'HoP-approved override (with penalty)', 'Head of Products', 'Exceptional need to proceed without inserting',
      ['The HoP approves an override of the investigation gate.', 'The deal is flagged as overridden.'],
      'Lending proceeds, but 50% of the deal’s profitability is not credited to the initiator.', { proposed: true }),
    scenario('J4', 'Automatic merchant sync', 'Core systems → Platform', 'Integrated systems confirm the client is active',
      ['The platform reads the active-client status from the integrated systems.', 'The client is added to the Merchants list automatically.', 'All stakeholders are notified of a system-originated merchant-list update.'],
      'The Merchants list stays complete and in sync, with full notification.', { proposed: true }),
  ].forEach(b => b.forEach(x => children.push(x)));

  children.push(h2('Reference — lifecycle diagram'));
  children.push(image('fc-lifecycle'));
  children.push(cap('The end-to-end deal lifecycle that the scenarios above move through.'));

  await save('Contact-Group-Scenarios-and-Journeys.docx', children);
}

(async () => { await runbook(); await scenarios(); console.log('DONE'); })().catch(e => { console.error('ERR', e); process.exit(1); });
