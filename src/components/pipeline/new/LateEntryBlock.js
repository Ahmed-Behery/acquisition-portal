import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { DOCUMENT_ACCEPT } from '@/constants/pipeline';

/** Shown when the visit date is in the past — the entry needs HoP approval. */
export default function LateEntryBlock({ late, onChange }) {
  return (
    <div>
      <Banner tone="warn" className="mt-2">
        <b>Visit date is in the past.</b> Entries should be created before the visit, not after. This entry will be
        locked as <b>Pending HoP — Late Entry</b> until the Head of Products approves it. You must record what happened
        at the meeting now.
      </Banner>

      <div className="form-grid mt-2">
        <Field label="Closure date achieved" required hint="When was the deal/conclusion reached?">
          <input type="date" value={late.closure} onChange={(e) => onChange({ closure: e.target.value })} />
        </Field>
        <Field label="Reason for late entry" required>
          <input
            type="text"
            placeholder="Why is this being entered after the visit?"
            value={late.reason}
            onChange={(e) => onChange({ reason: e.target.value })}
          />
        </Field>
      </div>

      <Field
        className="mt-2"
        label={
          <>
            Minutes of meeting <span className="req">(or upload call report below)</span>
          </>
        }
      >
        <textarea
          placeholder="Summary of what was discussed, decisions taken, follow-up actions"
          value={late.minutes}
          onChange={(e) => onChange({ minutes: e.target.value })}
        />
      </Field>

      <Field
        className="mt-2"
        label="Call report (optional if minutes provided)"
        hint="PDF / Word / image. Required if minutes are not provided."
      >
        <input
          type="file"
          accept={DOCUMENT_ACCEPT}
          onChange={(e) => onChange({ fileName: e.target.files?.[0]?.name || null })}
        />
      </Field>
    </div>
  );
}
