import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { issueFromApi, toSnapshot } from './shape.mjs';

test('issueFromApi keeps the fields the client page shows', () => {
  const issue = issueFromApi({
    key: 'CO-100',
    fields: {
      summary: 'Guarantor file',
      status: { name: 'In Progress' },
      issuetype: { name: 'Story' },
      assignee: { displayName: 'Alex Kim' },
      updated: '2026-11-02T15:04:00.000+0000',
    },
  }, 'https://example.atlassian.net/');
  assert.deepEqual(issue, {
    key: 'CO-100',
    summary: 'Guarantor file',
    status: 'In Progress',
    type: 'Story',
    assignee: 'Alex Kim',
    reporter: '',
    component: '',
    labels: [],
    updated: '2026-11-02',
    url: 'https://example.atlassian.net/browse/CO-100',
  });
});

test('issueFromApi keeps reporter, component, and labels', () => {
  const issue = issueFromApi({
    key: 'CO-200',
    fields: {
      summary: 'Medicaid scrub',
      reporter: { displayName: 'Jessica Johns' },
      components: [{ name: 'Medicaid' }, { name: 'Reporting' }],
      labels: ['MaineHealth'],
    },
  }, '');
  assert.equal(issue.reporter, 'Jessica Johns');
  assert.equal(issue.component, 'Medicaid');
  assert.deepEqual(issue.labels, ['MaineHealth']);
  assert.equal(issue.url, '');
});

test('toSnapshot groups issues by client id', () => {
  const snapshot = toSnapshot({
    pulledAt: '2026-11-04T22:00:00.000Z',
    site: 'https://example.atlassian.net',
    results: [
      { id: 'maine', name: 'MaineHealth', jql: 'project = CO AND text ~ "MaineHealth"', issues: [{ key: 'CO-1', fields: { summary: 'One' } }] },
      { id: 'washu', name: 'WashU', jql: 'project = CO AND text ~ "WashU"', issues: [] },
    ],
  });
  assert.equal(snapshot.clients.maine.issues[0].key, 'CO-1');
  assert.equal(snapshot.clients.maine.issues[0].summary, 'One');
  assert.deepEqual(snapshot.clients.washu.issues, []);
  assert.equal(snapshot.site, 'https://example.atlassian.net');
  assert.equal(snapshot.source, 'jira');
});

test('mock issues look like a Jira connection and can be grouped', () => {
  const config = JSON.parse(readFileSync(new URL('../../jira/clients.json', import.meta.url), 'utf8'));
  const mock = JSON.parse(readFileSync(new URL('../../jira/mock-clients.json', import.meta.url), 'utf8'));
  assert.equal(mock.source, 'mock');
  for (const row of config.clients) {
    const clientIssues = mock.clients[row.id] && mock.clients[row.id].issues;
    assert.ok(clientIssues && clientIssues.length, `${row.id} has tickets`);
  }
  const issues = Object.values(mock.clients).flatMap((client) => client.issues);
  const reporters = new Set();
  const components = new Set();
  for (const issue of issues) {
    assert.match(issue.key, /^CO-\d+$/);
    assert.ok(issue.reporter, issue.key);
    assert.ok(issue.component, issue.key);
    assert.ok(Array.isArray(issue.labels) && issue.labels.length, issue.key);
    assert.equal(issue.url, '');
    reporters.add(issue.reporter);
    components.add(issue.component);
  }
  assert.ok(reporters.has('Tiffany Rudy'));
  assert.ok(reporters.has('Jessica Johns'));
  assert.ok(components.size >= 8);
});
