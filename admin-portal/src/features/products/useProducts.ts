import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  fetchAllProducts,
  fetchProductById,
  setProductEnabled,
  setProductVisibility,
  updateProduct,
  type ProductInput,
} from './productsApi';

const PRODUCTS_KEY = ['products'];

export function useProducts() {
  return useQuery({ queryKey: PRODUCTS_KEY, queryFn: fetchAllProducts, staleTime: 30_000 });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id }: { data: ProductInput; id?: string }) => createProduct(data, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) => updateProduct(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useToggleProductVisibility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => setProductVisibility(id, visible),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}

export function useToggleProductEnabled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, inStock }: { id: string; inStock: boolean }) => setProductEnabled(id, inStock),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUCTS_KEY }),
  });
}
