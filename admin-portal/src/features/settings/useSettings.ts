import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchStoreSettings, updateStoreSettings } from './settingsApi';
import type { StoreSettings } from '@/types/firestore';

const SETTINGS_KEY = ['store-settings'];

export function useStoreSettings() {
  return useQuery({ queryKey: SETTINGS_KEY, queryFn: fetchStoreSettings, staleTime: 60_000 });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StoreSettings) => updateStoreSettings(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}
