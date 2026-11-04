import { findAccount, type Account, type AccountRole } from './accounts';

export interface Session {
  email: string;
  name: string;
  organization: string;
  role: AccountRole;
  clientKey?: string;
}

export type SignInResult = { ok: true; session: Session } | { ok: false; error: string };

export function sessionFromAccount(account: Account): Session {
  return {
    email: account.email,
    name: account.name,
    organization: account.organization,
    role: account.role,
    clientKey: account.clientKey,
  };
}

export function authenticate(email: string, password: string): SignInResult {
  const account = findAccount(email);
  if (!email.trim() || !password) return { ok: false, error: 'Enter the email and password for a sample account.' };
  if (!account) return { ok: false, error: 'That email is not a sample Client Health account.' };
  if (account.password !== password) return { ok: false, error: 'Password does not match this sample account.' };
  return { ok: true, session: sessionFromAccount(account) };
}

/** Rebuilds a session from a stored email. Stored role and client are ignored. */
export function sessionFromStoredEmail(email: string | null | undefined): Session | null {
  if (!email) return null;
  const account = findAccount(email);
  return account ? sessionFromAccount(account) : null;
}
