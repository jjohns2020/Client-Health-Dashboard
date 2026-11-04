import { useState, type FormEvent } from 'react';
import { accounts, DEMO_PASSWORD } from './accounts';
import { authenticate, type Session } from './auth';

export function LoginPage({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const signIn = (nextEmail: string, nextPassword: string) => {
    const result = authenticate(nextEmail, nextPassword);
    if (!result.ok) {
      setEmail(nextEmail);
      setPassword(nextPassword);
      setError(result.error);
      return;
    }
    onSignedIn(result.session);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    signIn(email, password);
  };

  return (
    <div className="ch-login">
      <section className="ch-hero">
        <div>
          <div className="ch-eyebrow">
            <span className="ch-mark" aria-hidden="true">
              EH
            </span>
            Experian Health
          </div>
          <h1>Client Health</h1>
          <p className="ch-lead">
            Sign in to the health system workspace. Collections Optimization opens on the ROI dashboard: quantified benefit, cash impact,
            workflow results, and the success plan.
          </p>
        </div>
        <ul className="ch-points">
          <li>Client accounts open that health system&apos;s ROI dashboard.</li>
          <li>The Experian Health account keeps every client and the working views.</li>
          <li>Sample figures only. No production directory is connected.</li>
        </ul>
      </section>
      <section className="ch-panel">
        <form id="ch-login" onSubmit={onSubmit}>
          <p className="ch-kicker">Client Health</p>
          <h2>Sign in</h2>
          <p className="ch-form-note">Use a sample account below, or type the email and password.</p>
          <label htmlFor="ch-email">Work email</label>
          <input
            id="ch-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={error ? 'ch-error' : undefined}
          />
          <label htmlFor="ch-password">Password</label>
          <input
            id="ch-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p id="ch-error" className="ch-error" role="alert">
              {error}
            </p>
          )}
          <button id="ch-submit" className="ch-submit" type="submit">
            Sign in
          </button>
          <div className="ch-samples">
            <div className="ch-samples-label">Sample accounts</div>
            {accounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="ch-account"
                data-account={account.clientKey ?? 'internal'}
                onClick={() => signIn(account.email, account.password)}
              >
                <span>
                  <b>{account.organization}</b>
                  <span>{account.name}</span>
                </span>
                <span className="ch-role">{account.role === 'internal' ? 'Internal' : 'Client'}</span>
              </button>
            ))}
            <p className="ch-password-hint">
              Password for every sample account: <code>{DEMO_PASSWORD}</code>
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
