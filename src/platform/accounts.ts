/** Sample Client Health sign-ins. Nothing here is a production credential. */
export type AccountRole = 'client' | 'internal';

export interface Account {
  email: string;
  password: string;
  name: string;
  organization: string;
  role: AccountRole;
  /** Health system this person opens. Internal accounts can switch clients after sign-in. */
  clientKey?: string;
}

export const DEMO_PASSWORD = 'ClientHealth1';

export const accounts: Account[] = [
  {
    email: 'jordan.hale@mainehealth.org',
    password: DEMO_PASSWORD,
    name: 'Jordan Hale',
    organization: 'MaineHealth',
    role: 'client',
    clientKey: 'maine',
  },
  {
    email: 'priya.shah@wustl.edu',
    password: DEMO_PASSWORD,
    name: 'Priya Shah',
    organization: 'WashU',
    role: 'client',
    clientKey: 'washu',
  },
  {
    email: 'morgan.ellis@experianhealth.com',
    password: DEMO_PASSWORD,
    name: 'Morgan Ellis',
    organization: 'Experian Health',
    role: 'internal',
  },
];

export function findAccount(email: string): Account | undefined {
  const key = email.trim().toLowerCase();
  return accounts.find((a) => a.email === key);
}
