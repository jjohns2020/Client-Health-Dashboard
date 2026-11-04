import { describe, expect, it } from 'vitest';
import { clientFromSearch, dashboardHref } from './siteLinks';

describe('site links', () => {
  it('reads a known client from the dashboard query', () => {
    expect(clientFromSearch('?client=washu', ['maine', 'washu'])).toBe('washu');
    expect(clientFromSearch('client=maine', ['maine', 'washu'])).toBe('maine');
  });

  it('ignores a missing or unknown client', () => {
    expect(clientFromSearch('', ['maine'])).toBeNull();
    expect(clientFromSearch('?client=other', ['maine', 'washu'])).toBeNull();
  });

  it('builds a relative dashboard link', () => {
    expect(dashboardHref()).toBe('index.html');
    expect(dashboardHref('washu')).toBe('index.html?client=washu');
  });
});
