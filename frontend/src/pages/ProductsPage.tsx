import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createProduct, deleteProduct, fetchProducts, updateProduct } from "../api/endpoints";
import type { ProductResponse } from "../api/types";

const schema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  stockQuantity: z.coerce.number().int().nonnegative()
});

type FormValues = z.infer<typeof schema>;
type FormInput = z.input<typeof schema>;

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ProductResponse | null>(null);

  const { data = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: 0, stockQuantity: 0 }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (editing) {
        return updateProduct(editing.id, values);
      }
      return createProduct(values);
    },
    onSuccess: () => {
      form.reset({ name: "", price: 0, stockQuantity: 0 });
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
    []
  );

  return (
    <section className="stack">
      <header>
        <h1>Products</h1>
      </header>

      <div className="card product-entry-card">
        <h2>{editing ? "Edit Product" : "Add Product"}</h2>
        <p className="muted">Enter product details clearly to keep billing accurate.</p>
        <form
          className="grid product-form-grid"
          onSubmit={form.handleSubmit((values) => {
            saveMutation.mutate(values);
          })}
        >
          <label>
            Product Name
            <input placeholder="Example: Basmati Rice 25kg" {...form.register("name")} />
          </label>
          <label>
            Selling Price (Rs.)
            <input placeholder="0.00" type="number" step="0.01" {...form.register("price")} />
          </label>
          <label>
            Available Stock
            <input placeholder="0" type="number" {...form.register("stockQuantity")} />
          </label>
          <div className="actions">
            <button className="button" disabled={saveMutation.isPending} type="submit">
              {saveMutation.isPending ? "Saving..." : editing ? "Update Product" : "Create Product"}
            </button>
            {editing && (
              <button
                className="button button-ghost"
                type="button"
                onClick={() => {
                  setEditing(null);
                  form.reset({ name: "", price: 0, stockQuantity: 0 });
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Product Catalog</h2>
        {isLoading ? (
          <p className="muted">Loading products...</p>
        ) : data.length === 0 ? (
          <p className="muted">No products found. Add your first product above.</p>
        ) : (
          <div className="products-card-grid">
            {data.map((product) => (
              <article className="product-tile" key={product.id}>
                <div className="product-tile-head">
                  <h3>{product.name}</h3>
                  <span
                    className={`stock-chip ${product.stockQuantity <= 5 ? "stock-low" : product.stockQuantity <= 15 ? "stock-mid" : "stock-good"}`}
                  >
                    {product.stockQuantity <= 5 ? "Low Stock" : product.stockQuantity <= 15 ? "Medium Stock" : "In Stock"}
                  </span>
                </div>
                <div className="product-tile-body">
                  <p>
                    <span>Price</span>
                    <strong>Rs. {money.format(product.price)}</strong>
                  </p>
                  <p>
                    <span>Stock Qty</span>
                    <strong>{product.stockQuantity}</strong>
                  </p>
                </div>
                <div className="product-tile-actions">
                  <button
                    className="icon-button icon-edit"
                    type="button"
                    title="Update Product"
                    aria-label="Update Product"
                    onClick={() => {
                      setEditing(product);
                      form.reset({
                        name: product.name,
                        price: product.price,
                        stockQuantity: product.stockQuantity
                      });
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm2.92 2.33H5v-.92l8.06-8.06.92.92-8.06 8.06ZM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.13-1.14Z" />
                    </svg>
                  </button>
                  <button
                    className="icon-button icon-delete"
                    type="button"
                    title="Delete Product"
                    aria-label="Delete Product"
                    onClick={() => deleteMutation.mutate(product.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M9 3h6l1 2h5v2H3V5h5l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Zm1 12h10a2 2 0 0 0 2-2V8H5v11a2 2 0 0 0 2 2Z" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
