import { PageHead } from '../components/common/Labels';
import { useDashboard } from '../state/DashboardContext';
import { C } from '../theme/colors';

const REC_COLORS = [C.blue, C.purple, C.magenta, C.teal, C.orange];

export function SuccessPlan() {
  const { client: c } = useDashboard();
  return (
    <>
      <PageHead title="Success Plan & Recommendations" subtitle="prioritized next steps" />
      <div className="card">
        {c.recs.map((r, i) => (
          <p key={i} style={{ margin: '10px 0' }}>
            <b style={{ color: REC_COLORS[i] }}>
              {i + 1}. {r}
            </b>
          </p>
        ))}
        <p className="note">Pulled from the workbook's Notes / Value Statements; edited by the consultant before export.</p>
      </div>
    </>
  );
}
