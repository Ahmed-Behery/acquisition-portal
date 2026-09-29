import Field from '@/components/common/Field';
import { MailLink } from '@/components/common/misc';
import { selectCompany, selectUser } from '@/domain/selectors';
import { useAppState } from '@/hooks/useAppStore';

const CONTACT_FIELDS = [
  { name: 'commercialRegister', label: 'Commercial Register no.', placeholder: 'e.g., CR-123456' },
  { name: 'contactPerson', label: 'Contact person name', placeholder: 'Full name of the contact person' },
  { name: 'contactTitle', label: 'Contact person title', placeholder: 'e.g., CFO, Procurement Manager' },
  { name: 'contactMobile', label: 'Contact mobile', placeholder: '+20 1xx xxx xxxx' },
  { name: 'contactEmail', label: 'Contact email', placeholder: 'name@company.com', type: 'email' },
];

/** The classification / contact / ownership grid on the New Entry form. */
export default function NewEntryFields({ form, update, isOwner, lockedCompanyId }) {
  const state = useAppState();
  const lockedCompany = lockedCompanyId ? selectCompany(state, lockedCompanyId) : null;
  const responsible = selectUser(state, form.rmId);
  const assignable = state.users.filter((u) => u.role === 'RM' || u.role === 'Employee');

  const set = (name) => (e) => update({ [name]: e.target.value });

  return (
    <div className="form-grid mt-2">
      <Field label="Industry / Sector" required>
        <select value={form.industry} onChange={set('industry')}>
          <option value="">Select an industry…</option>
          {state.industries.map((industry) => (
            <option key={industry.id} value={industry.name}>
              {industry.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Company size"
        required
        hint="CBE segmentation — see Admin & Lists → Codes for the definitions."
      >
        <select value={form.companySize} onChange={set('companySize')}>
          <option value="">Select size…</option>
          {state.companySizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Governorate of premises" required>
        <select value={form.governorate} onChange={set('governorate')}>
          <option value="">Select governorate…</option>
          {state.governorates.map((governorate) => (
            <option key={governorate} value={governorate}>
              {governorate}
            </option>
          ))}
        </select>
      </Field>

      {CONTACT_FIELDS.map((field) => (
        <Field key={field.name} label={field.label}>
          <input
            type={field.type || 'text'}
            placeholder={field.placeholder}
            value={form[field.name]}
            onChange={set(field.name)}
          />
        </Field>
      ))}

      <Field
        label="Group company"
        required
        hint={
          lockedCompany
            ? `Auto-set to your company — the reference code uses this prefix (${lockedCompany.code}-P###).`
            : undefined
        }
      >
        {lockedCompany ? (
          <input type="text" value={`${lockedCompany.name} (${lockedCompany.code})`} disabled />
        ) : (
          <select value={form.companyId} onChange={set('companyId')}>
            {state.companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.code})
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        label="Responsible RM / Employee"
        required
        hint={
          isOwner
            ? 'Defaults to you — change it to assign this entry to a colleague.'
            : 'You are entering on behalf of someone — choose who owns this entry (you are recorded separately as “Entered by”).'
        }
      >
        <select value={form.rmId} onChange={set('rmId')}>
          <option value="">Select…</option>
          {assignable.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
              {person.companyId
                ? ' · ' + selectCompany(state, person.companyId)?.code
                : ' · ' + (person.group || 'Employee')}
            </option>
          ))}
        </select>
        {responsible ? (
          <div className="small muted" style={{ marginTop: 6 }}>
            📇 From contact database — <b>{responsible.phone || '—'}</b> · <MailLink email={responsible.email} />
          </div>
        ) : null}
      </Field>

      <Field label="Expected deal value / sales (EGP)" hint="Optional.">
        <input type="number" placeholder="0" value={form.value} onChange={set('value')} />
      </Field>

      <Field label="Visit date" required>
        <input type="date" value={form.visitDate} onChange={set('visitDate')} />
      </Field>

      <Field label="Expected close date" required>
        <input type="date" value={form.expectedClose} onChange={set('expectedClose')} />
      </Field>
    </div>
  );
}

/** Checkbox grid of the products this prospect is interested in. */
export function ProductPicker({ products, selected, onToggle }) {
  return (
    <Field className="mt-2" label="Products of interest" required>
      <div className="prod-pick">
        {products.map((product) => (
          <label className="prod-chip" key={product.id}>
            <input
              type="checkbox"
              value={product.id}
              checked={selected.includes(product.id)}
              onChange={() => onToggle(product.id)}
            />{' '}
            {product.name}
          </label>
        ))}
      </div>
    </Field>
  );
}
