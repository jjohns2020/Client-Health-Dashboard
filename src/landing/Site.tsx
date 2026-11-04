import { useEffect, useState, type ReactNode } from 'react';
import { sampleDataSource } from '../data/dataSource';
import type { Client, Dataset, WorkflowDetail } from '../data/types';
import { money, moneyFull } from '../lib/format';
import { roiRatio, totalValueCreation } from '../lib/roi';
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

function Bar() {
  return (
    <div className="site-bar">
      <a href="#home">Collections Optimization</a>
      <span className="sub">Client library · sample data</span>
      <span className="spacer" />
      <span className="mock">MOCKUP</span>
      <a href={dashboardHref()}>ROI Dashboard</a>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Bar />
      <div className="site">{children}</div>
    </>
  );
}

function workflowNames(dataset: Dataset, key: string): string[] {
  return Object.values(dataset.details[key] ?? {})
    .filter((detail): detail is WorkflowDetail => !!detail && !detail.empty)
    .map((detail) => detail.name);
}

function profileLabels(client: Client): string[] {
  return [
    client.pfc !== false ? 'Patient Financial Clearance' : '',
    client.ein ? 'Medicaid also worked by eInsights' : '',
    client.seg ? 'Segmentation' : '',
    client.agency ? 'Collection agencies' : '',
    client.dialer ? 'Dialer' : '',
  ].filter((label) => label !== '');
}

function Hub() {
  return (
    <Shell>
      <h1>Client library</h1>
      <p className="site-lead">
        Sample reviews for Collections Optimization. Open the ROI dashboard, or a client information page. Figures are from the sample
        workbooks and are not validated production results.
      </p>
      <div className="site-grid">
        <article className="site-card wide">
          <h2>ROI Dashboard</h2>
          <p>Executive highlights, workflow results, cash impact, trending, and the Utilization Review PowerPoint for the selected client.</p>
          <div className="site-actions">
            <a className="btn primary" href={dashboardHref()}>
              Open the dashboard
            </a>
          </div>
        </article>
        <article className="site-card">
          <h2>All clients</h2>
          <p>Period, benefit, subscription, and ROI for every client loaded in this sample.</p>
          <div className="site-actions">
            <a className="btn" href="#clients">
              Client list
            </a>
          </div>
        </article>
        {Object.entries(ds.clients).map(([key, client]) => (
          <article className="site-card" key={key}>
            <h2>{client.name}</h2>
            <p>
              {client.period}
              <br />
              ROI {roiRatio(client.quantified, client.sub).toFixed(1)} : 1 · {money(client.quantified)} quantified benefit
            </p>
            <div className="site-actions">
              <a className="btn" href={'#' + key}>
                Client page
              </a>
              <a className="btn primary" href={dashboardHref(key)}>
                Open dashboard
              </a>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

function ClientList() {
  return (
    <Shell>
      <a className="site-back" href="#home">
        ← Client library
      </a>
      <h1>All clients</h1>
      <p className="site-lead">Periods differ by client. These are the sample workbook headlines, not a combined portfolio result.</p>
      <div className="card">
        <table>
          <tbody>
            <tr>
              <th>Client</th>
              <th>Period</th>
              <th className="num">Quantified benefit</th>
              <th className="num">Subscription</th>
              <th className="num">ROI</th>
              <th></th>
            </tr>
            {Object.entries(ds.clients).map(([key, client]) => (
              <tr key={key}>
                <td>{client.name}</td>
                <td>{client.period}</td>
                <td className="num">{moneyFull(client.quantified)}</td>
                <td className="num">{moneyFull(client.sub)}</td>
                <td className="num">{roiRatio(client.quantified, client.sub).toFixed(1)} : 1</td>
                <td>
                  <a href={'#' + key}>{client.name} page</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

function ClientPage({ clientKey }: { clientKey: string }) {
  const client = ds.clients[clientKey];
  const roi = roiRatio(client.quantified, client.sub);
  const workflows = workflowNames(ds, clientKey);
  return (
    <Shell>
      <a className="site-back" href="#home">
        ← Client library
      </a>
      <h1>{client.name}</h1>
      <p className="site-lead">
        {client.period}. Source: {client.source}. Sample data, not validated production results.
      </p>
      <div className="kpis">
        <div className="kpi" style={{ borderTopColor: '#662D91' }}>
          <div className="l">Quantified benefit</div>
          <div className="v" style={{ color: '#662D91' }}>
            {money(client.quantified)}
          </div>
          <div className="n">{moneyFull(client.quantified)}</div>
        </div>
        <div className="kpi" style={{ borderTopColor: '#D6007B' }}>
          <div className="l">Additional value</div>
          <div className="v" style={{ color: '#D6007B' }}>
            {money(client.additional)}
          </div>
          <div className="n">Supporting value identified</div>
        </div>
        <div className="kpi" style={{ borderTopColor: '#005EB8' }}>
          <div className="l">Total value creation</div>
          <div className="v" style={{ color: '#005EB8' }}>
            {money(totalValueCreation(client))}
          </div>
          <div className="n">Quantified + additional</div>
        </div>
        <div className="kpi" style={{ borderTopColor: '#00B4AA' }}>
          <div className="l">ROI</div>
          <div className="v" style={{ color: '#00B4AA' }}>
            {roi.toFixed(1)} : 1
          </div>
          <div className="n">Subscription {moneyFull(client.sub)}</div>
        </div>
      </div>
      <div className="site-grid">
        <article className="site-card">
          <h2>On this profile</h2>
          <div className="site-facts">
            {profileLabels(client).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <p>{workflows.length ? 'Workflow pages in the dashboard: ' + workflows.join(', ') + '.' : 'No workflow pages are loaded for this client.'}</p>
        </article>
        <article className="site-card">
          <h2>Success plan</h2>
          {client.recs.map((item, index) => (
            <p key={item}>
              {index + 1}. {item}
            </p>
          ))}
          <div className="site-actions">
            <a className="btn primary" href={dashboardHref(clientKey)}>
              Open {client.name} in the dashboard
            </a>
          </div>
        </article>
      </div>
    </Shell>
  );
}

export function Site() {
  const page = usePage();
  if (page === '' || page === 'home') return <Hub />;
  if (page === 'clients') return <ClientList />;
  if (ds.clients[page]) return <ClientPage clientKey={page} />;
  return (
    <Shell>
      <h1>Page not found</h1>
      <p className="site-lead">That client is not in this sample.</p>
      <a className="site-back" href="#home">
        ← Client library
      </a>
    </Shell>
  );
}
