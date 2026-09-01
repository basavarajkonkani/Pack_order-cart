import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchPrintedPouchPricing,
  savePrintedPouchPricing,
  type PrintedPouchPricing,
} from './printedPricingApi';

const QUERY_KEY = ['printedPouchPricing'];

export function usePrintedPricing() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchPrintedPouchPricing,
    staleTime: 30_000,
  });
}

export function useSavePrintedPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<PrintedPouchPricing, 'updatedAt'>) =>
      savePrintedPouchPricing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
