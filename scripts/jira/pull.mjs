/**
 * Pull open-or-recent Jira issues for each client that has a JQL query.
 *
 * Credentials stay in the environment. Nothing in this script reads email.
 *   JIRA_BASE_URL   https://your-site.atlassian.net
 *   JIRA_EMAIL      Atlassian account email
 *   JIRA_API_TOKEN  API token for that account
 *
 * Writes public/jira-clients.json, which the command center loads per client.
 * Clients with an empty jql are skipped. If none are configured, any previous
 * snapshot is removed so the page does not keep stale issues.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toSnapshot } from './shape.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const configPath = resolve(root, 'jira/clients.json');
const outPath = resolve(root, 'public/jira-clients.json');
const MAX = 25;

function configured(config) {
  return (config.clients || []).filter((row) => row && row.id && String(row.jql || '').trim());
}

async function search(site, auth, jql) {
  const response = await fetch(`${site}/rest/api/3/search/jql`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jql,
      maxResults: MAX,
      fields: ['summary', 'status', 'issuetype', 'assignee', 'reporter', 'components', 'labels', 'updated'],
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Jira search failed (${response.status}). ${detail}`);
  }
  const body = await response.json();
  return body.issues || [];
}

const config = JSON.parse(readFileSync(configPath, 'utf8'));
const rows = configured(config);
if (!rows.length) {
  rmSync(outPath, { force: true });
  console.log('No client JQL is set in jira/clients.json. Jira stays disconnected.');
  process.exit(0);
}

const site = String(process.env.JIRA_BASE_URL || '').replace(/\/$/, '');
const email = process.env.JIRA_EMAIL || '';
const token = process.env.JIRA_API_TOKEN || '';
if (!site.startsWith('https://') || !email || !token) {
  console.error('Set JIRA_BASE_URL (https://…), JIRA_EMAIL, and JIRA_API_TOKEN before pulling.');
  process.exit(1);
}

const auth = Buffer.from(`${email}:${token}`).toString('base64');
const results = [];
for (const row of rows) {
  const issues = await search(site, auth, String(row.jql).trim());
  results.push({ id: row.id, name: row.name || row.id, jql: String(row.jql).trim(), issues });
  console.log(`${row.id}: ${issues.length} issue${issues.length === 1 ? '' : 's'}`);
}

const snapshot = toSnapshot({ pulledAt: new Date().toISOString(), site, results });
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote ${outPath}`);
