import { REGISTRATION_DEPARTMENTS } from '@/constants/roles';

const TEXT_FIELDS = [
  { name: 'name', label: 'Full Name', placeholder: 'Your complete name' },
  { name: 'username', label: 'Username', placeholder: 'Min 3 characters' },
  { name: 'email', label: 'Email', placeholder: 'you@contactgroup.com', type: 'email' },
];

const PASSWORD_FIELDS = [
  { name: 'password', label: 'Password', placeholder: '8+ chars, 1 uppercase, 1 number' },
  { name: 'confirm', label: 'Confirm Password', placeholder: 'Re-enter password' },
];

export default function RegisterForm({ values, onChange, onSubmit, pending }) {
  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      {TEXT_FIELDS.map((field) => (
        <label className="auth-field" key={field.name}>
          <span>{field.label}</span>
          <input
            type={field.type || 'text'}
            placeholder={field.placeholder}
            value={values[field.name]}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        </label>
      ))}

      <label className="auth-field">
        <span>Department</span>
        <select value={values.department} onChange={(e) => onChange('department', e.target.value)}>
          {REGISTRATION_DEPARTMENTS.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label}
            </option>
          ))}
        </select>
      </label>

      <label className="auth-field">
        <span>Job Title</span>
        <input
          placeholder="e.g. Relationship Manager"
          value={values.jobTitle}
          onChange={(e) => onChange('jobTitle', e.target.value)}
        />
      </label>

      {PASSWORD_FIELDS.map((field) => (
        <label className="auth-field" key={field.name}>
          <span>{field.label}</span>
          <input
            type="password"
            placeholder={field.placeholder}
            value={values[field.name]}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        </label>
      ))}

      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? 'Please wait…' : 'Create Account'}
      </button>
    </form>
  );
}

export const emptyRegistration = {
  name: '',
  username: '',
  email: '',
  department: REGISTRATION_DEPARTMENTS[0].code,
  jobTitle: '',
  password: '',
  confirm: '',
};
