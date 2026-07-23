import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllOrders, fetchOrderById, updateOrderStatus, type UpdateOrderStatusInput } from './ordersApi';

const ORDERS_KEY = ['orders'];

export function useOrders() {
  return useQuery({ queryKey: ORDERS_KEY, queryFn: fetchAllOrders, staleTime: 15_000 });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrderById(id!),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusInput }) => updateOrderStatus(id, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
