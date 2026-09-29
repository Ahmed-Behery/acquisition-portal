// Seed data for the Contact Group Platform.
// Reference lists (products, industries, recipients) come from the client's documents.

const COMPANIES = [
  { id: 'fact',  code: 'FACT',  name: 'Contact Factoring',     focus: 'Invoice factoring, receivables financing, supplier finance' },
  { id: 'lease', code: 'LEASE', name: 'Contact Leasing',       focus: 'Equipment, vehicle, and asset leasing for SMEs and corporates' },
  { id: 'mort',  code: 'MORT',  name: 'Contact Mortgage',      focus: 'Residential and commercial mortgage financing' },
  { id: 'cred',  code: 'CRED',  name: 'Contact Credit',        focus: 'Consumer credit and personal finance' },
  { id: 'ins',   code: 'INS',   name: 'Contact Insurance',     focus: 'Insurance products and risk protection across the group' },
  { id: 'motor', code: 'MOTOR', name: 'Contact Auto',          focus: 'Vehicle care, auto finance, and after-sales motor services' },
  { id: 'now',   code: 'NOW',   name: 'Contact Now',           focus: 'Consumer finance / buy-now-pay-later' },
];

// ---- AML watchlist (demo) — prospect/merchant names are screened against this.
// A name that contains any of these terms is flagged for compliance review.
const AML_WATCHLIST = [
  'Sanctioned Holdings', 'OFAC Blocked', 'Shell Front', 'Al Noor Front',
  'Blacklisted Trading', 'Red Flag Industries', 'Frozen Assets',
];

// ---- Products (from "Products list.docx"; Credit Card removed) ----
const PRODUCTS = [
  { id: 'p1',  name: 'Reverse Factoring',            category: 'Factoring', offeredBy: ['fact'],  contact: 'Nour Abdel Aziz', email: 'n.aziz@contactgroup.com',  desc: 'Supplier finance program — extend payment terms while suppliers get paid early.' },
  { id: 'p2',  name: 'Normal Factoring',             category: 'Factoring', offeredBy: ['fact'],  contact: 'Youssef Fahmy',   email: 'y.fahmy@contactgroup.com', desc: 'Sell unpaid invoices for immediate cash flow.' },
  { id: 'p3',  name: 'Consumer Factoring',           category: 'Factoring', offeredBy: ['fact'],  contact: 'Youssef Fahmy',   email: 'y.fahmy@contactgroup.com', desc: 'Receivables financing for consumer-facing revenue streams.' },
  { id: 'p4',  name: 'Mortgage Finance',             category: 'Mortgage',  offeredBy: ['mort'],  contact: 'Rania Gamal',     email: 'r.gamal@contactgroup.com', desc: 'Residential and commercial property financing.' },
  { id: 'p5',  name: 'Equity Finance',               category: 'Investment',offeredBy: ['fact'],  contact: 'Karim Hatem',     email: 'k.hatem@contactgroup.com', desc: 'Growth and expansion capital in exchange for equity.' },
  { id: 'p6',  name: 'Portfolio acquisition',        category: 'Investment',offeredBy: ['fact'],  contact: 'Karim Hatem',     email: 'k.hatem@contactgroup.com', desc: 'Acquisition of receivables / asset portfolios.' },
  { id: 'p7',  name: 'Leasing Finance (Machinery)',  category: 'Leasing',   offeredBy: ['lease'], contact: 'Omar Khalil',     email: 'o.khalil@contactgroup.com', desc: 'Operating and finance leases for industrial machinery.' },
  { id: 'p8',  name: 'Leasing Finance (Real estate)',category: 'Leasing',   offeredBy: ['lease'], contact: 'Omar Khalil',     email: 'o.khalil@contactgroup.com', desc: 'Real-estate leasing for offices, retail, and warehouses.' },
  { id: 'p9',  name: 'Leasing Finance (Fleet)',      category: 'Leasing',   offeredBy: ['lease'], contact: 'Omar Khalil',     email: 'o.khalil@contactgroup.com', desc: 'Passenger and commercial vehicle fleet leasing.' },
  { id: 'p10', name: 'Sale and lease back',          category: 'Leasing',   offeredBy: ['lease'], contact: 'Omar Khalil',     email: 'o.khalil@contactgroup.com', desc: 'Unlock capital from owned assets via sale-and-leaseback.' },
  { id: 'p11', name: 'Contact Now',                  category: 'Consumer',  offeredBy: ['cred'],  contact: 'Tamer Saad',      email: 't.saad@contactgroup.com',  desc: 'Consumer finance / buy-now-pay-later solution.' },
  { id: 'p12', name: 'Contact Credit',              category: 'Credit',    offeredBy: ['cred'],  contact: 'Tamer Saad',      email: 't.saad@contactgroup.com',  desc: 'Consumer credit and personal loans.' },
  { id: 'p13', name: 'Insurance',                    category: 'Insurance', offeredBy: ['ins'],   contact: 'Mariam Naguib',   email: 'm.naguib@contactgroup.com', desc: 'Risk protection covering property, life, and commercial cover.' },
  { id: 'p14', name: 'Contact Auto',                 category: 'Auto',      offeredBy: ['motor'], contact: 'Ahmed Sobhy',     email: 'a.sobhy@contactgroup.com',  desc: 'Auto finance, vehicle care, and after-sales motor services.' },
];

