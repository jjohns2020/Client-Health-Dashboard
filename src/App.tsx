import { useMemo } from 'react';
import { ExportModal } from './components/export/ExportModal';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { sampleDataSource, type DataSource } from './data/dataSource';
import { DashboardProvider } from './state/DashboardContext';
import { ViewRouter } from './views/ViewRouter';

export function App({
  dataSource = sampleDataSource,
  initialClientKey,
}: {
  dataSource?: DataSource;
  /** Health system opened by a Client Health sign-in. Omitted for the internal account. */
  initialClientKey?: string;
}) {
  const dataset = useMemo(() => dataSource.load(), [dataSource]);
  return (
    <DashboardProvider dataset={dataset} initialClientKey={initialClientKey}>
      <Header />
      <div className="layout">
        <Sidebar />
        <main id="main">
          <ViewRouter />
        </main>
      </div>
      <ExportModal />
    </DashboardProvider>
  );
}
