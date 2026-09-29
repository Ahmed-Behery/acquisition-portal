import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Banner from '@/components/common/Banner';
import Field from '@/components/common/Field';
import { selectCompany, selectDelegatableUsers, selectLeaderUsers } from '@/domain/selectors';
import { useActions } from '@/hooks/useActions';
import { useAppState } from '@/hooks/useAppStore';
import { dialogs } from '@/utils/dialogs';

const EMPTY_REFERRAL = { company: '', department: '', toLeaderId: '', productId: '', description: '' };

/** Direct an opportunity sourced by another department to a C-level. */
export function ReferralModal({ open, onClose }) {
  const state = useAppState();
  const actions = useActions();
  const [values, setValues] = useState(EMPTY_REFERRAL);

  const set = (name) => (e) => setValues((v) => ({ ...v, [name]: e.target.value }));

  const submit = () => {
    if (!values.company.trim() || !values.department.trim() || !values.toLeaderId) {
      dialogs.alert('Please fill in the company, the initiating department, and the C-level to direct it to.');
      return;
    }
    actions.referral.submitReferral({
      company: values.company.trim(),
      department: values.department.trim(),
      toLeaderId: values.toLeaderId,
      productId: values.productId,
      description: values.description.trim(),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Refer an opportunity to a C-level"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            Send to C-level
          </button>
        </>
      }
    >
      <Banner tone="info" className="mb-2">
        Use this when another department (e.g. IT) sources a lead. It is directed to the C-level you choose, who can
        then delegate it to their team.
      </Banner>

      <Field label="Company / opportunity" required>
        <input type="text" placeholder="Company or opportunity name" value={values.company} onChange={set('company')} />
      </Field>
      <Field label="Initiating department" required>
        <input
          type="text"
          placeholder="e.g. IT, Operations, Marketing"
          value={values.department}
          onChange={set('department')}
        />
      </Field>
      <Field label="Direct to (C-level)" required>
        <select value={values.toLeaderId} onChange={set('toLeaderId')}>
          <option value="">Select a C-level…</option>
          {selectLeaderUsers(state).map((leader) => (
            <option key={leader.id} value={leader.id}>
              {leader.name}
              {leader.jobTitle ? ' · ' + leader.jobTitle : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Related product" optional>
        <select value={values.productId} onChange={set('productId')}>
          <option value="">—</option>
          {state.products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Details" optional>
        <textarea placeholder="Context, contact, why it fits…" value={values.description} onChange={set('description')} />
      </Field>
    </Modal>
  );
}

/** Pass a department lead on to a team member. */
export function DelegateReferralModal({ open, onClose, referral }) {
  const state = useAppState();
  const actions = useActions();
  const [delegateId, setDelegateId] = useState('');
  const [message, setMessage] = useState('');

  const submit = () => {
    if (!delegateId) {
      dialogs.alert('Please choose a team member.');
      return;
    }
    actions.referral.delegateReferral(referral.id, { delegateId, message: message.trim() });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delegate lead — ${referral.company}`}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit}>
            Delegate
          </button>
        </>
      }
    >
      <Banner tone="info" className="mb-2">
        Assign this opportunity to a member of your team. They are notified to open it.
      </Banner>
      <Field label="Delegate to" required>
        <select value={delegateId} onChange={(e) => setDelegateId(e.target.value)}>
          <option value="">Select a team member…</option>
          {selectDelegatableUsers(state).map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
              {member.companyId
                ? ' · ' + selectCompany(state, member.companyId)?.code
                : member.group
                  ? ' · ' + member.group
                  : ''}
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
