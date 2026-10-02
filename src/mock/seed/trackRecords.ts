import type { TrackRecordEntry } from '../../types/entities';

// Prior funds per accredited manager — firm-level evidence shown on GP profile pages.
// Compact: [id, gpOrg, fund name, vintage, strategy, net IRR %, MOIC, status].
type Spec = [string, string, string, number, string, number, number, TrackRecordEntry['status']];

const SPECS: Spec[] = [
  // Meridian Growth Partners
  ['tr-1', 'org-gp-1', 'Meridian Growth Fund I', 2012, 'Growth Equity', 19.4, 2.6, 'REALIZED'],
  ['tr-2', 'org-gp-1', 'Meridian Growth Fund II', 2016, 'Growth Equity', 21.8, 2.5, 'REALIZED'],
  ['tr-3', 'org-gp-1', 'Meridian Growth Fund III', 2021, 'Growth Equity', 24.6, 2.4, 'ACTIVE'],
  // Highfield Credit Advisors
  ['tr-4', 'org-gp-2', 'Highfield Direct Lending Fund IV', 2014, 'Private Credit', 9.8, 1.5, 'REALIZED'],
  ['tr-5', 'org-gp-2', 'Highfield Direct Lending Fund V', 2018, 'Private Credit', 10.4, 1.6, 'REALIZED'],
  ['tr-6', 'org-gp-2', 'Highfield Direct Lending Fund VI', 2022, 'Private Credit', 10.9, 1.6, 'ACTIVE'],
  ['tr-7', 'org-gp-2', 'Highfield Opportunistic Credit Fund II', 2020, 'Private Credit', 12.6, 1.7, 'ACTIVE'],
  // Sable Ventures
  ['tr-8', 'org-gp-3', 'Sable Ventures Fund I', 2020, 'Venture Capital', 22.1, 3.2, 'ACTIVE'],
  // Dunes Real Assets
  ['tr-9', 'org-gp-4', 'Dunes Gulf Logistics Fund I', 2015, 'Real Assets', 13.2, 1.9, 'REALIZED'],
  ['tr-10', 'org-gp-4', 'Dunes Gulf Infrastructure Fund I', 2019, 'Real Assets', 14.5, 1.8, 'ACTIVE'],
  ['tr-11', 'org-gp-4', 'Dunes Gulf Residential Opportunities', 2017, 'Real Assets', 11.7, 1.7, 'REALIZED'],
  // Corniche Capital Partners
  ['tr-12', 'org-gp-5', 'Corniche GCC Buyout Fund I', 2016, 'Private Equity Buyout', 22.9, 2.8, 'REALIZED'],
  ['tr-13', 'org-gp-5', 'Corniche GCC Buyout Fund II', 2020, 'Private Equity Buyout', 24.3, 3.1, 'ACTIVE'],
];

export const trackRecords: TrackRecordEntry[] = SPECS.map(
  ([id, gpOrganizationId, fundName, vintage, strategy, netIrr, moic, status]) => ({
    id,
    gpOrganizationId,
    fundName,
    vintage,
    strategy,
    netIrr,
    moic,
    status,
  }),
);
