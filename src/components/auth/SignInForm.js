export default function SignInForm({ values, onChange, onSubmit, pending }) {
  return (
    <form
      className="auth-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="auth-field">
        <span>Username</span>
        <input
          name="username"
          autoComplete="username"
          placeholder="e.g. y.fahmy"
          value={values.username}
          onChange={(e) => onChange('username', e.target.value)}
        />
      </label>
      <label className="auth-field">
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={values.password}
          onChange={(e) => onChange('password', e.target.value)}
        />
      </label>
      <button type="submit" className="auth-submit" disabled={pending}>
        {pending ? 'Please wait…' : 'Sign In'}
      </button>
    </form>
  );
}

/** Initial values, kept next to the form that owns their shape. */
export const emptySignIn = { username: '', password: '' };
