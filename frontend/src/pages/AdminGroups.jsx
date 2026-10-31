import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { Layers, Users, KeyRound, AlertCircle } from "lucide-react";

export default function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await apiRequest("/admin/groups");
        setGroups(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  const filtered = groups.filter(
    (g) =>
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.group_code?.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = groups.reduce((sum, g) => sum + (g.member_count || 0), 0);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Groups...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Groups Management</h1>
          <p className="page-subtitle">Monitor all sharing groups and their membership across the system</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-purple">
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL GROUPS</span>
            <span className="stat-value stat-value-purple">{groups.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-cyan">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL MEMBERS</span>
            <span className="stat-value stat-value-cyan">{totalMembers}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-emerald">
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">AVG MEMBERS</span>
            <span className="stat-value stat-value-emerald">
              {groups.length > 0 ? (totalMembers / groups.length).toFixed(1) : 0}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-amber">
            <Layers size={22} />
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
            <Layers size={18} style={{ color: "var(--accent-purple)" }} />
            <span>All Groups ({groups.length})</span>
          </div>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name, code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "260px", padding: "0.4rem 0.75rem", fontSize: "0.825rem" }}
          />
        </div>

        {filtered.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>
            No groups found matching your search.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>GROUP NAME</th>
                  <th>CODE</th>
                  <th>DESCRIPTION</th>
                  <th>MEMBERS</th>
                  <th>CREATED</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id}>
                    <td style={{ color: "var(--text-faint)", fontSize: "0.8rem" }}>#{g.id}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: "8px",
                          background: "rgba(139, 92, 246, 0.15)",
                          border: "1px solid rgba(139, 92, 246, 0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent-purple)",
                          flexShrink: 0
                        }}>
                          <Layers size={14} />
                        </div>
                        <strong style={{ color: "#ffffff" }}>{g.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge badge-info"
                        style={{ letterSpacing: "1.5px", fontWeight: 700, fontFamily: "monospace" }}
                      >
                        {g.group_code}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.description || <span style={{ color: "var(--text-faint)", fontStyle: "italic" }}>No description</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Users size={13} style={{ color: "var(--accent-cyan)" }} />
                        <span style={{ color: "#ffffff", fontWeight: 600 }}>{g.member_count}</span>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-faint)", fontSize: "0.82rem" }}>
                      {g.created_at ? new Date(g.created_at).toLocaleDateString() : "—"}
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
