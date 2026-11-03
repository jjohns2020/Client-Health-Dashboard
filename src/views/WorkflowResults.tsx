import { PageHead } from '../components/common/Labels';
import type { WorkflowKey } from '../data/types';
import { useDashboard } from '../state/DashboardContext';
import { CARD_CYCLE } from '../theme/colors';

export function WorkflowResults() {
  const { details, dispatch } = useDashboard();
  return (
    <>
      <PageHead title="Workflow Results" subtitle="click a workflow to open its detail page" />
      <div className="kpis">
        {Object.entries(details).map(([k, d], i) => {
          const col = CARD_CYCLE[i % 8];
          return (
            <button
              key={k}
              type="button"
              className="kpi dcard"
              data-k={k}
              style={{ textAlign: 'start', cursor: 'pointer', border: 0, borderBlockStart: `4px solid ${col}`, font: 'inherit' }}
              onClick={() => {
                dispatch({ type: 'openDetail', key: k as WorkflowKey });
                window.scrollTo?.(0, 0);
              }}
            >
              <div className="l">{d.name}</div>
              <div className="v" style={{ fontSize: 20, color: col }}>
                {d.kpis ? d.kpis[0][1] : '—'}
              </div>
              <div className="n">
                {d.kpis ? d.kpis[0][0] : 'Not in deck'} · <span style={{ color: '#005EB8', fontWeight: 600 }}>View details →</span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="note">Each card opens the same content as the matching Utilization Review slide.</p>
    </>
  );
}
