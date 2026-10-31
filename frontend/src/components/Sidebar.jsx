import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarPlus,
  BookmarkCheck,
  Bell,
  User,
  ShieldAlert,
  BarChart3,
  Play,
  LogOut,
  Layers,
  CalendarCheck
} from "lucide-react";

export default function Sidebar() {
  const { user, logout, unreadCount } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "US";

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <Play size={18} fill="#ffffff" stroke="none" />
        </div>
        <span className="brand-title">OTT Share Scheduler</span>
      </div>

      <nav className="sidebar-nav">
        {user.role !== "admin" ? (
          <>
            <Link
              to="/"
              className={`sidebar-nav-item ${isActive("/") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link
              to="/groups"
              className={`sidebar-nav-item ${isActive("/groups") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <Users size={18} />
                <span>Groups</span>
              </div>
            </Link>

            <Link
              to="/subscriptions"
              className={`sidebar-nav-item ${isActive("/subscriptions") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <CreditCard size={18} />
                <span>Subscriptions</span>
              </div>
            </Link>

            <Link
              to="/book"
              className={`sidebar-nav-item ${isActive("/book") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <CalendarPlus size={18} />
                <span>Book Slot</span>
              </div>
            </Link>

            <Link
              to="/my-bookings"
              className={`sidebar-nav-item ${isActive("/my-bookings") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <BookmarkCheck size={18} />
                <span>My Bookings</span>
              </div>
            </Link>

            <Link
              to="/notifications"
              className={`sidebar-nav-item ${isActive("/notifications") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <Bell size={18} />
                <span>Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="sidebar-badge-count">{unreadCount}</span>
              )}
            </Link>

            <Link
              to="/profile"
              className={`sidebar-nav-item ${isActive("/profile") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <User size={18} />
                <span>Profile</span>
              </div>
            </Link>

            <button
              onClick={logout}
              className="sidebar-nav-item"
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              <div className="sidebar-nav-link-content">
                <LogOut size={18} />
                <span>Logout</span>
              </div>
            </button>
          </>
        ) : (
          <>
            {/* Admin section label */}
            <div style={{ padding: "0.35rem 0.85rem", marginTop: "0.25rem", marginBottom: "0.1rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Admin</span>
            </div>

            <Link
              to="/admin"
              className={`sidebar-nav-item ${location.pathname === "/admin" ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <ShieldAlert size={18} />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className={`sidebar-nav-item ${isActive("/admin/users") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <Users size={18} />
                <span>Users</span>
              </div>
            </Link>

            <Link
              to="/admin/groups"
              className={`sidebar-nav-item ${isActive("/admin/groups") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <Layers size={18} />
                <span>Groups</span>
              </div>
            </Link>

            <Link
              to="/admin/subscriptions"
              className={`sidebar-nav-item ${isActive("/admin/subscriptions") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <CreditCard size={18} />
                <span>Subscriptions</span>
              </div>
            </Link>

            <Link
              to="/admin/bookings"
              className={`sidebar-nav-item ${isActive("/admin/bookings") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <CalendarCheck size={18} />
                <span>Bookings</span>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className={`sidebar-nav-item ${isActive("/admin/reports") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <BarChart3 size={18} />
                <span>Reports</span>
              </div>
            </Link>

            <div style={{ padding: "0.35rem 0.85rem", marginTop: "0.5rem", marginBottom: "0.1rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Account</span>
            </div>

            <Link
              to="/profile"
              className={`sidebar-nav-item ${isActive("/profile") ? "active" : ""}`}
            >
              <div className="sidebar-nav-link-content">
                <User size={18} />
                <span>Profile</span>
              </div>
            </Link>

            <button
              onClick={logout}
              className="sidebar-nav-item"
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              <div className="sidebar-nav-link-content">
                <LogOut size={18} />
                <span>Logout</span>
              </div>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-pill">
          <div className="user-pill-info">
            <div className="user-avatar-circle">{initials}</div>
            <div className="user-pill-details">
              <div className="user-pill-name">{user.name}</div>
              <div className="user-pill-role">
                {user.role === "admin" ? "Administrator" : "Student"}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-outline btn-sm"
            style={{ padding: "5px 8px", color: "var(--text-faint)" }}
            title="Log out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
