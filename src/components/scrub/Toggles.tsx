import type { MedicaidSource } from '../../lib/roi';
import { useDashboard } from '../../state/DashboardContext';
import { MockTag } from '../common/Labels';
import { ToggleButton, ToggleRow } from '../common/ToggleGroup';

/** Return Mail counting level: accounts vs guarantors. */
export function ReturnMailLevelToggle() {
  const { state, dispatch, guarRatio } = useDashboard();
  return (
    <ToggleRow label="Count by:">
      <ToggleButton kind="rml" value="acct" active={state.rmLevel === 'acct'} color="#662D91" onClick={() => dispatch({ type: 'setRmLevel', level: 'acct' })}>
        Accounts
      </ToggleButton>
      <ToggleButton kind="rml" value="guar" active={state.rmLevel === 'guar'} color="#662D91" onClick={() => dispatch({ type: 'setRmLevel', level: 'guar' })}>
        Guarantors
      </ToggleButton>
      {state.rmLevel === 'guar' && !state.present && (
        <span className="note" style={{ margin: 0 }}>
          Mockup converts at {guarRatio} accounts per guarantor (workbook “Avg Guar to Acct Ratio”). The live build uses the Return
          Mail dashboard's guarantor view.
        </span>
      )}
    </ToggleRow>
  );
}

/** Medicaid "Delivered by" split. Only shown when the client profile says Medicaid is also worked by eInsights. */
export function MedicaidSourceToggle() {
  const { state, dispatch, usesEin } = useDashboard();
  if (!usesEin) return null;
  const b = (v: MedicaidSource, l: string) => (
    <ToggleButton key={v} kind="mds" value={v} active={state.medSrc === v} color="#005EB8" onClick={() => dispatch({ type: 'setMedSrc', src: v })}>
      {l}
    </ToggleButton>
  );
  return (
    <ToggleRow label="Delivered by:">
      {b('all', 'All')}
      {b('exp', 'Experian')}
      {b('ein', 'eInsights')}
      {!state.present && <MockTag gray>SOURCE SPLIT = ILLUSTRATIVE</MockTag>}
    </ToggleRow>
  );
}