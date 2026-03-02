import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/endpoints";

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard
  });

  if (isLoading) return <p className="muted">Loading dashboard...</p>;
  if (error || !data) return <p className="field-error">Unable to load dashboard.</p>;

  return (
    <section className="stack">
      <header>
        <h1>Dashboard</h1>
        <p className="muted">Live numbers from your billing backend.</p>
      </header>

      <div className="stats-grid">
        <article className="card stat">
          <h3>Today Sales</h3>
          <p>Rs. {data.todaySales ?? 0}</p>
        </article>
        <article className="card stat">
          <h3>Today Collection</h3>
          <p>Rs. {data.todayCollection ?? 0}</p>
        </article>
        <article className="card stat">
          <h3>Total Pending</h3>
          <p>Rs. {data.totalPendingAmount ?? 0}</p>
        </article>
        <article className="card stat">
          <h3>Customers</h3>
          <p>{data.totalCustomers ?? 0}</p>
        </article>
      </div>

      <div className="card">
        <h2>Low Stock Alerts</h2>
        {data.lowStockProducts.length === 0 ? (
          <p className="muted">No low-stock products.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {data.lowStockProducts.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.stockQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
