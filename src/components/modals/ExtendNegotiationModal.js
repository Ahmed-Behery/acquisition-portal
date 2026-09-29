import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { DOCUMENT_ACCEPT } from '@/constants/pipeline';
import { useActions } from '@/hooks/useActions';
import { dialogs } from '@/utils/dialogs';

const MIN_REASON_LENGTH = 10;

/** Extend Negotiation — requires a reason and an optional supporting document. */
export default function ExtendNegotiationModal({ open, onClose, entryId }) {
  const actions = useActions();
  const [details, setDetails] = useState('');
  const [fileName, setFileName] = useState(null);

  const submit = () => {
    if (details.trim().length < MIN_REASON_LENGTH) {
      dialogs.alert(`Please provide a clear reason (at least ${MIN_REASON_LENGTH} characters).`);
      return;
    }
    actions.pipeline.submitExtendRequest(entryId, { details: details.trim(), fileName });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Extend Negotiation — submit for HoP approval"
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
        <b>This stage requires Head of Products approval.</b> Provide a clear reason for extending and (optionally)
        upload supporting evidence.
      </Banner>
      <Field label="Reason for extending" required>
        <textarea
          placeholder="Why does this negotiation need more time? What is the next concrete step?"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>
      <Field
        className="mt-2"
        label="Supporting document (optional)"
        hint="PDF, Word, or image. The file is referenced by name only in this prototype."
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
