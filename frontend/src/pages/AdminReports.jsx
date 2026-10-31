import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import {
  BarChart3,
  Users,
  Layers,
  CheckCircle2,
  XCircle,
  Tv,
  Clock,
  AlertCircle
} from "lucide-react";

export default function AdminReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await apiRequest("/admin/reports");
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Reports...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Activity & Usage Reports</h1>
          <p className="page-subtitle">College OTT sharing patterns, popular platforms, and peak viewing hours</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-4" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-icon-box stat-icon-cyan">
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL USERS</span>
            <span className="stat-value stat-value-cyan">{reports?.total_users || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box stat-icon-purple">
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">TOTAL GROUPS</span>
            <span className="stat-value stat-value-purple">{reports?.total_groups || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">CONFIRMED</span>
            <span className="stat-value stat-value-emerald">{reports?.confirmed_bookings || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box" style={{ background: "rgba(239, 68, 68, 0.12)", color: "var(--accent-rose)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
            <XCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">CANCELLED</span>
            <span className="stat-value" style={{ color: "var(--accent-rose)" }}>{reports?.cancelled_bookings || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {/* Most-Used OTT Platforms */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Tv size={18} style={{ color: "var(--primary)" }} />
              <span>Most-Used OTT Platforms</span>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PLATFORM</th>
                  <th>RESERVATIONS</th>
                  <th>USAGE SHARE</th>
                </tr>
              </thead>
              <tbody>
                {reports?.most_used_platforms?.map((p, idx) => {
                  const total = reports.total_bookings || 1;
                  const pct = Math.round((p.booking_count / total) * 100);
                  return (
                    <tr key={idx}>
                      <td><strong style={{ color: "#ffffff" }}>{p.platform_name}</strong></td>
                      <td style={{ color: "var(--text-muted)" }}>{p.booking_count} bookings</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{
                            width: "120px",
                            height: "6px",
                            background: "rgba(255, 255, 255, 0.08)",
                            borderRadius: "99px",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${pct}%`,
                              height: "100%",
                              background: "var(--primary-gradient)",
                              borderRadius: "99px"
                            }}></div>
                          </div>
                          <span style={{ fontSize: "0.78rem", color: "var(--text-faint)", fontWeight: 600 }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Viewing Times */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={18} style={{ color: "var(--accent-amber)" }} />
              <span>Popular Viewing Times</span>
            </div>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>HOUR SLOT</th>
                  <th>FREQUENCY</th>
                </tr>
              </thead>
              <tbody>
                {reports?.popular_viewing_times?.map((t, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="badge badge-info">{t.hour_slot}</span>
                    </td>
                    <td>
                      <strong style={{ color: "#ffffff" }}>{t.booking_count} slots booked</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: "1rem", lineHeight: 1.5 }}>
            Peak demand slots help groups evaluate when additional screen capacity or subscription upgrades are needed.
          </p>
        </div>
      </div>
    </div>
  );
}
