import React from "react";
import { useAuth } from "../context/AuthContext";
import { User, Shield, Key, Bell, CheckCircle2 } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Profile & Account</h1>
          <p className="page-subtitle">Manage your shared account details and session security</p>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* User Details */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <User size={18} style={{ color: "var(--primary)" }} />
              <span>Account Information</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="user-avatar-circle" style={{ width: 54, height: 54, fontSize: "1.25rem" }}>
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "US"}
              </div>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#ffffff" }}>{user?.name}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{user?.email}</p>
              </div>
            </div>

            <div>
              <span className="stat-label">Full Name</span>
              <p style={{ fontWeight: 600, fontSize: "1rem", color: "#ffffff", marginTop: "0.2rem" }}>
                {user?.name}
              </p>
            </div>

            <div>
              <span className="stat-label">Email Address</span>
              <p style={{ color: "#e2e8f0", marginTop: "0.2rem" }}>{user?.email}</p>
            </div>

            <div>
              <span className="stat-label">Account Role</span>
              <p style={{ marginTop: "0.3rem" }}>
                <span className={`badge ${user?.role === "admin" ? "badge-warning" : "badge-info"}`}>
                  {user?.role === "admin" ? "Administrator" : "Student Member"}
                </span>
              </p>
            </div>

            <div>
              <span className="stat-label">Member Since</span>
              <p style={{ color: "var(--text-muted)", marginTop: "0.2rem", fontSize: "0.9rem" }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active Member"}
              </p>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} style={{ color: "var(--accent-emerald)" }} />
              <span>Security & Session</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius)",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={16} style={{ color: "#34d399" }} />
                <strong style={{ fontSize: "0.9rem", color: "#34d399" }}>Session Active & Authenticated</strong>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Secure JWT session token is active. Your account is authorized for platform scheduling.
              </p>
            </div>

            <div style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius)",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Key size={16} style={{ color: "var(--accent-purple)" }} />
                <strong style={{ fontSize: "0.9rem", color: "#ffffff" }}>Access Protection</strong>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Encrypted password authentication with role-based route access controls.
              </p>
            </div>

            <div style={{
              padding: "0.85rem 1rem",
              borderRadius: "var(--radius)",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid var(--border-subtle)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Bell size={16} style={{ color: "var(--accent-cyan)" }} />
                <strong style={{ fontSize: "0.9rem", color: "#ffffff" }}>Booking Alerts</strong>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                In-app notification system enabled for instant slot confirmations and capacity warnings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
