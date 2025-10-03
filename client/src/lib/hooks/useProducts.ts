// hooks/useProducts.ts
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { FieldValues } from "react-hook-form";
import { useLocation } from "react-router";
import agent from "../api/agent";
import { useStore } from "./useStore";
import { useAccount } from "./useAccount";

// -------- Types ----------
export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  stock?: number;
  // client-derived flags:
  isSelected?: boolean;
  isFavorite?: boolean;
};

export type PagedResponse<T> = {
  items: T[];
  total: number;      // total row count
  page: number;       // 1-based
  pageSize: number;
};

// -------- Hook ----------
export const useProducts = (id?: string) => {
  const {
    productsUiStore: { search, category, page, pageSize, selectedProductId },
  } = useStore();

  const { currentUser } = useAccount();
  const location = useLocation();
  const queryClient = useQueryClient();

  // ------ LIST (numbered pagination) ------
  const {
    data: productsPage,
    isLoading,
    isFetching,
    isError,
    error,
    refetch, // added
  } = useQuery<PagedResponse<Product>>({
    queryKey: ["products", { search, category, page, pageSize }],
    queryFn: async () => {

      console.log('fetching products..');  

      const res = await agent.get<PagedResponse<Product>>("/products", {
        params: {
          search,
          category,   // send null/empty as your API expects
          page,       // 1-based
          pageSize,
        },
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
    enabled: (
      !id &&
      location.pathname === "/products" &&
      !!currentUser), // gate like your sample
    select: (data) => ({
      ...data,
      items: data.items.map((p) => ({
        ...p,
        isSelected: p.id === selectedProductId,
        isFavorite: true
      })),
    }),
    staleTime: 100,
  });

  // convenience derived values
  const totalPages =
    productsPage ? Math.max(1, Math.ceil(productsPage.total / productsPage.pageSize)) : 1;

  // ------ DETAIL ------
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isErrorProduct,
    error: errorProduct,
  } = useQuery<Product>({
    queryKey: ["products", id],
    queryFn: async () => {
      const res = await agent.get<Product>(`/products/${id}`);
      return res.data;
    },
    enabled: !!id && !!currentUser,
    select: (data) => ({
      ...data,
      isFavorite: true,
      isSelected: data.id === selectedProductId,
    }),
    staleTime: 30_000,
  });

  // ------ MUTATIONS ------

  // Create
  const createProduct = useMutation({
    mutationFn: async (values: FieldValues) => {
      const res = await agent.post<Product>("/products", values);
      return res.data;
    },
    onSuccess: async () => {
      // New item may land on page 1 depending on sort; safest is invalidate list
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Update (price/stock/name/etc.)
  const updateProduct = useMutation({
    mutationFn: async (p: Product) => {
      const res = await agent.put<Product>("/products", p);
      return res.data;
    },
    onSuccess: async (updated) => {
      // Update detail cache (if present)
      queryClient.setQueryData<Product>(["products", updated.id], (old) =>
        old ? { ...old, ...updated } : updated
      );

      // Update the current page surgically to reduce flicker
      queryClient.setQueryData<PagedResponse<Product>>(
        ["products", { search, category, page, pageSize }],
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
              }
            : old
      );

      // Also ensure any other cached pages are eventually consistent
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Delete (with small optimistic page update)
  const deleteProduct = useMutation({
    mutationFn: async (deleteId: string) => {
      await agent.delete(`/products/${deleteId}`);
      return deleteId;
    },
    onMutate: async (deleteId) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });

      // snapshot current page
      const key = ["products", { search, category, page, pageSize }];
      const prevPage = queryClient.getQueryData<PagedResponse<Product>>(key);

      // optimistic: remove from current page
      if (prevPage) {
        queryClient.setQueryData<PagedResponse<Product>>(key, {
          ...prevPage,
          items: prevPage.items.filter((p) => p.id !== deleteId),
          total: Math.max(0, prevPage.total - 1),
        });
      }

      // drop detail cache immediately
      queryClient.removeQueries({ queryKey: ["products", deleteId] });

      return { prevPage, key };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prevPage && ctx.key) {
        queryClient.setQueryData(ctx.key, ctx.prevPage);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  // Toggle favorite (optimistic)
  const toggleFavorite = useMutation({
    mutationFn: async (prodId: string) => {
      await agent.post(`/products/${prodId}/favorite`);
      return prodId;
    },
    onMutate: async (prodId) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      await queryClient.cancelQueries({ queryKey: ["products", prodId] });

      const prevDetail = queryClient.getQueryData<Product>(["products", prodId]);
      const listKey = ["products", { search, category, page, pageSize }];
      const prevList = queryClient.getQueryData<PagedResponse<Product>>(listKey);

      const flip = (p?: Product) => (p ? { ...p, isFavorite: !p.isFavorite } : p);

      queryClient.setQueryData<Product>(["products", prodId], (old) => flip(old));
      if (prevList) {
        queryClient.setQueryData<PagedResponse<Product>>(listKey, {
          ...prevList,
          items: prevList.items.map((p) => (p.id === prodId ? (flip(p) as Product) : p)),
        });
      }

      return { prevDetail, prevList, listKey };
    },
    onError: (_err, prodId, ctx) => {
      if (!ctx) return;
      queryClient.setQueryData(["products", prodId], ctx.prevDetail);
      if (ctx.prevList && ctx.listKey) {
        queryClient.setQueryData(ctx.listKey, ctx.prevList);
      }
    },
    onSettled: async (_res, _err, prodId) => {
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      if (prodId) await queryClient.invalidateQueries({ queryKey: ["products", prodId] });
    },
  });

  return {
    // list
    productsPage,
    totalPages,
    isLoading,
    isFetching,
    isError,
    error,
    refetch, // added

    // detail
    product,
    isLoadingProduct,
    isErrorProduct,
    errorProduct,

    // mutations
    createProduct,
    updateProduct,
    deleteProduct,
    toggleFavorite,
  };
};
