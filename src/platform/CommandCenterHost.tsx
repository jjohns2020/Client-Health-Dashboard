import { useEffect, useRef, useState } from 'react';
import { App } from '../App';
import { roiTarget, type RoiTarget } from './roiClient';
import { RoiFrameProvider } from './roiFrame';

interface OpenRoiMessage {
  type: 'cc-open-roi';
  clientId: string | null;
  name: string | null;
}

export function CommandCenterHost() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [roi, setRoi] = useState<RoiTarget | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as Partial<OpenRoiMessage> | null;
      if (!data || data.type !== 'cc-open-roi') return;
      setRoi(roiTarget(data.clientId ?? null, data.name ?? null));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const reply = (type: 'cc-back' | 'cc-signout') => {
    frameRef.current?.contentWindow?.postMessage({ type }, window.location.origin);
    setRoi(null);
  };

  return (
    <>
      <iframe
        ref={frameRef}
        className="cc-frame"
        id="cc-frame"
        title="CO Command Center"
        src={`${import.meta.env.BASE_URL}command-center.html`}
        hidden={roi != null}
      />
      {roi && (
        <RoiFrameProvider value={roi}>
          <div className="cc-roi">
            <div className="cc-return">
              <button type="button" id="cc-back" onClick={() => reply('cc-back')}>
                ← Command center
              </button>
              <div>
                <b>ROI</b>
                <span>{roi.organization ?? 'Collections Optimization'}</span>
              </div>
              <button type="button" id="cc-signout" onClick={() => reply('cc-signout')}>
                Sign out
              </button>
            </div>
            {roi.missingName && (
              <p className="cc-missing" id="cc-missing">
                The ROI workspace in this build covers MaineHealth and WashU. {roi.missingName} does not have a workbook here yet.
              </p>
            )}
            <App key={roi.clientKey ?? 'portfolio'} initialClientKey={roi.clientKey} />
          </div>
        </RoiFrameProvider>
      )}
    </>
  );
}
