/** Turn a Jira search response into the snapshot the command center reads. */

export function issueFromApi(issue, site) {
  const fields = issue.fields || {};
  const status = fields.status && fields.status.name;
  const type = fields.issuetype && fields.issuetype.name;
  const assignee = fields.assignee && fields.assignee.displayName;
  const reporter = fields.reporter && fields.reporter.displayName;
  const components = Array.isArray(fields.components) ? fields.components.map((item) => item && item.name).filter(Boolean) : [];
  const labels = Array.isArray(fields.labels) ? fields.labels.map((label) => String(label)) : [];
  const done = /done|closed|resolved/i.test(String(status || ''));
  return {
    key: String(issue.key || ''),
    summary: String(fields.summary || ''),
    status: String(status || ''),
    type: String(type || ''),
    assignee: String(assignee || ''),
    reporter: String(reporter || ''),
    component: String(components[0] || ''),
    labels,
    opened: String(fields.created || '').slice(0, 10),
    closed: done ? String(fields.resolutiondate || '').slice(0, 10) : '',
    updated: String(fields.updated || '').slice(0, 10),
    url: site ? `${site.replace(/\/$/, '')}/browse/${issue.key}` : '',
  };
}

export function toSnapshot({ pulledAt, site, results }) {
  const clients = {};
  for (const row of results) {
    clients[row.id] = {
      name: row.name,
      jql: row.jql,
      issues: (row.issues || []).map((issue) => issueFromApi(issue, site)),
    };
  }
  return { source: 'jira', pulledAt, site: site.replace(/\/$/, ''), clients };
}
