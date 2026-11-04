/** Client key from a dashboard URL such as `?client=washu`. Unknown keys are ignored. */
export function clientFromSearch(search: string, keys: readonly string[]): string | null {
  const key = new URLSearchParams(search).get('client');
  return key && keys.includes(key) ? key : null;
}

/** Dashboard page relative to the landing page. Keeps the GitHub Pages directory. */
export function dashboardHref(clientKey?: string): string {
  return clientKey ? `index.html?client=${encodeURIComponent(clientKey)}` : 'index.html';
}
