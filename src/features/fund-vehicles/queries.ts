import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllIndications,
  fetchDataRoomDocuments,
  fetchFundVehicle,
  fetchFundVehicles,
  fetchIndicationsForFundVehicle,
  fetchIndicationsForGpOrg,
  fetchIndicationsForOrg,
  fetchOrganization,
  fetchOrganizations,
  fetchTrackRecords,
  fetchApprovalQueue,
  reviewOrganization,
  type ReviewDecision,
  submitIndication,
  transitionIndication,
  type IndicationAction,
  type SubmitIndicationInput,
} from '../../mock/api';

export const fundVehicleKeys = {
  all: ['fund-vehicles'] as const,
  detail: (id: string) => ['fund-vehicles', id] as const,
  indications: (id: string) => ['fund-vehicles', id, 'indications'] as const,
  dataRoom: (id: string) => ['fund-vehicles', id, 'data-room'] as const,
};

export function useFundVehicles() {
  return useQuery({ queryKey: fundVehicleKeys.all, queryFn: fetchFundVehicles });
}

export function useFundVehicle(id: string) {
  return useQuery({ queryKey: fundVehicleKeys.detail(id), queryFn: () => fetchFundVehicle(id), enabled: !!id });
}

export function useOrganizations() {
  return useQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations });
}

export function useOrganization(id: string | undefined) {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => fetchOrganization(id as string),
    enabled: !!id,
  });
}

export function useIndicationsForFundVehicle(id: string) {
  return useQuery({
    queryKey: fundVehicleKeys.indications(id),
    queryFn: () => fetchIndicationsForFundVehicle(id),
    enabled: !!id,
  });
}

export function useDataRoomDocuments(id: string) {
  return useQuery({ queryKey: fundVehicleKeys.dataRoom(id), queryFn: () => fetchDataRoomDocuments(id), enabled: !!id });
}

export function useIndicationsForOrg(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId, 'indications'],
    queryFn: () => fetchIndicationsForOrg(orgId),
    enabled: !!orgId,
  });
}

export function useIndicationsForGpOrg(gpOrganizationId: string) {
  return useQuery({
    queryKey: ['organizations', gpOrganizationId, 'gp-indications'],
    queryFn: () => fetchIndicationsForGpOrg(gpOrganizationId),
    enabled: !!gpOrganizationId,
  });
}

export function useAllIndications() {
  return useQuery({ queryKey: ['indications', 'all'], queryFn: fetchAllIndications });
}

function invalidateIndicationEffects(queryClient: ReturnType<typeof useQueryClient>, fundVehicleId?: string) {
  // A submission or a state transition can change both the fund's committed total and
  // any org's indications list — invalidate broadly rather than trying to enumerate
  // every affected cache key by hand (and risk missing one as features grow).
  if (fundVehicleId) {
    queryClient.invalidateQueries({ queryKey: fundVehicleKeys.detail(fundVehicleId) });
    queryClient.invalidateQueries({ queryKey: fundVehicleKeys.indications(fundVehicleId) });
  }
  queryClient.invalidateQueries({ queryKey: fundVehicleKeys.all });
  queryClient.invalidateQueries({
    predicate: (query) => query.queryKey.some((k) => typeof k === 'string' && k.includes('indications')),
  });
}

export function useSubmitIndication(fundVehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitIndicationInput) => submitIndication(input),
    // Invalidate rather than optimistically write the response in — the server is the
    // source of truth for allocation math (see api.ts), so we re-fetch to reconcile.
    onSuccess: () => invalidateIndicationEffects(queryClient, fundVehicleId),
  });
}

// No fundVehicleId here on purpose — dashboards act on indications spanning many funds
// at once, so this only invalidates the broad, cross-fund caches (see the predicate
// above), not a single fund's detail/indications keys.
export function useTransitionIndication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: IndicationAction; notes?: string }) =>
      transitionIndication(id, action, notes),
    onSuccess: () => invalidateIndicationEffects(queryClient),
  });
}

export function useTrackRecords(orgId: string | undefined) {
  return useQuery({ queryKey: ['organizations', orgId, 'track-record'], queryFn: () => fetchTrackRecords(orgId as string), enabled: !!orgId });
}

export function useApprovalQueue() {
  return useQuery({ queryKey: ['approvals'], queryFn: fetchApprovalQueue });
}

export function useReviewOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; decision: ReviewDecision; reason?: string }) => reviewOrganization(input),
    // Accreditation drives permissions everywhere, so refresh everything that depends on it.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