// ---- Industries (from "Industries.docx") ----
const INDUSTRIES = [
  'ICT, Software, and Digital Services',
  'Tourism, Hospitality, and Travel Services',
  'Renewable Energy and Green Industry',
  'Manufacturing and Export-Led Industry',
  'Healthcare, Medical Services, and MedTech',
  'Construction, Real Estate, and Infrastructure',
  'Agribusiness and Food Processing',
  'Food and beverage',
  'FMCG',
  'Automotive',
].map((name, i) => ({ id: 'ind' + (i + 1), name }));

// ---- Egypt company seed list (fallback for the prospect-name dropdown when the
//      live OpenCorporates lookup is unavailable). Real, well-known EG companies. ----
const EGYPT_COMPANIES = [
  'Commercial International Bank (CIB)', 'Telecom Egypt', 'Vodafone Egypt', 'Orange Egypt',
  'Etisalat Misr (e&)', 'Eastern Company', 'Juhayna Food Industries', 'Edita Food Industries',
  'Domty (Arabian Food Industries)', 'Elsewedy Electric', 'Ezz Steel', 'EFG Hermes',
  'Talaat Moustafa Group', 'Palm Hills Developments', 'SODIC', 'Madinet Nasr Housing',
  'Emaar Misr', 'Orascom Construction', 'Orascom Development Egypt', 'Hassan Allam Holding',
  'GB Auto (Ghabbour)', 'Raya Holding', 'Fawry', 'e-finance', 'MM Group',
  'Oriental Weavers', 'Cleopatra Hospitals Group', 'Integrated Diagnostics Holdings (IDH)',
  'Abou Kir Fertilizers', 'Misr Fertilizers (MOPCO)', 'Sidi Kerir Petrochemicals (SIDPEC)',
  'Egyptian Financial Group', 'Banque Misr', 'National Bank of Egypt', 'QNB Alahli',
  'Arab African International Bank', 'Suez Cement', 'Lecico Egypt', 'Heliopolis Housing',
  'Pioneers Holding', 'Rameda Pharmaceuticals', 'EIPICO', 'Amoun Pharmaceutical',
  'Seoudi Supermarket', 'Spinneys Egypt', 'B.TECH', 'Carrefour Egypt (Majid Al Futtaim)',
  'Americana Egypt', 'Mansour Group', 'El Sallab Group',
].map((name, i) => ({ id: 'eg' + (i + 1), name, jurisdiction: 'eg' }));

