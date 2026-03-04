import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  createCustomer,
  downloadBillInvoice,
  fetchCustomerBills,
  fetchCustomerLedger,
  fetchCustomers
} from "../api/endpoints";

const schema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  address: z.string().min(3)
});

type FormValues = z.infer<typeof schema>;

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

function isCreditType(type: string): boolean {
  const normalized = type.toUpperCase();
  return normalized.includes("PAYMENT") || normalized.includes("RECEIVED") || normalized.includes("CREDIT");
}

export function CustomersPage() {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0);

  const { data = [], isLoading } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", mobile: "", address: "" }
  });

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const customerBillsQuery = useQuery({
    queryKey: ["customer-bills", selectedCustomerId],
    queryFn: () => fetchCustomerBills(selectedCustomerId),
    enabled: selectedCustomerId > 0
  });

  const customerLedgerQuery = useQuery({
    queryKey: ["customer-ledger", selectedCustomerId],
    queryFn: () => fetchCustomerLedger(selectedCustomerId),
    enabled: selectedCustomerId > 0
  });

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
    []
  );

  const invoiceCodeToBillId = useMemo(() => {
    const map = new Map<string, number>();
    for (const bill of customerBillsQuery.data ?? []) {
      map.set(bill.invoiceCode, bill.id);
    }
    return map;
  }, [customerBillsQuery.data]);

  const ledgerSummary = useMemo(() => {
    const entries = customerLedgerQuery.data?.entries ?? [];
    return entries.reduce(
      (summary, entry) => {
        if (isCreditType(entry.type)) {
          summary.credit += Number(entry.amount) || 0;
        } else {
          summary.debit += Number(entry.amount) || 0;
        }
        return summary;
      },
      { debit: 0, credit: 0 }
    );
  }, [customerLedgerQuery.data]);

  return (
    <section className="stack">
      <header>
        <h1>Customers</h1>
      </header>

      <div className="card">
        <h2>Add Customer</h2>
        <form className="grid form-row" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <input placeholder="Name" {...form.register("name")} />
          <input placeholder="Mobile" {...form.register("mobile")} />
          <input placeholder="Address" {...form.register("address")} />
          <button className="button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Saving..." : "Create"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Customer List</h2>
        {isLoading ? (
          <p className="muted">Loading customers...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.mobile}</td>
                  <td>{customer.address}</td>
                  <td>
                    <button
                      className="button button-ghost"
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      Get Bills & Ledger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCustomerId > 0 && (
        <div className="card">
          <h2>Customer Bills</h2>
          {customerBillsQuery.isLoading ? (
            <p className="muted">Loading customer bills...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(customerBillsQuery.data ?? []).map((bill) => (
                  <tr key={bill.id}>
                    <td>{bill.invoiceCode}</td>
                    <td>{bill.status}</td>
                    <td>Rs. {bill.totalAmount}</td>
                    <td>Rs. {bill.paidAmount}</td>
                    <td>Rs. {bill.remainingAmount}</td>
                    <td>
                      <button
                        className="button button-ghost"
                        type="button"
                        onClick={async () => {
                          const blob = await downloadBillInvoice(bill.id);
                          saveBlob(blob, `${bill.invoiceCode}.pdf`);
                        }}
                      >
                        Download Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedCustomerId > 0 && (
        <div className="card">
          <h2>Customer Ledger</h2>
          {customerLedgerQuery.isLoading ? (
            <p className="muted">Loading customer ledger...</p>
          ) : customerLedgerQuery.data ? (
            <div className="stack">
              <p>
                <strong>Customer:</strong> {customerLedgerQuery.data.customerName}
              </p>
              <div className="ledger-summary-grid">
                <div className="ledger-metric debit">
                  <span>Total Debit</span>
                  <strong>Rs. {currency.format(ledgerSummary.debit)}</strong>
                </div>
                <div className="ledger-metric credit">
                  <span>Total Credit</span>
                  <strong>Rs. {currency.format(ledgerSummary.credit)}</strong>
                </div>
                <div className="ledger-metric balance">
                  <span>Balance</span>
                  <strong>Rs. {currency.format(customerLedgerQuery.data.balance)}</strong>
                </div>
              </div>
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Invoice</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLedgerQuery.data.entries.map((entry, idx) => {
                    const isCredit = isCreditType(entry.type);
                    const linkedBillId = invoiceCodeToBillId.get(entry.invoiceCode);
                    return (
                    <tr key={`${entry.invoiceCode}-${entry.date}-${idx}`} className={isCredit ? "txn-credit" : "txn-debit"}>
                      <td>{new Date(entry.date).toLocaleString()}</td>
                      <td>
                        <span className={`txn-type-pill ${isCredit ? "credit" : "debit"}`}>{entry.type}</span>
                      </td>
                      <td className={`txn-amount ${isCredit ? "credit" : "debit"}`}>
                        {isCredit ? "+" : "-"} Rs. {currency.format(entry.amount)}
                      </td>
                      <td>{entry.invoiceCode}</td>
                      <td>
                        {linkedBillId ? (
                          <button
                            className="button button-ghost"
                            type="button"
                            onClick={async () => {
                              const blob = await downloadBillInvoice(linkedBillId);
                              saveBlob(blob, `${entry.invoiceCode}.pdf`);
                            }}
                          >
                            Download Bill
                          </button>
                        ) : (
                          <span className="muted">-</span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No ledger data.</p>
          )}
        </div>
      )}
    </section>
  );
}
