import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { BookmarkCheck, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export default function MyBookings() {
  const { user, fetchUnreadNotifications } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const endpoint = user.role === "admin" ? "/bookings" : "/bookings?my_bookings=true";
      const data = await apiRequest(endpoint);
      setBookings(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (!window.confirm("Are you sure you want to cancel this booking? Other members will be able to book this slot.")) {
      return;
    }

    setError("");
    setMessage("");
    try {
      await apiRequest(`/bookings/${bookingId}`, "DELETE");
      setMessage("Booking successfully cancelled and slot released.");
      fetchBookings();
      fetchUnreadNotifications();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (filter === "confirmed") return b.status === "confirmed";
    if (filter === "cancelled") return b.status === "cancelled";
    return true;
  });

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Bookings...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{user.role === "admin" ? "All Platform Bookings" : "My Bookings History"}</h1>
          <p className="page-subtitle">Track your viewing sessions and manage slot cancellations</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn btn-sm ${filter === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("all")}
          >
            All ({bookings.length})
          </button>
          <button
            className={`btn btn-sm ${filter === "confirmed" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("confirmed")}
          >
            Confirmed
          </button>
          <button
            className={`btn btn-sm ${filter === "cancelled" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setFilter("cancelled")}
          >
            Cancelled
          </button>
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

      <div className="card">
        {filteredBookings.length === 0 ? (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>
            No bookings found.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PLATFORM</th>
                  {user.role === "admin" && <th>USER</th>}
                  <th>GROUP</th>
                  <th>DATE</th>
                  <th>TIME SLOT</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => (
                  <tr key={b.id}>
                    <td><strong style={{ color: "#ffffff" }}>{b.platform_name}</strong></td>
                    {user.role === "admin" && <td style={{ color: "var(--text-muted)" }}>{b.user_name}</td>}
                    <td>{b.group_name}</td>
                    <td>{b.booking_date}</td>
                    <td>{b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}</td>
                    <td>
                      <span className={`badge ${b.status === "confirmed" ? "badge-success" : "badge-danger"}`}>
                        {b.status === "confirmed" ? "Confirmed" : b.status}
                      </span>
                    </td>
                    <td>
                      {b.status === "confirmed" ? (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="btn btn-danger btn-sm"
                        >
                          <XCircle size={14} />
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-faint)" }}>Cancelled</span>
                      )}
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