// ---- Users / login accounts -------------------------------------------------
// Leadership + demo RMs power the seeded clients/pipeline. The full employee
// directory (from "List of Branch managers, MD's, C-level.docx") is added so all
// employees can log in and insert entries, and receive prospect notifications.
const CORE_USERS = [
  { id: 'u_admin', name: 'Doaa Orfy',     role: 'Admin',            companyId: null,    email: 'Doaa.Orfy@contact.eg',      username: 'doaa.orfy', jobTitle: 'Administrator' },
  { id: 'u_ceo',  name: 'Hala Mansour',    role: 'CEO',              companyId: null,    email: 'h.mansour@contactgroup.com', username: 'h.mansour', jobTitle: 'Chief Executive Officer' },
  { id: 'u_md',   name: 'Karim Hatem',     role: 'MD',               companyId: null,    email: 'k.hatem@contactgroup.com',   username: 'k.hatem',   jobTitle: 'Managing Director' },
  { id: 'u_hop',  name: 'Dina El Sayed',   role: 'Head of Products', companyId: null,    email: 'd.elsayed@contactgroup.com', username: 'd.elsayed', jobTitle: 'Head of Products' },
  { id: 'u_rm1',  name: 'Youssef Fahmy',   role: 'RM',               companyId: 'fact',  email: 'y.fahmy@contactgroup.com',   username: 'y.fahmy',   jobTitle: 'Relationship Manager' },
  { id: 'u_rm2',  name: 'Nour Abdel Aziz', role: 'RM',               companyId: 'fact',  email: 'n.aziz@contactgroup.com',    username: 'n.aziz',    jobTitle: 'Relationship Manager' },
  { id: 'u_rm3',  name: 'Omar Khalil',     role: 'RM',               companyId: 'lease', email: 'o.khalil@contactgroup.com',  username: 'o.khalil',  jobTitle: 'Relationship Manager' },
  { id: 'u_rm4',  name: 'Rania Gamal',     role: 'RM',               companyId: 'mort',  email: 'r.gamal@contactgroup.com',   username: 'r.gamal',   jobTitle: 'Relationship Manager' },
  { id: 'u_rm5',  name: 'Tamer Saad',      role: 'RM',               companyId: 'cred',  email: 't.saad@contactgroup.com',    username: 't.saad',    jobTitle: 'Relationship Manager' },
  { id: 'u_rm6',  name: 'Mariam Naguib',   role: 'RM',               companyId: 'ins',   email: 'm.naguib@contactgroup.com',  username: 'm.naguib',  jobTitle: 'Relationship Manager' },
  { id: 'u_rm7',  name: 'Ahmed Sobhy',     role: 'RM',               companyId: 'motor', email: 'a.sobhy@contactgroup.com',   username: 'a.sobhy',   jobTitle: 'Relationship Manager' },
];

