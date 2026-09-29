// Generates the deployment timeline / plan Word document.
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, Footer, PageNumber } = require('docx');
const DESK = 'C:/Users/do.orfy/Desktop';
const PRIMARY = '1E40AF', INK = '1A2332', SOFT = '4A5568', MUTED = '718096', LINE = 'E2E8F0', HEADBG = 'DBEAFE', GREEN = '15803D', ORANGE = 'C2410C';
const run = (t, o = {}) => new TextRun({ text: t, size: o.size || 21, bold: !!o.bold, italics: !!o.italics, color: o.color || INK, font: 'Segoe UI' });
const P = (t, o = {}) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, o)], spacing: { after: o.after != null ? o.after : 120, line: 264 } });
const title = (t, sub) => [new Paragraph({ children: [run(t, { size: 42, bold: true, color: PRIMARY })], spacing: { after: 60 } }), new Paragraph({ children: [run(sub, { size: 25, color: MUTED })], spacing: { after: 70 } }), new Paragraph({ children: [run('Contact Group · Client & Pipeline Platform   ·   June 2026', { size: 18, color: MUTED })], border: { bottom: { color: PRIMARY, space: 8, style: BorderStyle.SINGLE, size: 18 } }, spacing: { after: 220 } })];
const h2 = (t) => new Paragraph({ children: [run(t, { size: 28, bold: true, color: PRIMARY })], spacing: { before: 260, after: 100 }, border: { bottom: { color: HEADBG, space: 6, style: BorderStyle.SINGLE, size: 14 } } });
const bullet = (t, r) => new Paragraph({ children: r || [run(t, { color: SOFT })], bullet: { level: 0 }, spacing: { after: 50, line: 260 } });
const callout = (t, bg, bc, tc) => new Paragraph({ children: Array.isArray(t) ? t : [run(t, { color: tc || '1E3A8A', size: 20 })], shading: { fill: bg || 'EFF4FF' }, border: { left: { color: bc || PRIMARY, space: 10, style: BorderStyle.SINGLE, size: 24 } }, spacing: { before: 90, after: 130 }, indent: { left: 120 } });
function cell(t, o = {}) { return new TableCell({ children: [new Paragraph({ children: [run(t, { size: 18, bold: o.bold, color: o.color || (o.header ? PRIMARY : SOFT) })], spacing: { after: 20, line: 248 } })], shading: o.header ? { fill: HEADBG } : (o.fill ? { fill: o.fill } : undefined), width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined, margins: { top: 50, bottom: 50, left: 80, right: 80 } }); }
function table(headers, rows, w, lastBold) { const b = { style: BorderStyle.SINGLE, size: 4, color: LINE }; return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b }, rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, bold: true, width: w && w[i] })) }), ...rows.map((r, ri) => new TableRow({ children: r.map((c, i) => cell(c, { width: w && w[i], bold: lastBold && ri === rows.length - 1, fill: lastBold && ri === rows.length - 1 ? 'F1F5F9' : undefined })) }))] }); }

const children = [
  ...title('Deployment Timeline & Plan', 'How long IT needs to take the platform live'),
  callout('Estimates assume one competent systems administrator following the provided runbooks (Stable-Link Setup and Go-Live & Integrations). Each path separates ACTIVE work (hands-on time) from ELAPSED time (which includes waiting on other teams for provisioning, certificates, DNS and mail approvals).'),

  h2('Path A — Stable test link for all users'),
  P('The fast option, chosen for company-wide testing. It reuses the application exactly as it runs today and exposes it on a permanent address via a free Cloudflare named tunnel on the contact.eg domain.'),
  table(['Task', 'Hands-on time'], [
    ['Free Cloudflare account + confirm contact.eg (or delegate a subdomain)', '15–45 min'],
    ['Install Node, copy the app, run npm install', '15–20 min'],
    ['cloudflared login → create tunnel → route DNS → config.yml', '15–20 min'],
    ['Install tunnel + app as auto-start services; smoke-test the flows', '25–35 min'],
    ['Total active work', '≈ 1.5–2 hours'],
  ], [70, 30], true),
  callout([
    run('Realistic elapsed time: ', { bold: true, color: '14532D' }),
    run('same day, if contact.eg is already (or can quickly be) managed in Cloudflare. The single variable that can add up to ~24 hours is DNS — if the domain’s nameservers must move to Cloudflare, that propagation is the wait, not the work.', { color: '14532D' }),
  ], 'DCFCE7', GREEN),

  h2('Path B — Full production on Contact servers'),
  P('A hardened, permanent deployment on Contact infrastructure. Most of the calendar time is waiting on other teams (server, certificate, mail relay), not the installation itself.'),
  table(['Phase', 'Active work', 'Typical internal wait'], [
    ['Provision server / VM', '30–60 min', '1–3 business days (approval / procurement)'],
    ['Deploy app + environment config', '30–45 min', '—'],
    ['Reverse proxy + TLS certificate', '30–60 min', 'hours–1 day (cert issuance)'],
    ['DNS record + firewall rules', '20–30 min', 'minutes–hours'],
    ['Email / SMTP relay (mail-team allowlist or service account)', '20 min', '0.5–2 days'],
    ['Run as service, backups, hardening, UAT', '≈ half a day', '—'],
    ['Total', '≈ 1 working day', '≈ 3–5 business days elapsed'],
  ], [40, 24, 36], true),

  h2('Path C — Lending-platform integration (proposed policy)'),
  P('Linking the platform to a Contact lending system on the Commercial Register field is development work, not just deployment. It is independent — neither the test link (Path A) nor the basic go-live (Path B) depends on it.'),
  bullet('Estimated effort: roughly 1–3 weeks, driven mainly by the lending system’s API availability and the integration team’s capacity.'),
  bullet('Covered in detail in the Go-Live & Integrations runbook, Phase 3C, with the data contract.'),

  h2('Summary'),
  table(['Goal', 'Active work', 'Realistic to be live'], [
    ['Company-wide test link (Path A)', '~1.5–2 hours', 'Same day (DNS permitting)'],
    ['Hardened production (Path B)', '~1 working day', '~3–5 business days'],
    ['Lending integration (Path C)', 'Dev project', '~1–3 weeks (independent)'],
  ], [40, 28, 32]),
  callout([
    run('Bottom line: ', { bold: true }),
    run('the company-wide test link can be live within a few hours (same day) if DNS is ready; a hardened production deployment is realistically about a week, most of it waiting on server / certificate / mail provisioning rather than the setup itself.', {}),
  ]),
  P('Reference documents: “Contact-Group-Stable-Link-Setup-IT” (Path A) and “Contact-Group-GoLive-Runbook” (Path B & C).', { before: 80, after: 40 }),
];

(async () => {
  const buf = await Packer.toBuffer(new Document({ styles: { default: { document: { run: { font: 'Segoe UI', size: 21, color: INK } } } }, sections: [{ properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } }, footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run('Contact Group · Deployment Timeline & Plan          Page ', { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED })] })] }) }, children }] }));
  fs.writeFileSync(path.join(DESK, 'Contact-Group-Deployment-Timeline.docx'), buf);
  console.log('wrote Contact-Group-Deployment-Timeline.docx (' + buf.length + ' bytes)');
})();
