import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { DOCUMENT_ACCEPT } from '@/constants/pipeline';
import { useActions } from '@/hooks/useActions';
import { dialogs } from '@/utils/dialogs';

const MIN_DETAILS_LENGTH = 10;

/** Done Deal — requires the sold products and a signed contract. */
export default function DoneDealModal({ open, onClose, entryId }) {
  const actions = useActions();
  const [details, setDetails] = useState('');
  const [fileName, setFileName] = useState(null);

  const submit = () => {
    if (details.trim().length < MIN_DETAILS_LENGTH) {
      dialogs.alert(`Please describe the sold products (at least ${MIN_DETAILS_LENGTH} characters).`);
      return;
    }
    if (!fileName) {
      dialogs.alert('A signed contract is required.');
      return;
    }
    actions.pipeline.submitDoneDeal(entryId, { details: details.trim(), fileName });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Done Deal — submit for HoP approval"
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
      <Banner tone="success" className="mb-2">
        <b>Mark this deal as done.</b> List the products sold and upload the signed contract. Head of Products will
        validate, then the merchant is added to the Master Ledger automatically.
      </Banner>
      <Field label="Sold products and final terms" required>
        <textarea
          placeholder="Which products did the client buy? Final value? Any commercial notes?"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>
      <Field
        className="mt-2"
        label="Signed contract"
        required
        hint="A signed PDF or scanned image is required for HoP validation."
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