const MD_RAW = "Abdo Mohamed <Abdo.Mohamed@contact.eg>; Ahmed El Hawary <Ahmed.ElHawary@contact.eg>; Ahmed Ezz Hashem <Ahmed.Hashem@contact.eg>; Ahmed Hakim <ahakim@contact.eg>; Ayman Halim <ahalim@contact.eg>; Gaser Zater <Gaser.Zater@contact.eg>; Haidy Elmasry <Haidy.Elmasry@contact.eg>; Ismail Samir <Ismail.Samir@contact.eg>; Mahmoud Abouftoh <Mahmoud.Abouftoh@contact.eg>; Marwan Adel <Marwan.Adel@contact.eg>; Mohamed Said <msaid@contact.eg>; Mohamed Samir <Mohamed.Samir@contact.eg>; Moursy Mansour <Moursy.Mansour@contact.eg>; Nehal Break <Nehal.Break@contact.eg>; Radwa Fathy <Radwa.Fathy@contact.eg>; Said Zater <saz@contact.eg>; Sameh Amer <sameh.amer@contact.eg>; Sherif Galal <Sherif.Galal@contact.eg>; Taha Anany <Taha.Anany@contact.eg>; Tamer Hisham <Tamer.Hisham@contact.eg>";
const CLEVEL_RAW = "Ahmed Khalifa <Ahmed.Khalifa@contact.eg>; John Saad <John.Saad@Contact.eg>; Khaled Riad <Khaled.Riad@contact.eg>; Mohsen ElShaarani <Mohsen.ElShaarani@contact.eg>; Moustafa Adel <moustafa.adel@contact.eg>; Sherif Bakir <Sherif.Bakir@contact.eg>";
const BRANCH_RAW = "Adel Kamel <Adel.Kamel@contact.eg>; Ahmed Elkhouly <Ahmed.Elkhouly@contact.eg>; Ahmed Elseidy <Ahmed.Elseidy@contact.eg>; Ahmed Fathy ElAkhras <Ahmed.FathyElAkhras@Contact.eg>; Ahmed Habib <Ahmed.Habib@contact.eg>; Ahmed Rashwan <Ahmed.Rashwan@contact.eg>; Ahmed Refaat <Ahmed.Refaat@contact.eg>; Alaa Ragheb <Alaa.Ragheb@contact.eg>; Alshaimaa Soliman <alshaimaasoliman@contact.eg>; Amr Osman <Amr.Osman@contact.eg>; Ashraf Metwalli <ashraf.metwalli@contact.eg>; Atef Fouad <Atef.Fouad@contact.eg>; Ehab Mokhtar <ehab.moktar@contact.eg>; Hazem EzzEldin <Hazem.EzzEldin@contact.eg>; Hazem Sobhy <Hazem.Sobhy@contact.eg>; Hesham Hassan <Hesham.Hassan@contact.eg>; Hesham Meckawy <Hesham.Meckawy@contact.eg>; Hisham Ali <Hisham.Ali@contact.eg>; Hisham Farag <Hisham.Farag@contact.eg>; Hossam Helmy <hhelmy@contact.eg>; Islam Ahmed <Islam.Ahmed@contact.eg>; Karim Altohamy <Karim.Altohamy@contact.eg>; Loay Elgamal <Loay.Elgamal@contact.eg>; Mahmoud Ali <Mahmoud.Ali@contact.eg>; Marwa Mousa <Marwa.Mousa@contact.eg>; Mohamed Ahmed <Mohamed.Ahmed@contact.eg>; Mohamed Askar <Mohamed.Askar@contact.eg>; Mohamed Elsayed Awad Zayed <MohamedElsayed.Awad@contact.eg>; Mohamed Serag <Mohamed.Serag@contact.eg>; Mostafa Saleh <Mostafa.Saleh@contact.eg>; Nabil Bekheit <Nabil.Bekheit@contact.eg>; Naglaa Ezz <Naglaa.Ezz@contact.eg>; Nermin Hawam <Nermin.Hawam@contact.eg>; Nesrine Saleh <Nesrine.Saleh@contact.eg>; Osama Lel <Osama.Lel@contact.eg>; Ramy Yassin <Ramy.Yassin@contact.eg>; Ramy Zarif <Ramy.Zarif@contact.eg>; Samy Soliman <Samy.Soliman@contact.eg>; Sarwat Mohamed Tarek <Sarwat.Tarek@contact.eg>; Sayed Gamei <Sayed.Gamei@contact.eg>; Sherif Samir <Sherif.Samir@contact.eg>; Tarek Elgendy <Tarek.Elgendy@contact.eg>; Wael Abo elfwares <Wael.Aboelfwares@Contact.eg>; Wael AboElGheit <Wael.AboElGheit@contact.eg>; Waleed Elashry <Waleed.Elashry@contact.eg>; Waleed Gamal <waleedgamal@contact.eg>; Walid Ehab <Walid.Ehab@contact.eg>; Zeyad Hazem <Zeyad.Hazem@contact.eg>";

