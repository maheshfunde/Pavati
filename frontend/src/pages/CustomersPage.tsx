import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCustomer, fetchCustomerBills, fetchCustomerLedger, fetchCustomers } from "../api/endpoints";

const schema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(10),
  address: z.string().min(3)
});

type FormValues = z.infer<typeof schema>;

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
              <p>
                <strong>Balance:</strong> Rs. {customerLedgerQuery.data.balance}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {customerLedgerQuery.data.entries.map((entry, idx) => (
                    <tr key={`${entry.invoiceCode}-${entry.date}-${idx}`}>
                      <td>{new Date(entry.date).toLocaleString()}</td>
                      <td>{entry.type}</td>
                      <td>Rs. {entry.amount}</td>
                      <td>{entry.invoiceCode}</td>
                    </tr>
                  ))}
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
