import assert from 'node:assert/strict';
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
    updated: '2026-11-02',
    url: 'https://example.atlassian.net/browse/CO-100',
  });
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
});