function parsePeople(raw, group) {
  return raw.split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const m = s.match(/^(.*?)\s*<([^>]+)>$/) || s.match(/^(.*?)\s+([^\s<>]+@[^\s<>]+)$/);
    let name, email;
    if (m) { name = m[1].trim(); email = m[2].trim(); }
    else { name = s; email = ''; }
    const username = (email ? email.split('@')[0] : name.replace(/\s+/g, '.')).toLowerCase();
    return { name, email, group, username };
  });
}

// Build employee login accounts from the directory, de-duplicating usernames.
const EMPLOYEE_PEOPLE = [
  ...parsePeople(MD_RAW, 'MD'),
  ...parsePeople(CLEVEL_RAW, 'C-Level'),
  ...parsePeople(BRANCH_RAW, 'Branch Manager'),
];
const seenUsernames = new Set(CORE_USERS.map(u => u.username));
const EMPLOYEE_USERS = EMPLOYEE_PEOPLE.map((p, i) => {
  let username = p.username;
  while (seenUsernames.has(username)) username = p.username + (i + 1);
  seenUsernames.add(username);
  return {
    id: 'e' + (i + 1),
    name: p.name,
    role: 'Employee',
    companyId: null,
    email: p.email,
    username,
    jobTitle: p.group,
    group: p.group, // MD / C-Level / Branch Manager — used for prospect notifications
  };
});

const USERS = [...CORE_USERS, ...EMPLOYEE_USERS];

// Recipients of prospect-insert notifications = everyone in the directory.
const RECIPIENTS = EMPLOYEE_USERS.map(u => ({ id: u.id, name: u.name, email: u.email, group: u.group }));

// ---- Bundles: intentionally empty (per requirement) ----
const BUNDLES = [];

// ---- Existing master-ledger clients (product ids remapped to new catalogue) ----
const CLIENTS = [
  { id: 'c1',  name: 'Horizon Logistics LLC',        code: 'FACT-001', companyId: 'fact',  rmId: 'u_rm1', exposure: 162500000, ytdSales: 4200000,  productsSold: ['p1','p3'],  status: 'Active',   industry: 'Manufacturing and Export-Led Industry' },
  { id: 'c2',  name: 'Cedar & Stone Trading',        code: 'FACT-002', companyId: 'fact',  rmId: 'u_rm2', exposure: 437500000, ytdSales: 10750000, productsSold: ['p1','p2'],  status: 'Active',   industry: 'FMCG' },
  { id: 'c3',  name: 'Nile Valley Agribusiness',     code: 'FACT-003', companyId: 'fact',  rmId: 'u_rm1', exposure: 70000000,  ytdSales: 1100000,  productsSold: ['p2'],       status: 'Active', industry: 'Agribusiness and Food Processing' },
  { id: 'c9',  name: 'Olive Grove Food Industries',  code: 'FACT-004', companyId: 'fact',  rmId: 'u_rm2', exposure: 320000000, ytdSales: 8900000,  productsSold: ['p1','p3'],  status: 'Active',   industry: 'Food and beverage' },
  { id: 'c4',  name: 'Saqqara Industrial Ltd',       code: 'LEASE-001', companyId: 'lease', rmId: 'u_rm3', exposure: 615000000, ytdSales: 17000000, productsSold: ['p7','p9'],  status: 'Active',   industry: 'Manufacturing and Export-Led Industry' },
  { id: 'c5',  name: 'Alexandria Marine Holdings',   code: 'LEASE-002', companyId: 'lease', rmId: 'u_rm3', exposure: 280000000, ytdSales: 7400000,  productsSold: ['p7'],       status: 'Active',   industry: 'Manufacturing and Export-Led Industry' },
  { id: 'c6',  name: 'Delta Textiles Group',         code: 'LEASE-003', companyId: 'lease', rmId: 'u_rm3', exposure: 44500000,  ytdSales: 600000,   productsSold: ['p10'],      status: 'Good to Go', industry: 'Manufacturing and Export-Led Industry' },
  { id: 'c7',  name: 'Ahmed & Layla El Masry',       code: 'MORT-001',  companyId: 'mort',  rmId: 'u_rm4', exposure: 105000000, ytdSales: 2800000,  productsSold: ['p4'],       status: 'Active',   industry: 'Construction, Real Estate, and Infrastructure' },
  { id: 'c8',  name: 'Red Sea Hospitality Group',    code: 'MORT-002',  companyId: 'mort',  rmId: 'u_rm4', exposure: 210000000, ytdSales: 5100000,  productsSold: ['p4'],       status: 'Active',   industry: 'Tourism, Hospitality, and Travel Services' },
  { id: 'c10', name: 'Mariam Hassan Abdel Rahman',   code: 'MORT-003',  companyId: 'mort',  rmId: 'u_rm4', exposure: 90000000,  ytdSales: 2100000,  productsSold: ['p4'],       status: 'Active',   industry: 'Construction, Real Estate, and Infrastructure' },
  { id: 'c11', name: 'Khaled Mostafa Ibrahim',       code: 'CRED-001',  companyId: 'cred',  rmId: 'u_rm5', exposure: 7250000,   ytdSales: 425000,   productsSold: ['p11','p12'],status: 'Active',   industry: 'FMCG' },
  { id: 'c12', name: 'Yasmin Adel Farouk',           code: 'CRED-002',  companyId: 'cred',  rmId: 'u_rm5', exposure: 3900000,   ytdSales: 210000,   productsSold: ['p12'],      status: 'Active',   industry: 'FMCG' },
];

