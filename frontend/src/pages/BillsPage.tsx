import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  createBill,
  downloadBillInvoice,
  fetchBills,
  fetchBillsByStatus,
  fetchCustomers,
  fetchPendingBills,
  fetchProducts,
  fetchReminderEligibleBills,
  fetchReminderMessage,
  fetchWhatsappLink,
  makePayment,
  searchBillsByCustomerName
} from "../api/endpoints";
import type { BillResponse } from "../api/types";

const billSchema = z.object({
  customerId: z.coerce.number().positive(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().positive(),
        quantity: z.coerce.number().int().positive()
      })
    )
    .min(1)
});

type BillFormValues = z.infer<typeof billSchema>;

const paymentSchema = z.object({
  billId: z.coerce.number().positive(),
  amountPaid: z.coerce.number().positive()
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type ReminderData = {
  message: string;
  whatsappLink: string;
};

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function BillsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchName, setSearchName] = useState("");
  const [filteredBills, setFilteredBills] = useState<BillResponse[] | null>(null);
  const [filterLabel, setFilterLabel] = useState("Showing all bills");
  const [remindersByBill, setRemindersByBill] = useState<Record<number, ReminderData>>({});

  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ["bills"],
    queryFn: fetchBills
  });

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const shownBills = filteredBills ?? bills;

  const billForm = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: { customerId: 0, items: [{ productId: 0, quantity: 1 }] }
  });

  const items = useFieldArray({ control: billForm.control, name: "items" });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { billId: 0, amountPaid: 0 }
  });

  const createMutation = useMutation({
    mutationFn: createBill,
    onSuccess: () => {
      billForm.reset({ customerId: 0, items: [{ productId: 0, quantity: 1 }] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setFilteredBills(null);
      setFilterLabel("Showing all bills");
    }
  });

  const paymentMutation = useMutation({
    mutationFn: ({ billId, amountPaid }: PaymentFormValues) => makePayment(billId, { amountPaid }),
    onSuccess: () => {
      paymentForm.reset({ billId: 0, amountPaid: 0 });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setFilteredBills(null);
      setFilterLabel("Showing all bills");
    }
  });

  const pendingFilterMutation = useMutation({
    mutationFn: fetchPendingBills,
    onSuccess: (data) => {
      setFilteredBills(data);
      setFilterLabel("Showing pending bills");
    }
  });

  const statusFilterMutation = useMutation({
    mutationFn: fetchBillsByStatus,
    onSuccess: (data) => {
      setFilteredBills(data);
      setFilterLabel(`Filtered by status: ${statusFilter}`);
    }
  });

  const searchMutation = useMutation({
    mutationFn: searchBillsByCustomerName,
    onSuccess: (data) => {
      setFilteredBills(data);
      setFilterLabel(`Search result for: ${searchName}`);
    }
  });

  const reminderEligibleMutation = useMutation({
    mutationFn: fetchReminderEligibleBills,
    onSuccess: (data) => {
      setFilteredBills(data);
      setFilterLabel("Bills eligible for reminders");
    }
  });

  const reminderMutation = useMutation({
    mutationFn: async (billId: number) => {
      const [message, whatsappLink] = await Promise.all([
        fetchReminderMessage(billId),
        fetchWhatsappLink(billId)
      ]);
      return { billId, message, whatsappLink };
    },
    onSuccess: ({ billId, message, whatsappLink }) => {
      setRemindersByBill((prev) => ({ ...prev, [billId]: { message, whatsappLink } }));
    }
  });

  const billOptions = useMemo(
    () => bills.map((b) => ({ id: b.id, label: `${b.invoiceCode} - ${b.customerName}` })),
    [bills]
  );

  return (
    <section className="stack">
      <header>
        <h1>Bills</h1>
      </header>

      <div className="card">
        <h2>Create Bill</h2>
        <form className="grid two-gap" onSubmit={billForm.handleSubmit((v) => createMutation.mutate(v))}>
          <label>
            Customer
            <select {...billForm.register("customerId")}>
              <option value={0}>Select customer</option>
              {customers.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {items.fields.map((field, index) => (
            <div className="grid form-row" key={field.id}>
              <select {...billForm.register(`items.${index}.productId`)}>
                <option value={0}>Select product</option>
                {products.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input type="number" min={1} placeholder="Qty" {...billForm.register(`items.${index}.quantity`)} />
              <button className="button button-ghost" type="button" onClick={() => items.remove(index)}>
                Remove
              </button>
            </div>
          ))}

          <div className="actions">
            <button
              className="button button-ghost"
              type="button"
              onClick={() => items.append({ productId: 0, quantity: 1 })}
            >
              Add Item
            </button>
            <button className="button" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Bill"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Receive Payment</h2>
        <form className="grid form-row" onSubmit={paymentForm.handleSubmit((v) => paymentMutation.mutate(v))}>
          <select {...paymentForm.register("billId")}>
            <option value={0}>Select bill</option>
            {billOptions.map((b) => (
              <option value={b.id} key={b.id}>
                {b.label}
              </option>
            ))}
          </select>
          <input type="number" step="0.01" placeholder="Amount" {...paymentForm.register("amountPaid")} />
          <button className="button" type="submit" disabled={paymentMutation.isPending}>
            {paymentMutation.isPending ? "Saving..." : "Record Payment"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Bill Filters & Search</h2>
        <div className="grid filter-grid">
          <div className="actions">
            <button className="button button-ghost" type="button" onClick={() => {
              setFilteredBills(null);
              setFilterLabel("Showing all bills");
            }}>
              All
            </button>
            <button
              className="button button-ghost"
              type="button"
              onClick={() => pendingFilterMutation.mutate()}
              disabled={pendingFilterMutation.isPending}
            >
              Pending
            </button>
            <button
              className="button button-ghost"
              type="button"
              onClick={() => reminderEligibleMutation.mutate()}
              disabled={reminderEligibleMutation.isPending}
            >
              Reminder Eligible
            </button>
          </div>

          <div className="actions">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="PENDING">PENDING</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="FULL">FULL</option>
            </select>
            <button
              className="button"
              type="button"
              onClick={() => statusFilterMutation.mutate(statusFilter)}
              disabled={statusFilterMutation.isPending}
            >
              Filter by Status
            </button>
          </div>

          <div className="actions">
            <input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search bill by customer name"
            />
            <button
              className="button"
              type="button"
              onClick={() => searchMutation.mutate(searchName)}
              disabled={searchMutation.isPending || searchName.trim().length === 0}
            >
              Search
            </button>
          </div>
        </div>
        <p className="muted">{filterLabel}</p>
      </div>

      <div className="card">
        {billsLoading ? (
          <p className="muted">Loading bills...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shownBills.map((bill) => (
                <tr key={bill.id}>
                  <td>{bill.invoiceCode}</td>
                  <td>{bill.customerName}</td>
                  <td>Rs. {bill.totalAmount}</td>
                  <td>Rs. {bill.paidAmount}</td>
                  <td>Rs. {bill.remainingAmount}</td>
                  <td>{bill.status}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="button button-ghost"
                        type="button"
                        onClick={async () => {
                          const blob = await downloadBillInvoice(bill.id);
                          saveBlob(blob, `invoice_${bill.id}.pdf`);
                        }}
                      >
                        Download Invoice
                      </button>
                      <button
                        className="button button-ghost"
                        type="button"
                        onClick={() => reminderMutation.mutate(bill.id)}
                        disabled={reminderMutation.isPending}
                      >
                        Get Reminder
                      </button>
                    </div>
                    {remindersByBill[bill.id] && (
                      <div className="stack reminder-box">
                        <p>{remindersByBill[bill.id].message}</p>
                        <div className="actions">
                          <button
                            className="button button-ghost"
                            type="button"
                            onClick={() => navigator.clipboard.writeText(remindersByBill[bill.id].message)}
                          >
                            Copy Message
                          </button>
                          <a className="button button-ghost" href={remindersByBill[bill.id].whatsappLink} target="_blank" rel="noreferrer">
                            Open WhatsApp Link
                          </a>
                        </div>
                      </div>
                    )}
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
