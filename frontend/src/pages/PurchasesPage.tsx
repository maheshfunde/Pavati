import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { createPurchase, fetchProducts } from "../api/endpoints";

const schema = z.object({
  supplierName: z.string().min(2),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().positive(),
        quantity: z.coerce.number().int().positive(),
        purchasePrice: z.coerce.number().positive()
      })
    )
    .min(1)
});

type FormValues = z.infer<typeof schema>;

export function PurchasesPage() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      supplierName: "",
      items: [{ productId: 0, quantity: 1, purchasePrice: 0 }]
    }
  });

  const items = useFieldArray({ control: form.control, name: "items" });

  const mutation = useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      form.reset({
        supplierName: "",
        items: [{ productId: 0, quantity: 1, purchasePrice: 0 }]
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return (
    <section className="stack">
      <header>
        <h1>Purchase Entry</h1>
        <p className="muted">Record supplier purchases to increase product stock.</p>
      </header>

      <div className="card">
        <h2>New Purchase</h2>
        <form className="grid two-gap" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <label>
            Supplier Name
            <input placeholder="ABC Distributors" {...form.register("supplierName")} />
          </label>

          {items.fields.map((field, index) => (
            <div className="grid purchase-row" key={field.id}>
              <select {...form.register(`items.${index}.productId`)}>
                <option value={0}>Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input type="number" min={1} placeholder="Qty" {...form.register(`items.${index}.quantity`)} />
              <input
                type="number"
                min={0.01}
                step="0.01"
                placeholder="Purchase price"
                {...form.register(`items.${index}.purchasePrice`)}
              />
              <button className="button button-ghost" type="button" onClick={() => items.remove(index)}>
                Remove
              </button>
            </div>
          ))}

          <div className="actions">
            <button
              className="button button-ghost"
              type="button"
              onClick={() => items.append({ productId: 0, quantity: 1, purchasePrice: 0 })}
            >
              Add Item
            </button>
            <button className="button" type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Purchase"}
            </button>
          </div>
        </form>

        {mutation.isSuccess && <p className="success-text">Purchase saved and stock updated.</p>}
      </div>
    </section>
  );
}
