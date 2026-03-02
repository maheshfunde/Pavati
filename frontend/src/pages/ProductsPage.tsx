import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

  return (
    <section className="stack">
      <header>
        <h1>Products</h1>
      </header>

      <div className="card">
        <h2>{editing ? "Edit Product" : "Add Product"}</h2>
        <form
          className="grid form-row"
          onSubmit={form.handleSubmit((values) => {
            saveMutation.mutate(values);
          })}
        >
          <input placeholder="Name" {...form.register("name")} />
          <input placeholder="Price" type="number" step="0.01" {...form.register("price")} />
          <input placeholder="Stock" type="number" {...form.register("stockQuantity")} />
          <button className="button" disabled={saveMutation.isPending} type="submit">
            {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
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
              Cancel
            </button>
          )}
        </form>
      </div>

      <div className="card">
        {isLoading ? (
          <p className="muted">Loading products...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>Rs. {product.price}</td>
                  <td>{product.stockQuantity}</td>
                  <td className="actions">
                    <button
                      className="button button-ghost"
                      type="button"
                      onClick={() => {
                        setEditing(product);
                        form.reset({
                          name: product.name,
                          price: product.price,
                          stockQuantity: product.stockQuantity
                        });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      onClick={() => deleteMutation.mutate(product.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
