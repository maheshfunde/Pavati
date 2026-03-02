import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../api/endpoints";

const navItems = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/products", label: "Products" },
  { to: "/app/customers", label: "Customers" },
  { to: "/app/bills", label: "Bills" },
  { to: "/app/purchases", label: "Purchases" },
  { to: "/app/staff", label: "Staff", ownerOnly: true }
];

export function AppLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser
  });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/app/dashboard">
          <span className="brand-badge">MB</span>
          <div>
            <div className="brand-title">MyBill Console</div>
            <div className="brand-sub">Operational Billing</div>
          </div>
        </Link>

        <nav className="nav">
          {navItems
            .filter((item) => !item.ownerOnly || currentUser?.role === "OWNER")
            .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="button button-ghost"
          onClick={() => {
            signOut();
            navigate("/login", { replace: true });
          }}
        >
          Sign out
        </button>
      </aside>

      <main className="main-content">
        <div className="top-right-meta">
          <div className="meta-pill">
            <span className="meta-label">Shop</span>
            <strong>{currentUser?.shopName ?? "..."}</strong>
          </div>
          <div className="meta-pill">
            <span className="meta-label">User</span>
            <strong>{currentUser?.username ?? "..."}</strong>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
