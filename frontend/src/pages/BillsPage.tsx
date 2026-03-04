import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
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
  amountPaid: z.coerce.number().min(0).default(0),
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
type BillFormInput = z.input<typeof billSchema>;

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

  const billForm = useForm<BillFormInput, unknown, BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: { customerId: 0, amountPaid: 0, items: [{ productId: 0, quantity: 1 }] }
  });

  const items = useFieldArray({ control: billForm.control, name: "items" });

  const createMutation = useMutation({
    mutationFn: createBill,
  });

  const paymentMutation = useMutation({
    mutationFn: ({ billId, amountPaid }: { billId: number; amountPaid: number }) => makePayment(billId, { amountPaid })
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

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(new Date()),
    []
  );
  const customerId = useWatch({ control: billForm.control, name: "customerId" });
  const formItems = useWatch({ control: billForm.control, name: "items" });
  const amountPaid = useWatch({ control: billForm.control, name: "amountPaid" });
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === Number(customerId)),
    [customers, customerId]
  );
  const previewItems = useMemo(
    () =>
      (formItems ?? [])
        .map((item, index) => {
          const product = products.find((p) => p.id === Number(item.productId));
          const quantity = Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0;
          const unitPrice = Number.isFinite(Number(product?.price)) ? Number(product?.price) : 0;
          return {
            key: `${index}-${item.productId}-${quantity}`,
            line: index + 1,
            name: product?.name ?? "Select product",
            quantity,
            unitPrice,
            lineTotal: quantity * unitPrice
          };
        })
        .filter((item) => item.quantity > 0),
    [formItems, products]
  );
  const totalAmount = useMemo(
    () => previewItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [previewItems]
  );
  const normalizedPaid = Number.isFinite(Number(amountPaid)) ? Number(amountPaid) : 0;
  const clampedPaid = Math.max(0, Math.min(normalizedPaid, totalAmount));
  const remaining = Math.max(0, totalAmount - clampedPaid);
  const paymentStatus = totalAmount <= 0 ? "PENDING" : remaining === 0 ? "FULL" : clampedPaid > 0 ? "PARTIAL" : "PENDING";
  const money = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
    []
  );

  async function onSubmitBill(values: BillFormValues) {
    const created = await createMutation.mutateAsync({
      customerId: values.customerId,
      items: values.items
    });

    const enteredPaid = Math.max(0, Number(values.amountPaid || 0));
    if (enteredPaid > 0) {
      await paymentMutation.mutateAsync({
        billId: created.id,
        amountPaid: enteredPaid
      });
    }

    billForm.reset({ customerId: 0, amountPaid: 0, items: [{ productId: 0, quantity: 1 }] });
    queryClient.invalidateQueries({ queryKey: ["bills"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setFilteredBills(null);
    setFilterLabel("Showing all bills");
  }

  return (
    <section className="stack">
      <header>
        <h1>Bills</h1>
      </header>

      <div className="card bill-card">
        <h2>Create Bill</h2>
        <p className="muted">Fill this like a handwritten invoice sheet.</p>
        <form className="paper-bill" onSubmit={billForm.handleSubmit(onSubmitBill)}>
          <div className="paper-bill-head">
            <div>
              <p className="paper-label">Customer Name</p>
              <select className="paper-field" {...billForm.register("customerId", { valueAsNumber: true })}>
                <option value={0}>Select customer</option>
                {customers.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="paper-label">Bill Date</p>
              <p className="paper-date">{todayLabel}</p>
            </div>
          </div>

          <div className="paper-lines">
            <div className="paper-lines-head">
              <span>Line</span>
              <span>Item</span>
              <span>Qty</span>
              <span>Amount</span>
              <span></span>
            </div>
            {items.fields.map((field, index) => (
              <div className="paper-line-row" key={field.id}>
                <span className="line-number">{index + 1}</span>
                <select className="paper-field" {...billForm.register(`items.${index}.productId`, { valueAsNumber: true })}>
                  <option value={0}>Select product</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  className="paper-field qty-field"
                  type="number"
                  min={1}
                  placeholder="Qty"
                  {...billForm.register(`items.${index}.quantity`, { valueAsNumber: true })}
                />
                <span className="line-amount">
                  Rs.{" "}
                  {money.format(
                    (products.find((p) => p.id === Number(formItems?.[index]?.productId))?.price ?? 0) *
                      Number(formItems?.[index]?.quantity ?? 0)
                  )}
                </span>
                <button
                  className={`button button-ghost row-action ${index === items.fields.length - 1 ? "add-line" : "remove-line"}`}
                  type="button"
                  onClick={() =>
                    index === items.fields.length - 1
                      ? items.append({ productId: 0, quantity: 1 })
                      : items.remove(index)
                  }
                  disabled={index !== items.fields.length - 1 && items.fields.length === 1}
                >
                  {index === items.fields.length - 1 ? "+" : "x"}
                </button>
              </div>
            ))}
          </div>

          <div className="paper-payment-row">
            <label>
              Advance / Received Payment
              <input
                className="paper-field"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                {...billForm.register("amountPaid", { valueAsNumber: true })}
              />
            </label>
          </div>

          <div className="bill-preview">
            <div className="bill-preview-head">
              <h3>Final Bill Preview</h3>
              <span className={`status-pill status-${paymentStatus.toLowerCase()}`}>{paymentStatus}</span>
            </div>
            <div className="preview-meta">
              <p>Customer: <strong>{selectedCustomer?.name ?? "Not selected"}</strong></p>
              <p>Date: <strong>{todayLabel}</strong></p>
            </div>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {previewItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">Add items to see bill preview</td>
                  </tr>
                ) : (
                  previewItems.map((item) => (
                    <tr key={item.key}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {money.format(item.unitPrice)}</td>
                      <td>Rs. {money.format(item.lineTotal)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="preview-totals">
              <p><span>Total</span><strong>Rs. {money.format(totalAmount)}</strong></p>
              <p><span>Paid</span><strong>Rs. {money.format(clampedPaid)}</strong></p>
              <p><span>Remaining</span><strong>Rs. {money.format(remaining)}</strong></p>
            </div>
          </div>

          <div className="actions">
            <button className="button" type="submit" disabled={createMutation.isPending || paymentMutation.isPending}>
              {createMutation.isPending || paymentMutation.isPending ? "Preparing Bill..." : "Create Bill"}
            </button>
          </div>
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
