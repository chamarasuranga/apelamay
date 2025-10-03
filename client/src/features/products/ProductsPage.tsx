import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useProducts } from "../../lib/hooks/useProducts";
import { useStore } from "../../lib/hooks/useStore";
import type { Product } from "../../lib/hooks/useProducts";

export const ProductsPage = observer(function ProductsPage() {
  const { productsUiStore: ui } = useStore();
  const {
    productsPage,
    totalPages,
    isLoading,
    isFetching,
    isError,
    error,
    createProduct,
    // updateProduct, // still unused
    deleteProduct,
    toggleFavorite,
    refetch,
  } = useProducts();

  // local state for simple create form
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) return;
    createProduct.mutate(
      { name: newName, price: parseFloat(newPrice), category: newCategory },
      {
        onSuccess: () => {
          setNewName("");
          setNewPrice("");
          setNewCategory("");
        },
      }
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Products</h2>

      {/* Search + Category */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12}}>
        <input
          type="text"
          placeholder="Search..."
          value={ui.search}
          onChange={(e) => ui.setSearch(e.target.value)}
        />
        <select
          value={ui.category ?? ""}
          onChange={(e) => ui.setCategory(e.target.value || null)}
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Toys">Toys</option>
          <option value="Furniture">Furniture</option>
        </select>
        <button onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing..." : "Reload"}
        </button>
      </div>

      {/* Create Product */}
      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input placeholder="Price" type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
        <input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
        <button type="submit" disabled={createProduct.isPending || !newName || !newPrice}>
          {createProduct.isPending ? 'Saving...' : 'Add'}
        </button>
      </form>

      {/* Paging Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button disabled={ui.page <= 1} onClick={() => ui.setPage(ui.page - 1)}>
          Prev
        </button>
        <span>
          Page {ui.page} / {totalPages}
        </span>
        <button
          disabled={ui.page >= totalPages}
          onClick={() => ui.setPage(ui.page + 1)}
        >
          Next
        </button>
        {isFetching && <span> Refreshing…</span>}
      </div>

      {/* Loading / Error */}
      {isLoading && <p>Loading...</p>}
      {isError && <p style={{ color: "crimson" }}>{(error as Error).message}</p>}

      {/* Products List */}
      {productsPage?.items?.length ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {productsPage.items.map((p: Product) => (
            <li
              key={p.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                marginBottom: 10,
                padding: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{p.name}</strong> <br />
                <small>{p.category}</small> <br />
                <span>${(typeof p.price === 'number' ? p.price : Number(p.price)).toFixed(2)}</span>
                {p.isSelected && (
                  <span style={{ marginLeft: 8, color: "green" }}>(Selected)</span>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => ui.selectProduct(p.id)}>
                  {ui.selectedProductId === p.id ? "Unselect" : "Select"}
                </button>
                <button
                  onClick={() => toggleFavorite.mutate(p.id)}
                  disabled={toggleFavorite.isPending}
                >
                  {p.isFavorite ? "★ Unfavorite" : "☆ Favorite"}
                </button>
                <button
                  onClick={() => deleteProduct.mutate(p.id)}
                  disabled={deleteProduct.isPending}
                  style={{ color: "crimson" }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !isLoading && <p>No results found.</p>
      )}
    </div>
  );
});
