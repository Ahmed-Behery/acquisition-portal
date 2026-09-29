import { useCallback, useState } from 'react';
import PageMeta from '@/components/common/PageMeta';
import SignInForm, { emptySignIn } from '@/components/auth/SignInForm';
import RegisterForm, { emptyRegistration } from '@/components/auth/RegisterForm';
import DemoAccounts from '@/components/auth/DemoAccounts';
import { useAuth } from '@/hooks/useAuth';
import { DEMO_PASSWORD } from '@/constants/roles';
import { clsx } from '@/utils/clsx';
import { loginPageProps } from '@/server/pageGuard';

const TABS = [
  { key: 'signin', label: 'Sign In' },
  { key: 'register', label: 'Register' },
];

export default function LoginPage() {
  const [tab, setTab] = useState('signin');
  const [signInValues, setSignInValues] = useState(emptySignIn);
  const [registerValues, setRegisterValues] = useState(emptyRegistration);
  const { signIn, register, pending, message, setMessage, clearMessage } = useAuth();

  const updateSignIn = useCallback((name, value) => setSignInValues((v) => ({ ...v, [name]: value })), []);
  const updateRegister = useCallback((name, value) => setRegisterValues((v) => ({ ...v, [name]: value })), []);

  const selectTab = (key) => {
    setTab(key);
    clearMessage();
  };

  const handleSignIn = () =>
    signIn({ username: signInValues.username.trim(), password: signInValues.password });

  const handleRegister = () => {
    if (registerValues.password !== registerValues.confirm) {
      setMessage({ text: 'Passwords do not match.', ok: false });
      return;
    }
    register({
      name: registerValues.name.trim(),
      username: registerValues.username.trim(),
      email: registerValues.email.trim(),
      department: registerValues.department,
      jobTitle: registerValues.jobTitle.trim(),
      password: registerValues.password,
      confirm: registerValues.confirm,
    });
  };

  const pickDemoAccount = (username) => {
    selectTab('signin');
    setSignInValues({ username, password: DEMO_PASSWORD });
  };

  return (
    <>
      <PageMeta
        title="Sign in"
        description="Sign in to the Contact Group client and pipeline platform."
      />
      <div className="login">
        <div className="login-card auth-card">
          <div className="login-brand">Contact Group</div>
          <div className="login-sub">Client &amp; Pipeline Platform</div>

          <div className="auth-tabs">
            {TABS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={clsx('auth-tab', tab === item.key && 'active')}
                onClick={() => selectTab(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {message ? (
            <div className={clsx('auth-msg', message.ok && 'ok')} role="alert">
              {message.text}
            </div>
          ) : null}

          {tab === 'signin' ? (
            <SignInForm values={signInValues} onChange={updateSignIn} onSubmit={handleSignIn} pending={pending} />
          ) : (
            <RegisterForm
              values={registerValues}
              onChange={updateRegister}
              onSubmit={handleRegister}
              pending={pending}
            />
          )}

          <DemoAccounts onPick={pickDemoAccount} />
        </div>
      </div>
    </>
  );
}

// The login screen is its own full-bleed page — no sidebar or topbar.
LoginPage.getLayout = (page) => page;

export const getServerSideProps = loginPageProps;
