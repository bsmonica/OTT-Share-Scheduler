import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart3,
  Users,
  CreditCard,
  CalendarCheck,
  Layers,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Tv,
  ShieldAlert
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [groupsList, setGroupsList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminData() {
      try {
        const [rep, users, groups, bookings] = await Promise.all([
          apiRequest("/admin/reports"),
          apiRequest("/admin/users"),
          apiRequest("/admin/groups"),
          apiRequest("/admin/bookings")
        ]);
        setReports(rep);
        setUsersList(users || []);
        setGroupsList(groups || []);
        setBookingsList(bookings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Admin Dashboard...
      </div>
    );
  }

  const recentBookings = bookingsList.slice(0, 6);
  const confirmRate = reports?.total_bookings
    ? Math.round((reports.confirmed_bookings / reports.total_bookings) * 100)
    : 0;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
            <ShieldAlert size={20} style={{ color: "var(--accent-amber)" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Admin Control Panel
            </span>
          </div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">System-wide monitoring, user management and analytics overview</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/admin/reports" className="btn btn-primary">
            <BarChart3 size={16} />
            <span>Analytics & Reports</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <Link to="/admin/users" style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div className="stat-icon-box stat-icon-cyan">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">TOTAL USERS</span>
              <span className="stat-value stat-value-cyan">{reports?.total_users || 0}</span>
            </div>
          </div>
        </Link>

        <Link to="/admin/groups" style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(168, 85, 247, 0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div className="stat-icon-box stat-icon-purple">
              <Layers size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">TOTAL GROUPS</span>
              <span className="stat-value stat-value-purple">{reports?.total_groups || 0}</span>
            </div>
          </div>
        </Link>

        <Link to="/admin/subscriptions" style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div className="stat-icon-box stat-icon-amber">
              <CreditCard size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">SUBSCRIPTIONS</span>
              <span className="stat-value stat-value-amber">{reports?.total_subscriptions || 0}</span>
            </div>
          </div>
        </Link>

        <Link to="/admin/bookings" style={{ textDecoration: "none" }}>
          <div className="stat-card" style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div className="stat-icon-box stat-icon-emerald">
              <CalendarCheck size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">TOTAL BOOKINGS</span>
              <span className="stat-value stat-value-emerald">{reports?.total_bookings || 0}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Confirmation Rate + Breakdown */}
      <div className="grid grid-cols-2" style={{ marginBottom: "1.5rem" }}>
        {/* Booking health card */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarCheck size={18} style={{ color: "var(--accent-emerald)" }} />
              <span>Booking Health</span>
            </div>
            <Link to="/admin/bookings" className="card-title-link">View All</Link>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ flex: 1, padding: "0.85rem", borderRadius: "var(--radius)", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", textAlign: "center" }}>
              <CheckCircle2 size={22} style={{ color: "#34d399", margin: "0 auto 0.35rem auto", display: "block" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#34d399" }}>{reports?.confirmed_bookings || 0}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirmed</div>
            </div>
            <div style={{ flex: 1, padding: "0.85rem", borderRadius: "var(--radius)", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", textAlign: "center" }}>
              <XCircle size={22} style={{ color: "#f87171", margin: "0 auto 0.35rem auto", display: "block" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f87171" }}>{reports?.cancelled_bookings || 0}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cancelled</div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.82rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Confirmation Rate</span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>{confirmRate}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255, 255, 255, 0.06)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ width: `${confirmRate}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: "99px" }}></div>
            </div>
          </div>
        </div>

        {/* Most used platforms mini */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Tv size={18} style={{ color: "var(--primary)" }} />
              <span>Top Platforms</span>
            </div>
            <Link to="/admin/reports" className="card-title-link">Full Report</Link>
          </div>

          {reports?.most_used_platforms?.slice(0, 4).map((p, idx) => {
            const total = reports.total_bookings || 1;
            const pct = Math.round((p.booking_count / total) * 100);
            const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b"];
            return (
              <div key={idx} style={{ marginBottom: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.84rem" }}>
                  <span style={{ color: "#ffffff", fontWeight: 600 }}>{p.platform_name}</span>
                  <span style={{ color: "var(--text-faint)", fontSize: "0.78rem" }}>{p.booking_count} bookings · {pct}%</span>
                </div>
                <div style={{ height: 5, background: "rgba(255, 255, 255, 0.06)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: colors[idx % colors.length], borderRadius: "99px" }}></div>
                </div>
              </div>
            );
          })}
          {(!reports?.most_used_platforms || reports.most_used_platforms.length === 0) && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No platform data yet.</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Users + Recent Bookings */}
      <div className="grid grid-cols-2">
        {/* Recent Users */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--primary)" }} />
              <span>Recent Users ({usersList.length})</span>
            </div>
            <Link to="/admin/users" className="card-title-link" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                </tr>
              </thead>
              <tbody>
                {usersList.slice(0, 6).map((u) => {
                  const initials = u.name
                    ? u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                    : "??";
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div
                            className="user-avatar-circle"
                            style={{
                              width: 26,
                              height: 26,
                              fontSize: "0.67rem",
                              background: u.role === "admin"
                                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                : "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                            }}
                          >
                            {initials}
                          </div>
                          <strong style={{ color: "#ffffff", fontSize: "0.875rem" }}>{u.name}</strong>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "badge-warning" : "badge-neutral"}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarCheck size={18} style={{ color: "var(--accent-emerald)" }} />
              <span>Recent Bookings</span>
            </div>
            <Link to="/admin/bookings" className="card-title-link" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              View All <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PLATFORM</th>
                  <th>USER</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong style={{ color: "#ffffff", fontSize: "0.875rem" }}>{b.platform_name}</strong></td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{b.user_name}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{b.booking_date}</td>
                    <td>
                      <span className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-danger"}`}>
                        {b.status === "confirmed" ? "Confirmed" : "Cancelled"}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentBookings.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)" }}>No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
