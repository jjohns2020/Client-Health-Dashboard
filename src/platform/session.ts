import { sessionFromStoredEmail, type Session } from './auth';

const STORAGE_KEY = 'eh.clientHealth.session';

export function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { email?: string };
    return sessionFromStoredEmail(parsed.email);
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email: session.email }));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
