import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from './accounts';
import { authenticate, sessionFromStoredEmail } from './auth';

describe('Client Health sign-in', () => {
  it('accepts a client account and pins that health system', () => {
    const result = authenticate('  Jordan.Hale@MaineHealth.org ', DEMO_PASSWORD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session).toMatchObject({ role: 'client', clientKey: 'maine', organization: 'MaineHealth' });
  });

  it('accepts the internal account without pinning a client', () => {
    const result = authenticate('morgan.ellis@experianhealth.com', DEMO_PASSWORD);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session.role).toBe('internal');
    expect(result.session.clientKey).toBeUndefined();
  });

  it('rejects an unknown email and a wrong password', () => {
    expect(authenticate('someone@example.com', DEMO_PASSWORD)).toEqual({
      ok: false,
      error: 'That email is not a sample Client Health account.',
    });
    expect(authenticate('priya.shah@wustl.edu', 'nope')).toEqual({
      ok: false,
      error: 'Password does not match this sample account.',
    });
    expect(authenticate('', '').ok).toBe(false);
  });

  it('rebuilds a session only from a known stored email', () => {
    expect(sessionFromStoredEmail('priya.shah@wustl.edu')?.clientKey).toBe('washu');
    expect(sessionFromStoredEmail('not-a-user@example.com')).toBeNull();
    expect(sessionFromStoredEmail(null)).toBeNull();
  });
});
