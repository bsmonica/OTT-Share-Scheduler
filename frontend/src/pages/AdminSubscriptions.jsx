import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { CreditCard, AlertCircle } from "lucide-react";

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadSubscriptions() {
      try {
        // Admin can view all subscriptions via the regular subscriptions endpoint
        const data = await apiRequest("/subscriptions");
        setSubscriptions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSubscriptions();
  }, []);

  const filtered = subscriptions.filter(
    (s) =>
      s.platform_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.group_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.account_email?.toLowerCase().includes(search.toLowerCase()) ||
      s.plan_name?.toLowerCase().includes(search.toLowerCase())
  );

  const active = subscriptions.filter((s) => s.status === "active").length;
  const totalScreens = subscriptions.reduce((sum, s) => sum + (s.max_capacity || 0), 0);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Subscriptions...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-subtitle">View all shared OTT platform subscriptions across groups</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-amber">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL SUBS</span>
            <span className="stat-value stat-value-amber">{subscriptions.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-emerald">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">ACTIVE</span>
            <span className="stat-value stat-value-emerald">{active}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-cyan">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL SCREENS</span>
            <span className="stat-value stat-value-cyan">{totalScreens}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-purple">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">FILTERED</span>
            <span className="stat-value stat-value-purple">{filtered.length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CreditCard size={18} style={{ color: "var(--accent-amber)" }} />
            <span>All Subscriptions ({subscriptions.length})</span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Search by platform, group, email or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "280px", padding: "0.4rem 0.75rem", fontSize: "0.825rem" }}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>
            No subscriptions found.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PLATFORM</th>
                  <th>GROUP</th>
                  <th>ACCOUNT EMAIL</th>
                  <th>PLAN</th>
                  <th>MAX SCREENS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>#{s.id}</td>
                    <td><strong style={{ color: "#ffffff" }}>{s.platform_name}</strong></td>
                    <td style={{ color: "var(--text-muted)" }}>{s.group_name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{s.account_email}</td>
                    <td style={{ color: "var(--text-muted)" }}>{s.plan_name}</td>
                    <td>
                      <span className="badge badge-info">{s.max_capacity} Screens</span>
                    </td>
                    <td>
                      <span className={`badge ${s.status === "active" ? "badge-success" : "badge-danger"}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
