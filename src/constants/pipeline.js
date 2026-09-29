/*
  Pipeline lifecycle constants.

  Stages: First Meeting → Negotiation → Negotiation C1 → Negotiation C2
           → Extend Negotiation (HoP approval)
           → Done Deal (HoP approval, contract upload, then converted)
  Pending HoP states lock the entry from further edits.
  Edit/Delete only by the enteredBy user, and HoP-validated.
*/

export const PIPELINE_STAGES = [
  'First Meeting',
  'Negotiation',
  'Negotiation C1',
  'Negotiation C2',
  'Extend Negotiation',
  'Done Deal',
];

/** Stages that require HoP validation when set as the new status. */
export const STAGES_REQUIRING_HOP = ['Extend Negotiation', 'Done Deal'];

/** Statuses that take an entry out of the active pipeline. */
export const INACTIVE_STATUSES = [
  'Converted - Active Client',
  'Closed - Lost',
  'Done Deal',
  'Good to Go',
];

/** Statuses shown in the pipeline list's status filter. */
export const PIPELINE_FILTER_STATUSES = [
  'First Meeting',
  'Negotiation',
  'Negotiation C1',
  'Negotiation C2',
  'Extend Negotiation',
  'Pending HoP — Validation',
  'Pending HoP — Late Entry',
  'Pending HoP — Extend',
  'Pending HoP — Done Deal',
];

/** Per-product negotiation tracking. */
export const PRODUCT_SUBSTATUS = ['Negotiation', 'Booked', 'On hold', 'Dropped'];

// Service-level agreements per lifecycle cycle (Egypt working days, Sun–Thu).
// Shown in Admin & Lists → Codes & access, and drives the stale-entry reminder.
export const PIPELINE_SLAS = [
  { cycle: 'Cycle 1', stage: 'First Meeting', sla: 5, note: 'Log the meeting outcome and advance to Negotiation within 5 working days.' },
  { cycle: 'Cycle 2', stage: 'Negotiation', sla: 10, note: 'Progress the deal or update the entry within 10 working days.' },
  { cycle: 'Cycle 3', stage: 'Negotiation C1', sla: 10, note: 'Second negotiation round — 10 working days before escalation.' },
  { cycle: 'Cycle 4', stage: 'Negotiation C2', sla: 10, note: 'Final negotiation round — 10 working days before escalation.' },
  { cycle: 'Extension', stage: 'Extend Negotiation', sla: 10, note: 'Requires Head of Products approval, then 10 more working days.' },
  { cycle: 'Closing', stage: 'Done Deal', sla: 2, note: 'Head of Products validates the signed contract within 2 working days; approval creates the merchant.' },
];

/** Cross-cutting SLAs that apply regardless of the pipeline stage. */
export const OTHER_SLAS = [
  { name: 'Interest follow-up', sla: 2, note: 'When a colleague flags “I’m interested”, the initiating RM has 2 working days to make contact, or it escalates to their manager.' },
  { name: 'Stale-entry reminder', sla: 7, note: 'Any pipeline entry with no update for 7+ working days is flagged to the Head of Products (weekly Monday sweep).' },
];

/** Working days an RM has to contact a colleague who flagged interest. */
export const INTEREST_CONTACT_SLA_DAYS = 2;

/** Days without an update before an entry counts as stale. */
export const STALE_ENTRY_DAYS = 7;

/** Documents accepted by the upload inputs. */
export const DOCUMENT_ACCEPT = '.pdf,.docx,.jpg,.png';
export const ATTACHMENT_ACCEPT = '.pdf,.docx,.xlsx,.jpg,.jpeg,.png';
