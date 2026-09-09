import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBusinessSettings, updateBusinessSettings } from './businessApi';

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: fetchBusinessSettings,
  });
}

export function useUpdateBusinessSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBusinessSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
    },
  });
}