// ---- Pipeline (product/industry ids remapped; new prospect fields included) ----
const PIPELINE = [
  { id: 'pl1', code: 'FACT-P001', prospect: 'Oasis Retail Holdings', inList: true, industry: 'FMCG', productsOfInterest: ['p2','p3'], value: 120000000, commercialRegister: 'CR-104882', contactPerson: 'Mohamed Sami', contactMobile: '+20 100 123 4567', contactEmail: 'm.sami@oasisretail.com', summary: 'CFO interested in factoring their growing receivables book. 2nd meeting scheduled.', expectedClose: '2026-06-15', visitDate: '2026-05-08', attendees: ['u_rm1','u_md'], rmId: 'u_rm1', enteredBy: 'u_rm1', companyId: 'fact', status: 'Negotiation', comments: [], lastUpdate: 'Apr 22, 2026', createdAt: 'Apr 16, 2026',
    attachments: [
      { id: 'att_demo1', fileName: 'Oasis_Receivables_Sample_Q1.pdf', note: 'Sample Q1 receivables ledger shared by CFO', uploadedBy: 'u_rm1', uploadedAt: 'Apr 18, 2026' },
      { id: 'att_demo2', fileName: 'Oasis_Initial_Proposal_v2.docx',  note: 'Updated proposal after second meeting',     uploadedBy: 'u_rm1', uploadedAt: 'Apr 22, 2026' },
    ] },
  { id: 'pl2', code: 'LEASE-P001', prospect: 'Mediterranean Shipping SAE', inList: true, industry: 'Manufacturing and Export-Led Industry', productsOfInterest: ['p7','p9'], value: 440000000, commercialRegister: 'CR-220914', contactPerson: 'Laila Mansour', contactMobile: '+20 122 555 7788', contactEmail: 'l.mansour@medshipping.com', summary: 'Interested in leasing 12 trucks plus port handling equipment. Pricing under review.', expectedClose: '2026-05-20', visitDate: '2026-04-10', attendees: ['u_rm3','u_ceo'], rmId: 'u_rm3', enteredBy: 'u_rm3', companyId: 'lease', status: 'Negotiation C1', comments: [], lastUpdate: 'Apr 18, 2026', createdAt: 'Mar 10, 2026',
    meetingOutcome: { closureDate: '2026-05-20', minutes: 'CFO confirmed budget approval. Pricing review next week.', callReport: null, recordedAt: 'Apr 11, 2026' } },
  { id: 'pl3', code: 'LEASE-P002', prospect: 'Sahara Solar Initiative', inList: true, industry: 'Renewable Energy and Green Industry', productsOfInterest: ['p7'], value: 925000000, commercialRegister: 'CR-330025', contactPerson: 'Tarek Fouad', contactMobile: '+20 111 909 2020', contactEmail: 't.fouad@saharasolar.com', summary: 'Equipment lease for solar farm. Pending government tariff decision.', expectedClose: '2026-06-30', visitDate: '2026-04-01', attendees: ['u_rm3','u_hop','u_md'], rmId: 'u_rm3', enteredBy: 'u_rm3', companyId: 'lease', status: 'Negotiation C2', comments: [], lastUpdate: 'Apr 15, 2026', createdAt: 'Feb 08, 2026',
    pendingMeetingOutcome: true },
  { id: 'pl4', code: 'MORT-P001', prospect: 'Tarek & Mona Sherif', inList: false, industry: 'Construction, Real Estate, and Infrastructure', productsOfInterest: ['p4'], value: 155000000, commercialRegister: '', contactPerson: 'Tarek Sherif', contactMobile: '+20 128 444 1212', contactEmail: 't.sherif@gmail.com', summary: 'Couple looking for residential mortgage on a new villa. Income docs being prepared.', expectedClose: '2026-08-10', visitDate: '2026-04-08', attendees: ['u_rm4'], rmId: 'u_rm4', enteredBy: 'u_rm4', companyId: 'mort', status: 'Pending HoP — Extend', comments: [], lastUpdate: 'Apr 10, 2026', createdAt: 'Jan 12, 2026', extendDetails: 'Property valuation pending. Buyers requesting more time pending appraiser availability. Requesting 60-day extension.', uploadedDoc: null,
    meetingOutcome: { closureDate: '2026-08-10', minutes: 'Initial meeting completed. Documents being collected.', callReport: null, recordedAt: '2026-04-09' } },
  { id: 'pl5', code: 'MORT-P002', prospect: 'Luxor Heritage Hotels', inList: true, industry: 'Tourism, Hospitality, and Travel Services', productsOfInterest: ['p4'], value: 60000000, commercialRegister: 'CR-551200', contactPerson: 'Hana Adel', contactMobile: '+20 109 332 7700', contactEmail: 'h.adel@luxorheritage.com', summary: 'Commercial mortgage for hotel renovation. No response since initial proposal.', expectedClose: '2026-04-05', visitDate: '2026-02-20', attendees: ['u_rm4'], rmId: 'u_rm4', enteredBy: 'u_rm4', companyId: 'mort', status: 'Good to Go', comments: [], lastUpdate: 'Mar 12, 2026', createdAt: 'Jan 25, 2026' },
  { id: 'pl6', code: 'CRED-P001', prospect: 'Cairo Digital Ventures', inList: true, industry: 'ICT, Software, and Digital Services', productsOfInterest: ['p11','p12'], value: 90000000, commercialRegister: 'CR-667341', contactPerson: 'Sara Naguib', contactMobile: '+20 100 778 9090', contactEmail: 's.naguib@cairodigital.com', summary: 'Corporate consumer-finance programme for 80 employees plus founder personal loans.', expectedClose: '2026-06-01', visitDate: '2026-05-02', attendees: ['u_rm5','u_hop'], rmId: 'u_rm5', enteredBy: 'u_rm5', companyId: 'cred', status: 'First Meeting', comments: [], lastUpdate: 'Apr 24, 2026', createdAt: 'Apr 22, 2026' },
];

