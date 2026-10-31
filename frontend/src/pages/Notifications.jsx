import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Bell, CheckCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function Notifications() {
  const { fetchUnreadNotifications } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      const data = await apiRequest("/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await apiRequest(`/notifications/${id}/read`, "PUT");
      loadNotifications();
      fetchUnreadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMarkAllRead() {
    try {
      await apiRequest("/notifications/read-all", "PUT");
      loadNotifications();
      fetchUnreadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  function getBadgeColor(type) {
    switch (type) {
      case "booking_confirmation": return "badge-success";
      case "recommendation": return "badge-warning";
      case "cancellation": return "badge-danger";
      default: return "badge-info";
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Notifications...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">In-app updates on slot confirmations, cancellations, and AI suggestions</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-outline btn-sm">
            <CheckCheck size={16} />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        {notifications.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>
            No notifications available.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border-subtle)",
                  background: n.is_read ? "rgba(255, 255, 255, 0.02)" : "rgba(59, 130, 246, 0.06)",
                  borderLeft: n.is_read ? "1px solid var(--border-subtle)" : "4px solid var(--primary)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                    <span className={`badge ${getBadgeColor(n.type)}`}>
                      {n.type.replace("_", " ")}
                    </span>
                    <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>{n.title}</strong>
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{n.message}</p>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "0.5rem", display: "inline-block" }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: "0.75rem", flexShrink: 0 }}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
