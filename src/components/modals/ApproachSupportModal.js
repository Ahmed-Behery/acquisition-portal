import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { selectClient, selectCompany, selectPipelineEntry, selectUser } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useAppState } from '@/hooks/useAppStore';
import { dialogs } from '@/utils/dialogs';

/**
 * Asks the RM who owns a record to support approaching that client.
 * `kind` is 'client' (merchant) or 'pipeline' (pipeline entry).
 */
export default function ApproachSupportModal({ open, onClose, kind, recordId }) {
  const state = useAppState();
  const actions = useActions();
  const [message, setMessage] = useState('');

  if (!open || !recordId) return null;

  const record = kind === 'client' ? selectClient(state, recordId) : selectPipelineEntry(state, recordId);
  if (!record) return null;

  const name = kind === 'client' ? record.name : record.prospect;
  const rm = selectUser(state, record.rmId);
  if (!rm) {
    dialogs.alert('No responsible RM is set on this record yet.');
    onClose();
    return null;
  }

  const rmCompany = rm.companyId ? selectCompany(state, rm.companyId)?.code : rm.group || '—';
  const where = kind === 'client' ? 'All Merchants' : 'the Pipeline';

  const send = () => {
    actions.client.sendApproachSupport(kind, recordId, message);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Request support to approach ${name}`}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={send}>
            Send request
          </button>
        </>
      }
    >
      <Banner tone="info" className="mb-2">
        {name} sits in <b>{rm.name}</b>’s book ({rmCompany}, {where}). This asks them to support you approaching this
        client — they receive it in their inbox{state.smtpConfigured ? ' and by email' : ''}.
      </Banner>
      <Field label={`Message to ${rm.name}`} optional>
        <textarea
          placeholder="e.g. I have a Leasing opportunity with them — can we coordinate before I reach out?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Field>
    </Modal>
  );
}
