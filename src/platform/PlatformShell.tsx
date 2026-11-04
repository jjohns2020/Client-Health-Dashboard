import type { ReactNode } from 'react';
import type { Session } from './auth';

export function PlatformShell({ session, onSignOut, children }: { session: Session; onSignOut: () => void; children: ReactNode }) {
  return (
    <div className="ch-shell">
      <div className="ch-bar">
        <div className="ch-brand">
          <span className="ch-mark" aria-hidden="true">
            EH
          </span>
          <div>
            <div className="ch-product">Client Health</div>
            <div className="ch-parent">Experian Health</div>
          </div>
        </div>
        <div className="ch-module" aria-current="page">
          Collections Optimization
        </div>
        <div className="ch-user">
          <div>
            <b>{session.name}</b>
            <span>{session.role === 'client' ? session.organization : `${session.organization} · Internal`}</span>
          </div>
          <button type="button" className="ch-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
