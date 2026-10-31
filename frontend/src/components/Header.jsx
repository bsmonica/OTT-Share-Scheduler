import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search, Bell, LogOut } from "lucide-react";

export default function Header() {
  const { user, logout, unreadCount } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "US";

  return (
    <header className="app-header">
      <div className="header-search">
        <Search size={16} className="header-search-icon" />
        <input
          type="text"
          placeholder="Search groups, subscriptions..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              navigate("/subscriptions");
            }
          }}
        />
      </div>

      <div className="header-actions">
        <Link to="/notifications" className="header-icon-btn" title="Notifications">
          <Bell size={18} />
          {unreadCount > 0 && <span className="header-badge-dot">{unreadCount}</span>}
        </Link>

        <Link to="/profile" className="header-user-badge" style={{ textDecoration: "none" }}>
          <div className="user-avatar-circle" style={{ width: 28, height: 28, fontSize: "0.75rem" }}>
            {initials}
          </div>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#ffffff" }}>
            {user.name}
          </span>
        </Link>

        <button
          onClick={logout}
          className="btn btn-outline btn-sm"
          style={{ padding: "0.4rem 0.75rem" }}
          title="Sign out"
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
