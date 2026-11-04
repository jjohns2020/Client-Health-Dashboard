import { useEffect, useState, type ReactNode } from 'react';
import { sampleDataSource } from '../data/dataSource';
import { roiRatio } from '../lib/roi';
import { dashboardHref } from '../lib/siteLinks';

const ds = sampleDataSource.load();

function usePage(): string {
  const read = () => window.location.hash.replace(/^#/, '');
  const [page, setPage] = useState(read);
  useEffect(() => {
    const onChange = () => setPage(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return page;
}

function Cover({ children }: { children: ReactNode }) {
  return (
    <div className="cover">
      <div className="cover-top">
        <div className="cover-brand">
          experian <span>health</span>
        </div>
        <span className="mock">MOCKUP</span>
      </div>
      {children}
      <p className="cover-note">Sample data. Not validated production results.</p>
    </div>
  );
}

function Hub() {
  return (
    <Cover>
      <h1>Utilization Review</h1>
      <p className="kicker">Collection Optimization</p>
      <nav className="cover-list">
        <a href={dashboardHref()}>
          ROI Dashboard <span>All reviews</span>
        </a>
        {Object.entries(ds.clients).map(([key, client]) => (
          <a key={key} href={'#' + key}>
            {client.name} <span>{client.period}</span>
          </a>
        ))}
      </nav>
    </Cover>
  );
}

function ClientPage({ clientKey }: { clientKey: string }) {
  const client = ds.clients[clientKey];
  const roi = roiRatio(client.quantified, client.sub);
  return (
    <Cover>
      <h1>{client.name}</h1>
      <p className="kicker">
        {client.period}
        <br />
        ROI {roi.toFixed(1)} : 1
      </p>
      <nav className="cover-list">
        <a href={dashboardHref(clientKey)}>
          Open this review <span>ROI Dashboard</span>
        </a>
        <a href="#home">
          All reviews <span>Back</span>
        </a>
      </nav>
    </Cover>
  );
}

export function Site() {
  const page = usePage();
  if (page === '' || page === 'home') return <Hub />;
  if (ds.clients[page]) return <ClientPage clientKey={page} />;
  return (
    <Cover>
      <h1>Not in this sample</h1>
      <nav className="cover-list">
        <a href="#home">
          All reviews <span>Back</span>
        </a>
      </nav>
    </Cover>
  );
}
