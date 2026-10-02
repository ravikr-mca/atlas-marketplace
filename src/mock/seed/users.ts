import type { User } from '../../types/entities';

// One-or-more user per organization; every role is represented. `verified` is the
// user's own identity/e-mail verification — the organization's accreditation (in
// organizations.ts) is what actually gates marketplace actions.
export const users: User[] = [
  // GPs — user-gp-1 stays first: existing tests/screens treat it as the default GP.
  { id: 'user-gp-1', name: 'Elena Marsh', role: 'GP', organizationId: 'org-gp-1', title: 'Partner, Investor Relations', verified: true },
  { id: 'user-gp-2', name: 'Daniel Cho', role: 'GP', organizationId: 'org-gp-2', title: 'Head of Capital Formation', verified: true },
  { id: 'user-gp-3', name: 'Priya Raman', role: 'GP', organizationId: 'org-gp-3', title: 'Founding Partner', verified: true },
  { id: 'user-gp-4', name: 'Rashid Al Nuaimi', role: 'GP', organizationId: 'org-gp-4', title: 'Managing Director, Fundraising', verified: true },
  { id: 'user-gp-5', name: 'Noura Al Hamadi', role: 'GP', organizationId: 'org-gp-5', title: 'Partner, Capital Markets', verified: true },
  { id: 'user-gp-6', name: 'Tomas Brandt', role: 'GP', organizationId: 'org-gp-6', title: 'Founder', verified: false },

  // LPs
  { id: 'user-lp-1', name: 'Omar Al Farsi', role: 'LP', organizationId: 'org-lp-1', title: 'Investment Director', verified: true },
  { id: 'user-lp-2', name: 'Sofia Bernasconi', role: 'LP', organizationId: 'org-lp-2', title: 'Portfolio Manager, Alternatives', verified: true },
  { id: 'user-lp-3', name: 'Khalid Nasser', role: 'LP', organizationId: 'org-lp-3', title: 'Senior Associate', verified: true },
  { id: 'user-lp-4', name: 'Hamad Al Mansoori', role: 'LP', organizationId: 'org-lp-4', title: 'Principal', verified: true },
  { id: 'user-lp-5', name: 'Dana Al Thani', role: 'LP', organizationId: 'org-lp-5', title: 'Head of Private Markets', verified: true },
  { id: 'user-lp-6', name: 'Faisal Al Otaibi', role: 'LP', organizationId: 'org-lp-6', title: 'Chief Investment Officer', verified: true },
  { id: 'user-lp-7', name: 'Mariam Al Maktoum', role: 'LP', organizationId: 'org-lp-7', title: 'Investment Manager', verified: true },
  { id: 'user-lp-8', name: 'Yusuf Saleh', role: 'LP', organizationId: 'org-lp-8', title: 'Private Investor', verified: false },

  // Greenstone staff — platform operations and compliance (both reached via mock Entra ID SSO)
  { id: 'user-admin-1', name: 'Layla Haddad', role: 'ADMIN', organizationId: 'org-greenstone', title: 'Platform Operations', verified: true },
  { id: 'user-compliance-1', name: 'Arjun Mehta', role: 'COMPLIANCE', organizationId: 'org-greenstone', title: 'Compliance Officer', verified: true },
];
