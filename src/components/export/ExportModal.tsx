import { overallStatus, runChecks } from '../../lib/dataChecks';
import { buildSlidePlan } from '../../lib/exportPlan';
import { useDashboard } from '../../state/DashboardContext';
import { Chip } from '../common/Chip';

/**
 * PowerPoint export preview. This build only lists the slides; it does not generate a .pptx.
 */
export function ExportModal() {
  const { ds, state, dispatch, client, details } = useDashboard();
  const plan = buildSlidePlan(client, Object.values(details));
  const ov = overallStatus(runChecks(state.clientKey, client, ds));
  return (
    <div className={`modal ${state.exportOpen ? 'open' : ''}`} id="modal">
      <div className="box">
        <h3 style={{ color: 'var(--blue)', marginTop: 0 }} id="mTitle">
          {plan.fileName}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--gray)' }}>Slides the export would build from the Utilization Review template for this client's profile:</p>
        <p id="mStatus" style={{ fontSize: 13 }}>
          Data check status: <Chip status={ov} /> {ov === 'NOT READY' ? '— fix the FIX items on the Data Checks page before exporting.' : ''}
        </p>
        <ol id="mList">
          {plan.slides.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
          {plan.profileSlides.map((x, i) => (
            <li key={'p' + i} className="slide-add">
              {x} (added for this client's profile)
            </li>
          ))}
        </ol>
        <p className="note">
          In the real tool this button creates the .pptx. In this mockup it only previews the slide list. The Portfolio, Opportunity Sizing and Data
          Checks pages, other clients' data and internal notes are never included in a client ROI export.
        </p>
        <button className="btn primary" id="closeModal" type="button" onClick={() => dispatch({ type: 'closeExport' })}>
          Close
        </button>
      </div>
    </div>
  );
}