const NOTIFICATIONS = [
  { id: 'n1', to: 'u_ceo', subject: '[Pipeline Alert] New Client Negotiation – Oasis Retail Holdings – FACT',
    body: 'A new pipeline entry has been created.\n\nProspect: Oasis Retail Holdings\nIndustry: FMCG\nProducts: Normal Factoring, Consumer Factoring\nEstimated Value: EGP 120,000,000\nResponsible RM: Youssef Fahmy\nCompany: Contact Factoring',
    time: '5 days ago', read: false, link: 'pipeline-detail/pl1' },
  { id: 'n5', to: 'u_hop', subject: '[Action Required] Tarek & Mona Sherif - HoP review needed',
    body: 'A pipeline entry has been escalated to your review.\n\nProspect: Tarek & Mona Sherif\nResponsible RM: Rania Gamal (MORT)\n\nRM Note:\n"Property valuation pending. Buyers requesting more time."',
    time: '6 days ago', read: false, link: 'pipeline-detail/pl4' },
];

// ---- Egypt governorates (all 27) ----
const EGYPT_GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea', 'Beheira', 'Fayoum', 'Gharbia',
  'Ismailia', 'Menoufia', 'Minya', 'Qalyubia', 'New Valley', 'Suez', 'Aswan', 'Assiut',
  'Beni Suef', 'Port Said', 'Damietta', 'Sharqia', 'South Sinai', 'Kafr El Sheikh',
  'Matrouh', 'Luxor', 'Qena', 'North Sinai', 'Sohag',
];

