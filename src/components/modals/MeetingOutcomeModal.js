import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { DOCUMENT_ACCEPT } from '@/constants/pipeline';
import { useActions } from '@/hooks/useActions';
import { dialogs } from '@/utils/dialogs';

/** Recorded once the visit date has passed. */
export default function MeetingOutcomeModal({ open, onClose, entry }) {
  const actions = useActions();
  const [closureDate, setClosureDate] = useState('');
  const [minutes, setMinutes] = useState('');
  const [fileName, setFileName] = useState(null);

  const submit = () => {
    if (!closureDate) {
      dialogs.alert('A closure date is required.');
      return;
    }
    if (!minutes.trim() && !fileName) {
      dialogs.alert('Please provide minutes of meeting OR upload a call report.');
      return;
    }
    actions.pipeline.saveMeetingOutcome(entry.id, { closureDate, minutes: minutes.trim(), fileName });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Record meeting outcome — ${entry.prospect}`}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            Save outcome
          </button>
        </>
      }
    >
      <Banner tone="info" className="mb-2">
        The visit date <b>{entry.visitDate}</b> has passed. Please record what happened so the entry stays current.
      </Banner>
      <Field
        label="Closure date achieved"
        required
        hint="When was the deal closed (or expected closure if still open)?"
      >
        <input type="date" value={closureDate} onChange={(e) => setClosureDate(e.target.value)} />
      </Field>
      <Field
        className="mt-2"
        label={
          <>
            Minutes of meeting <span className="req">(or upload call report below)</span>
          </>
        }
      >
        <textarea
          placeholder="Decisions taken, action items, next steps"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
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
          onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
        />
      </Field>
    </Modal>
  );
}
