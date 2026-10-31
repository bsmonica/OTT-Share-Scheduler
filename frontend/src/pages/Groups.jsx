import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Users, PlusCircle, KeyRound, Shield, CheckCircle2, AlertCircle } from "lucide-react";

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const data = await apiRequest("/groups");
      setGroups(data || []);
      if (data && data.length > 0 && !activeGroup) {
        selectGroup(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function selectGroup(group) {
    setActiveGroup(group);
    try {
      const memberList = await apiRequest(`/groups/${group.id}/members`);
      setMembers(memberList || []);
    } catch (err) {
      setMembers([]);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const created = await apiRequest("/groups", "POST", {
        name: newGroupName,
        description: newGroupDesc
      });
      setMessage(`Group created successfully! Group Code: ${created.group_code}`);
      setNewGroupName("");
      setNewGroupDesc("");
      await fetchGroups();
      selectGroup(created);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleJoinGroup(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const joined = await apiRequest("/groups/join", "POST", {
        group_code: joinCode.trim().toUpperCase()
      });
      setMessage(`Successfully joined group: ${joined.name}`);
      setJoinCode("");
      await fetchGroups();
      selectGroup(joined);
    } catch (err) {
      setError(err.message);
    }
  }

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
          <p className="page-subtitle">Create or join college sharing groups with unique access codes</p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2" style={{ marginBottom: "1.5rem" }}>
        {/* Create Group */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PlusCircle size={18} style={{ color: "var(--primary)" }} />
              <span>Create a New Group</span>
            </div>
          </div>
          <form onSubmit={handleCreateGroup}>
            <div className="form-group">
              <label className="form-label">Group Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Hostellers Club, Room 204"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Shared subscriptions for roommates"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
              Create Group
            </button>
          </form>
        </div>

        {/* Join Group */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <KeyRound size={18} style={{ color: "var(--accent-cyan)" }} />
              <span>Join Existing Group</span>
            </div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Enter the 6-character group invite code shared by your friend or roommate.
          </p>
          <form onSubmit={handleJoinGroup}>
            <div className="form-group">
              <label className="form-label">Group Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 7P9PDD"
                maxLength={10}
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                  fontWeight: "700",
                  fontSize: "1.05rem"
                }}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <button type="submit" className="btn btn-outline" style={{ width: "100%", marginTop: "0.5rem" }}>
              Join Group
            </button>
          </form>
        </div>
      </div>

      {/* Group List & Member Viewer */}
      <div className="grid grid-cols-2">
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--primary)" }} />
              <span>My Groups ({groups.length})</span>
            </div>
          </div>
          {groups.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>You have not joined any groups yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {groups.map((g) => {
                const isSelected = activeGroup?.id === g.id;
                return (
                  <div
                    key={g.id}
                    onClick={() => selectGroup(g)}
                    style={{
                      padding: "0.85rem 1rem",
                      borderRadius: "var(--radius)",
                      border: isSelected
                        ? "1px solid var(--primary)"
                        : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      background: isSelected
                        ? "rgba(59, 130, 246, 0.1)"
                        : "rgba(255, 255, 255, 0.02)",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>{g.name}</strong>
                      <span className="badge badge-info" style={{ letterSpacing: "1px", fontWeight: "700" }}>
                        CODE: {g.group_code}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                      {g.description || "No description provided"}
                    </p>
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", color: "var(--text-faint)" }}>
                      <span>Members: <strong style={{ color: "#ffffff" }}>{g.member_count}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Members Viewer */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} style={{ color: "var(--accent-purple)" }} />
              <span>{activeGroup ? `Members of "${activeGroup.name}"` : "Group Members"}</span>
            </div>
          </div>
          {activeGroup ? (
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
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td><strong style={{ color: "#ffffff" }}>{m.user_name}</strong></td>
                      <td style={{ color: "var(--text-muted)" }}>{m.user_email}</td>
                      <td>
                        <span className={`badge ${m.role === "admin" ? "badge-warning" : "badge-neutral"}`}>
                          {m.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Select a group to view its members.</p>
          )}
        </div>
      </div>
    </div>
  );
}
