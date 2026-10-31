import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { Users, Shield, AlertCircle } from "lucide-react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await apiRequest("/admin/users");
        setUsers(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === "admin").length;
  const studentCount = users.filter((u) => u.role !== "admin").length;

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Users...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">View and monitor all registered accounts in the system</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick stat chips */}
      <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-cyan">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL USERS</span>
            <span className="stat-value stat-value-cyan">{users.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-purple">
            <Shield size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">ADMINS</span>
            <span className="stat-value stat-value-purple">{adminCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-emerald">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">STUDENTS</span>
            <span className="stat-value stat-value-emerald">{studentCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-amber">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">FILTERED</span>
            <span className="stat-value stat-value-amber">{filtered.length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} style={{ color: "var(--primary)" }} />
            <span>Registered Users ({users.length})</span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "260px", padding: "0.4rem 0.75rem", fontSize: "0.825rem" }}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>
            No users found matching your search.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>REGISTERED</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const initials = u.name
                    ? u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                    : "??";
                  return (
                    <tr key={u.id}>
                      <td style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>#{u.id}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                          <div
                            className="user-avatar-circle"
                            style={{
                              width: 28,
                              height: 28,
                              fontSize: "0.7rem",
                              background: u.role === "admin"
                                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                : "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                            }}
                          >
                            {initials}
                          </div>
                          <strong style={{ color: "#ffffff" }}>{u.name}</strong>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "badge-warning" : "badge-neutral"}`}>
                          {u.role === "admin" ? "Administrator" : "Student"}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-faint)", fontSize: "0.82rem" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
