import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchDataRoomDocuments,
  fetchFundVehicle,
  fetchFundVehicles,
  fetchIndicationsForFundVehicle,
  fetchOrganization,
  submitIndication,
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

export function useSubmitIndication(fundVehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitIndicationInput) => submitIndication(input),
    onSuccess: () => {
      // Invalidate rather than optimistically write the response in — the server is the
      // source of truth for allocation math (see api.ts), so we re-fetch to reconcile.
      queryClient.invalidateQueries({ queryKey: fundVehicleKeys.detail(fundVehicleId) });
      queryClient.invalidateQueries({ queryKey: fundVehicleKeys.indications(fundVehicleId) });
      queryClient.invalidateQueries({ queryKey: fundVehicleKeys.all });
    },
  });
}
