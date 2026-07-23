import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllCustomers, fetchCustomerById, setCustomerRole } from './customersApi';

const CUSTOMERS_KEY = ['customers'];

export function useCustomers() {
  return useQuery({ queryKey: CUSTOMERS_KEY, queryFn: fetchAllCustomers, staleTime: 30_000 });
}

export function useCustomer(uid: string | undefined) {
  return useQuery({
    queryKey: ['customer', uid],
    queryFn: () => fetchCustomerById(uid!),
    enabled: !!uid,
  });
}

export function useSetCustomerRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: 'customer' | 'admin' }) => setCustomerRole(uid, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOMERS_KEY }),
  });
}
