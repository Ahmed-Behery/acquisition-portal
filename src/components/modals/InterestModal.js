import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { selectCompany, selectDelegatableUsers } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useAppState } from '@/hooks/useAppStore';
import { dialogs } from '@/utils/dialogs';

/**
 * "I'm interested" / "Delegate this lead".
 * `delegateMode` makes the team-member choice mandatory.
 */
export default function InterestModal({ open, onClose, entry, delegateMode }) {
  const state = useAppState();
  const actions = useActions();
  const [productId, setProductId] = useState('');
  const [delegateId, setDelegateId] = useState('');
  const [message, setMessage] = useState('');

  const team = selectDelegatableUsers(state);

  const submit = () => {
    if (!productId) {
      dialogs.alert('Please select your related product.');
      return;
    }
    if (delegateMode && !delegateId) {
      dialogs.alert('Please choose a team member to delegate to.');
      return;
    }
    actions.interest.flagInterest(entry.id, { productId, delegateId, message: message.trim() });
    onClose();
  };

  const memberLabel = (member) =>
    `${member.name}${member.companyId ? ' · ' + selectCompany(state, member.companyId)?.code : member.group ? ' · ' + member.group : ''}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${delegateMode ? 'Delegate this lead' : "I'm interested"} — ${entry.prospect}`}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-success" onClick={submit}>
            {delegateMode ? 'Delegate lead' : 'Send interest'}
          </button>
        </>
      }
    >
      <Banner tone="info" className="mb-2">
        {delegateMode
          ? 'Assign this opportunity to a member of your team. They are notified to open it; the RM is told to call them and coordinate. You keep visibility of the updates.'
          : 'Your interest goes to the initiator. You can also assign it to a team member to pursue on your behalf.'}
      </Banner>

      <Field
        label="Your related product"
        required
        hint="This product is added to the client’s pipeline so the RM tracks it alongside the main product."
      >
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="">Select a product…</option>
          {state.products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
              {product.category ? ' · ' + product.category : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Delegate to a team member" required={delegateMode} optional={!delegateMode}>
        <select value={delegateId} onChange={(e) => setDelegateId(e.target.value)}>
          <option value="">{delegateMode ? 'Select a team member…' : '— keep it with me —'}</option>
          {team.map((member) => (
            <option key={member.id} value={member.id}>
              {memberLabel(member)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Message" optional>
        <textarea placeholder="Optional note…" value={message} onChange={(e) => setMessage(e.target.value)} />
      </Field>
    </Modal>
  );
}
