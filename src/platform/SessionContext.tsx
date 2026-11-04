import { createContext, useContext, type ReactNode } from 'react';
import type { Session } from './auth';

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ session, children }: { session: Session; children: ReactNode }) {
  return <Ctx.Provider value={session}>{children}</Ctx.Provider>;
}

export function useOptionalSession(): Session | null {
  return useContext(Ctx);
}
