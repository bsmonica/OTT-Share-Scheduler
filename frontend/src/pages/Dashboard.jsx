import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  CreditCard,
  Play,
  Clock,
  Calendar,
  Bell,
  BarChart3,
  Tv,
  ChevronRight,
  PlusCircle,
  CalendarCheck
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [grpData, subData, bkgData, notifData] = await Promise.all([
          apiRequest("/groups"),
          apiRequest("/subscriptions"),
          apiRequest("/bookings?my_bookings=true"),
          apiRequest("/notifications")
        ]);

        setGroups(grpData || []);
        setSubscriptions(subData || []);
        setBookings(bkgData || []);
        setNotifications(notifData?.notifications || []);
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Dashboard...
      </div>
    );
  }

  // Filter upcoming confirmed bookings
  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" && b.booking_date >= today
  );
  const nextBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null;

  const getPlatformClass = (name = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("netflix")) return "logo-netflix";
    if (lower.includes("prime") || lower.includes("amazon")) return "logo-prime";
    if (lower.includes("sonyliv") || lower.includes("sony")) return "logo-sonyliv";
    if (lower.includes("zee")) return "logo-zee5";
    if (lower.includes("hotstar") || lower.includes("disney")) return "logo-hotstar";
    return "logo-default";
  };

  const getPlatformInitial = (name = "") => {
    const lower = name.toLowerCase();
    if (lower.includes("netflix")) return "N";
    if (lower.includes("prime") || lower.includes("amazon")) return "prime";
    if (lower.includes("sonyliv")) return "LIV";
    if (lower.includes("zee")) return "Z5";
    if (lower.includes("hotstar")) return "D+";
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.name} 👋</h1>
          <p className="page-subtitle">College OTT Subscription & Schedule Hub</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/book" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Book New Slot</span>
          </Link>
          <Link to="/groups" className="btn btn-outline">
            <Users size={16} />
            <span>Join / Create Group</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat KPI Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-cyan">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">ACTIVE GROUPS</span>
            <span className="stat-value stat-value-cyan">{groups.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box stat-icon-purple">
            <CreditCard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">ACTIVE SUBSCRIPTIONS</span>
            <span className="stat-value stat-value-purple">{subscriptions.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box stat-icon-amber">
            <Play size={20} fill="currentColor" stroke="none" />
          </div>
          <div className="stat-info">
            <span className="stat-label">MY BOOKINGS</span>
            <span className="stat-value stat-value-amber">{bookings.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box stat-icon-emerald">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">UPCOMING SLOTS</span>
            <span className="stat-value stat-value-emerald">{upcomingBookings.length}</span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout (Left 2-Col Area + Right Rail) */}
      <div className="dashboard-layout">
        {/* Left / Center Section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Row: Next Upcoming Slot + Recent Notifications */}
          <div className="grid grid-cols-2">
            {/* Next Upcoming Slot */}
            <div className="card">
              <div className="card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Calendar size={18} style={{ color: "var(--primary)" }} />
                  <span>Next Upcoming Slot</span>
                </div>
                <Link to="/my-bookings" className="card-title-link">View All</Link>
              </div>

              {nextBooking ? (
                <div style={{
                  padding: "1rem",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "var(--radius)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <strong style={{ fontSize: "1.1rem", color: "#34d399" }}>{nextBooking.platform_name}</strong>
                    <span className="badge badge-success">Confirmed</span>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "#f8fafc" }}>
                    <strong>Date:</strong> {nextBooking.booking_date} | <strong>Time:</strong> {nextBooking.start_time.slice(0, 5)} - {nextBooking.end_time.slice(0, 5)}
                  </p>
                  <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                    Group: {nextBooking.group_name}
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.75rem 1rem", color: "var(--text-muted)" }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 0.75rem auto",
                    color: "var(--text-faint)"
                  }}>
                    <Calendar size={22} />
                  </div>
                  <p style={{ fontSize: "0.875rem" }}>No upcoming viewing slots scheduled.</p>
                  <Link to="/book" className="btn btn-primary btn-sm" style={{ marginTop: "0.85rem" }}>
                    Book Now
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="card">
              <div className="card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Bell size={18} style={{ color: "var(--primary)" }} />
                  <span>Recent Notifications</span>
                </div>
                <Link to="/notifications" className="card-title-link">View All</Link>
              </div>

              {notifications.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem 0" }}>
                  No notifications right now.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {notifications.slice(0, 3).map((n, idx) => {
                    const dotColor = idx === 0 ? "#3b82f6" : idx === 1 ? "#10b981" : "#06b6d4";
                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: "0.6rem 0.75rem",
                          borderRadius: "var(--radius-sm)",
                          background: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid var(--border-subtle)",
                          fontSize: "0.85rem",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.65rem"
                        }}
                      >
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: dotColor,
                          marginTop: 6,
                          flexShrink: 0
                        }}></span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ color: "#ffffff", fontSize: "0.875rem" }}>{n.title}</strong>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginLeft: "0.5rem" }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {n.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Group Subscriptions */}
          <div className="card">
            <div className="card-title">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={18} style={{ color: "var(--primary)" }} />
                <span>Active Group Subscriptions</span>
              </div>
              <Link to="/subscriptions" className="card-title-link">Manage</Link>
            </div>

            {subscriptions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No subscriptions found. Join or create a group to add platforms!
              </p>
            ) : (
              <div className="grid grid-cols-4">
                {subscriptions.map((s) => (
                  <div key={s.id} className="ott-card-item">
                    <div className="ott-card-header">
                      <div className="ott-platform-badge-logo">
                        <div className={`ott-logo-box ${getPlatformClass(s.platform_name)}`}>
                          {getPlatformInitial(s.platform_name)}
                        </div>
                        <strong style={{ fontSize: "0.9rem", color: "#ffffff" }}>{s.platform_name}</strong>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
                        {s.max_capacity} Screen Max
                      </span>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                      <span>Group: <strong style={{ color: "#e2e8f0" }}>{s.group_name}</strong></span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Account: {s.account_email}
                      </span>
                    </div>

                    <Link to="/book" className="btn btn-outline btn-sm" style={{ marginTop: "0.25rem", width: "100%" }}>
                      Book Slot
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Bookings Table */}
          <div className="card">
            <div className="card-title">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarCheck size={18} style={{ color: "var(--primary)" }} />
                <span>Recent Bookings</span>
              </div>
              <Link to="/my-bookings" className="card-title-link">View All</Link>
            </div>

            {bookings.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No bookings made yet.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>PLATFORM</th>
                      <th>DATE</th>
                      <th>TIME SLOT</th>
                      <th>GROUP</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map((b) => (
                      <tr key={b.id}>
                        <td><strong style={{ color: "#ffffff" }}>{b.platform_name}</strong></td>
                        <td>{b.booking_date}</td>
                        <td>{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</td>
                        <td>{b.group_name}</td>
                        <td>
                          <span className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-danger"}`}>
                            {b.status === "confirmed" ? "Confirmed" : b.status}
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

        {/* Right Rail Column (Matching screenshot1.png) */}
        <div className="rail-widget">
          {/* Quick Stats */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BarChart3 size={18} style={{ color: "var(--primary)" }} />
                <span>Quick Stats</span>
              </div>
            </div>

            <div className="quick-stats-item">
              <div className="quick-stats-label">
                <Users size={16} style={{ color: "var(--accent-cyan)" }} />
                <span>Total Groups</span>
              </div>
              <span className="quick-stats-value">{groups.length}</span>
            </div>

            <div className="quick-stats-item">
              <div className="quick-stats-label">
                <CreditCard size={16} style={{ color: "var(--accent-purple)" }} />
                <span>Total Subscriptions</span>
              </div>
              <span className="quick-stats-value">{subscriptions.length}</span>
            </div>

            <div className="quick-stats-item">
              <div className="quick-stats-label">
                <Calendar size={16} style={{ color: "var(--accent-amber)" }} />
                <span>Total Bookings</span>
              </div>
              <span className="quick-stats-value">{bookings.length}</span>
            </div>

            <div className="quick-stats-item">
              <div className="quick-stats-label">
                <Bell size={16} style={{ color: "var(--accent-rose)" }} />
                <span>Active Notifications</span>
              </div>
              <span className="quick-stats-value">{notifications.length}</span>
            </div>
          </div>

          {/* Upcoming Slots Rail List */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={18} style={{ color: "var(--primary)" }} />
                <span>Upcoming Slots</span>
              </div>
              <Link to="/my-bookings" className="card-title-link">View All</Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.825rem", padding: "0.5rem 0" }}>
                No upcoming slots scheduled.
              </p>
            ) : (
              upcomingBookings.slice(0, 3).map((slot) => (
                <Link
                  key={slot.id}
                  to="/my-bookings"
                  className="rail-slot-item"
                  style={{ textDecoration: "none" }}
                >
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: "#ffffff", display: "block" }}>
                      {slot.platform_name}
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {slot.booking_date === today ? "Today" : slot.booking_date},{" "}
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--text-faint)" }} />
                </Link>
              ))
            )}
          </div>

          {/* Promo / Banner Card */}
          <div className="promo-banner-card">
            <div className="promo-banner-icon">
              <Tv size={22} />
            </div>
            <div className="promo-banner-title">
              Share more.<br />Watch together.
            </div>
            <div className="promo-banner-subtitle">
              OTT Share Scheduler
            </div>
            <div className="promo-accent-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
