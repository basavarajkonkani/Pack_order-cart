import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllPackagingRequests,
  fetchPackagingRequestById,
  updatePackagingRequest,
  type UpdatePackagingRequestInput,
} from './packagingApi';

const PACKAGING_KEY = ['packaging-requests'];

export function usePackagingRequests() {
  return useQuery({ queryKey: PACKAGING_KEY, queryFn: fetchAllPackagingRequests, staleTime: 15_000 });
}

export function usePackagingRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['packaging-request', id],
    queryFn: () => fetchPackagingRequestById(id!),
    enabled: !!id,
  });
}

export function useUpdatePackagingRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePackagingRequestInput }) => updatePackagingRequest(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PACKAGING_KEY }),
  });
}
