import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const data = await apiRequest("/admin/bookings");
        setBookings(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const afterFilter = bookings.filter((b) => {
    if (filter === "confirmed") return b.status === "confirmed";
    if (filter === "cancelled") return b.status === "cancelled";
    return true;
  });

  const filtered = afterFilter.filter(
    (b) =>
      b.platform_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.group_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_date?.includes(search)
  );

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Bookings...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Bookings</h1>
          <p className="page-subtitle">System-wide booking records across all groups and platforms</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("all")}
          >
            All ({bookings.length})
          </button>
          <button
            className={`btn btn-sm ${filter === "confirmed" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("confirmed")}
          >
            Confirmed ({confirmed.length})
          </button>
          <button
            className={`btn btn-sm ${filter === "cancelled" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("cancelled")}
          >
            Cancelled ({cancelled.length})
          </button>
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
          <div className="stat-icon-box stat-icon-cyan">
            <CalendarCheck size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL BOOKINGS</span>
            <span className="stat-value stat-value-cyan">{bookings.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">CONFIRMED</span>
            <span className="stat-value stat-value-emerald">{confirmed.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: "rgba(239, 68, 68, 0.12)", color: "var(--accent-rose)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
            <XCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">CANCELLED</span>
            <span className="stat-value" style={{ color: "var(--accent-rose)" }}>{cancelled.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-amber">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">SHOWING</span>
            <span className="stat-value stat-value-amber">{filtered.length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CalendarCheck size={18} style={{ color: "var(--accent-emerald)" }} />
            <span>Booking Records</span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Search by platform, user, group or date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "280px", padding: "0.4rem 0.75rem", fontSize: "0.825rem" }}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>
            No bookings found.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PLATFORM</th>
                  <th>USER</th>
                  <th>GROUP</th>
                  <th>DATE</th>
                  <th>TIME SLOT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>#{b.id}</td>
                    <td><strong style={{ color: "#ffffff" }}>{b.platform_name}</strong></td>
                    <td style={{ color: "var(--text-muted)" }}>{b.user_name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{b.group_name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{b.booking_date}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#e2e8f0" }}>
                      {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}
                    </td>
                    <td>
                      <span className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-danger"}`}>
                        {b.status === "confirmed" ? "Confirmed" : "Cancelled"}
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
