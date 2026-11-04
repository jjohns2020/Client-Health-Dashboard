/** Turn a Jira search response into the snapshot the command center reads. */

export function issueFromApi(issue, site) {
  const fields = issue.fields || {};
  const status = fields.status && fields.status.name;
  const type = fields.issuetype && fields.issuetype.name;
  const assignee = fields.assignee && fields.assignee.displayName;
  return {
    key: String(issue.key || ''),
    summary: String(fields.summary || ''),
    status: String(status || ''),
    type: String(type || ''),
    assignee: String(assignee || ''),
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
  return { pulledAt, site: site.replace(/\/$/, ''), clients };
}