// ---- Company size segmentation (working definitions aligned to the CBE SME decree;
//      confirm exact turnover thresholds with the CBE circular before go-live). ----
const COMPANY_SIZES = ['MVSEs', 'SMEs', 'MIDCAP'];
const COMPANY_SIZE_DEFS = [
  { code: 'MVSEs', title: 'Micro & Very Small Enterprises', cbe: 'Annual turnover below EGP 10 million (micro: below EGP 1M).' },
  { code: 'SMEs', title: 'Small & Medium Enterprises', cbe: 'Annual turnover from EGP 10 million to EGP 200 million.' },
  { code: 'MIDCAP', title: 'Mid-Cap Corporates', cbe: 'Annual turnover above EGP 200 million.' },
];

// Contact-database phone numbers (auto-populated by the contact-DB integration).
USERS.forEach((u, i) => { u.phone = u.phone || ('+20 1' + (i % 5) + ' ' + String(1000 + (i * 7) % 9000) + ' ' + String(1000 + (i * 13) % 9000)); });

// Enrich merchants + pipeline with the new fields (size, governorate, onboarding, payment behavior).
const _sizeByAmt = a => (a >= 300000000 ? 'MIDCAP' : a >= 20000000 ? 'SMEs' : 'MVSEs');
const _pay = ['good', 'regular', 'bad'];
CLIENTS.forEach((c, i) => {
  c.companySize = c.companySize || _sizeByAmt(c.exposure);
  c.governorate = c.governorate || EGYPT_GOVERNORATES[i % 12];
  c.paymentBehavior = c.paymentBehavior || _pay[i % 3];
  c.onboardedDate = c.onboardedDate || ('2024-' + String((i % 12) + 1).padStart(2, '0') + '-' + String((i % 27) + 1).padStart(2, '0'));
});
PIPELINE.forEach((p, i) => {
  p.companySize = p.companySize || _sizeByAmt(p.value || 0);
  p.governorate = p.governorate || EGYPT_GOVERNORATES[i % 12];
});

// ---- Cross-department referred opportunities (initiated by IT, etc., directed to a C-level) ----
const REFERRALS = [];

export {
  COMPANIES, USERS, PRODUCTS, BUNDLES, CLIENTS, PIPELINE, NOTIFICATIONS, INDUSTRIES,
  EGYPT_COMPANIES, RECIPIENTS, AML_WATCHLIST, EGYPT_GOVERNORATES, COMPANY_SIZES,
  COMPANY_SIZE_DEFS, REFERRALS,
};
