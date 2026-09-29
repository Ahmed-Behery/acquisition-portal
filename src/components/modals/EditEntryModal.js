import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { useActions } from '@/hooks/useActions';
import { dialogs } from '@/utils/dialogs';

const MIN_REASON_LENGTH = 10;

/** Edits are queued for Head of Products approval, not applied directly. */
export default function EditEntryModal({ open, onClose, entry }) {
  const actions = useActions();
  const [values, setValues] = useState({
    prospect: entry.prospect,
    industry: entry.industry,
    value: entry.value,
    expectedClose: entry.expectedClose,
    summary: entry.summary,
  });
  const [reason, setReason] = useState('');

  const update = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = () => {
    if (reason.trim().length < MIN_REASON_LENGTH) {
      dialogs.alert(`Please provide a reason for the edit (at least ${MIN_REASON_LENGTH} characters).`);
      return;
    }
    const result = actions.pipeline.submitEditRequest(entry.id, {
      values: { ...values, value: parseFloat(values.value) },
      reason: reason.trim(),
    });
    if (!result.applied) dialogs.alert('No changes detected.');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit pipeline entry"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            Submit for HoP approval
          </button>
        </>
      }
    >
      <Banner tone="warn" className="mb-2">
        <b>Edits require Head of Products approval.</b> Submitted changes are not applied until HoP approves them. The
        entry will be locked while pending.
      </Banner>

      <div className="form-grid">
        <Field label="Prospect name">
          <input type="text" value={values.prospect} onChange={update('prospect')} />
        </Field>
        <Field label="Industry">
          <input type="text" value={values.industry} onChange={update('industry')} />
        </Field>
        <Field label="Expected deal value (EGP)">
          <input type="number" value={values.value} onChange={update('value')} />
        </Field>
        <Field label="Expected close date">
          <input type="date" value={values.expectedClose} onChange={update('expectedClose')} />
        </Field>
      </div>

      <Field className="mt-2" label="Negotiation summary">
        <textarea value={values.summary} onChange={update('summary')} />
      </Field>
      <Field className="mt-2" label="Reason for edit (for HoP)">
        <textarea
          placeholder="Why are these edits needed?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
    </Modal>
  );
}
