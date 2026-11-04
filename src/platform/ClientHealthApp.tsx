import { useState } from 'react';
import { App } from '../App';
import type { Session } from './auth';
import { LoginPage } from './LoginPage';
import { PlatformShell } from './PlatformShell';
import { clearSession, readSession, writeSession } from './session';
import { SessionProvider } from './SessionContext';

export function ClientHealthApp() {
  const [session, setSession] = useState<Session | null>(() => readSession());

  const signIn = (next: Session) => {
    writeSession(next);
    setSession(next);
  };

  const signOut = () => {
    clearSession();
    setSession(null);
  };

  if (!session) return <LoginPage onSignedIn={signIn} />;

  return (
    <SessionProvider session={session}>
      <PlatformShell session={session} onSignOut={signOut}>
        <App initialClientKey={session.clientKey} />
      </PlatformShell>
    </SessionProvider>
  );
}
