import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import {
  CalendarPlus,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tv,
  ArrowRight
} from "lucide-react";

export default function BookSlot() {
  const { user, fetchUnreadNotifications } = useAuth();
  const [groups, setGroups] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("20:00");

  const [availability, setAvailability] = useState(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadGroupsAndSubs() {
      try {
        const [grpData, subData] = await Promise.all([
          apiRequest("/groups"),
          apiRequest("/subscriptions")
        ]);
        setGroups(grpData || []);
        setSubscriptions(subData || []);

        if (grpData && grpData.length > 0) {
          const firstGid = grpData[0].id;
          setSelectedGroupId(firstGid);
          const relatedSubs = (subData || []).filter(s => s.group_id === firstGid);
          if (relatedSubs.length > 0) {
            setSelectedSubId(relatedSubs[0].id);
          }
        }
      } catch (err) {
        setError(err.message);
      }
    }
    loadGroupsAndSubs();
  }, []);

  function handleGroupChange(gid) {
    setSelectedGroupId(gid);
    const relatedSubs = subscriptions.filter(s => s.group_id === parseInt(gid));
    if (relatedSubs.length > 0) {
      setSelectedSubId(relatedSubs[0].id);
    } else {
      setSelectedSubId("");
    }
    setAvailability(null);
    setRecommendation(null);
  }

  useEffect(() => {
    if (selectedSubId && bookingDate) {
      fetchAvailability();
    }
  }, [selectedSubId, bookingDate]);

  async function fetchAvailability() {
    setLoadingAvail(true);
    try {
      const data = await apiRequest(
        `/bookings/availability?subscription_id=${selectedSubId}&booking_date=${bookingDate}`
      );
      setAvailability(data);
    } catch (err) {
      // not fatal
    } finally {
      setLoadingAvail(false);
    }
  }

  async function handleBookSlot(e) {
    if (e) e.preventDefault();
    setError("");
    setMessage("");
    setRecommendation(null);
    setSubmitting(true);

    try {
      const booking = await apiRequest("/bookings", "POST", {
        group_id: parseInt(selectedGroupId),
        subscription_id: parseInt(selectedSubId),
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime
      });

      setMessage(`Viewing slot booked successfully for ${booking.platform_name} on ${booking.booking_date} (${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)})!`);
      fetchAvailability();
      fetchUnreadNotifications();
    } catch (err) {
      setError(err.message);
      handleGetRecommendation();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGetRecommendation() {
    setRecommendation(null);
    try {
      const rec = await apiRequest("/scheduler/recommend", "POST", {
        group_id: parseInt(selectedGroupId),
        subscription_id: parseInt(selectedSubId),
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime
      });
      setRecommendation(rec);
    } catch (err) {
      // ignore
    }
  }

  function applyRecommendedSlot(slot) {
    setBookingDate(slot.booking_date);
    setStartTime(slot.start_time.slice(0, 5));
    setEndTime(slot.end_time.slice(0, 5));
    setError("");
    setMessage(`Applied recommendation: ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}! Click "Confirm & Book Slot" to confirm.`);
  }

  const filteredSubs = subscriptions.filter(s => s.group_id === parseInt(selectedGroupId));
  const currentSub = subscriptions.find(s => s.id === parseInt(selectedSubId));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Viewing Slot</h1>
          <p className="page-subtitle">Reserve uninterrupted viewing time with automatic capacity checking</p>
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
        {/* Booking Form */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarPlus size={18} style={{ color: "var(--primary)" }} />
              <span>Select Group & Platform</span>
            </div>
          </div>

          <form onSubmit={handleBookSlot}>
            <div className="form-group">
              <label className="form-label">Group</label>
              <select
                className="form-control"
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                required
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">OTT Subscription</label>
              <select
                className="form-control"
                value={selectedSubId}
                onChange={(e) => { setSelectedSubId(e.target.value); setRecommendation(null); }}
                required
              >
                {filteredSubs.length === 0 && <option value="">No subscriptions in this group</option>}
                {filteredSubs.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.platform_name} (Max: {s.max_capacity} Users)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.5rem" }}
              disabled={submitting || !selectedSubId}
            >
              {submitting ? "Checking Availability..." : "Confirm & Book Slot"}
            </button>
          </form>
        </div>

        {/* AI Recommendation / Details Panel */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sparkles size={18} style={{ color: "var(--accent-purple)" }} />
              <span>Scheduling Assistant</span>
            </div>
          </div>

          {currentSub && (
            <div style={{
              padding: "0.85rem 1rem",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius)",
              marginBottom: "1rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>
                  {currentSub.platform_name}
                </strong>
                <span className="badge badge-info">{currentSub.max_capacity} Users Max</span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                Plan: {currentSub.plan_name} • Group: {currentSub.group_name}
              </p>
            </div>
          )}

          {recommendation && !recommendation.is_requested_available && recommendation.recommended_slot && (
            <div style={{
              padding: "1rem",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              borderRadius: "var(--radius)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span className="badge badge-warning">AI Recommendation</span>
                <strong style={{ fontSize: "0.9rem", color: "#ffffff" }}>Alternative Slot Found</strong>
              </div>
              <p style={{ fontSize: "0.85rem", color: "#fef3c7", marginBottom: "0.75rem" }}>
                Requested time slot is at maximum capacity. The closest available time is:
              </p>
              <div style={{
                padding: "0.65rem 0.85rem",
                background: "rgba(0, 0, 0, 0.3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                marginBottom: "0.85rem"
              }}>
                <strong style={{ color: "#fbbf24", fontSize: "0.95rem" }}>
                  {recommendation.recommended_slot.booking_date} @ {recommendation.recommended_slot.start_time.slice(0, 5)} - {recommendation.recommended_slot.end_time.slice(0, 5)}
                </strong>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  {recommendation.recommended_slot.reason}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => applyRecommendedSlot(recommendation.recommended_slot)}
              >
                Apply This Recommendation
              </button>
            </div>
          )}

          {!recommendation && (
            <div style={{
              textAlign: "center",
              color: "var(--text-muted)",
              padding: "2rem 1rem",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(139, 92, 246, 0.1)",
                color: "var(--accent-purple)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.25rem"
              }}>
                <Clock size={20} />
              </div>
              <strong style={{ color: "#ffffff" }}>Automated Conflict Resolution</strong>
              <p style={{ maxWidth: 320, lineHeight: 1.5 }}>
                Select your desired viewing window. If other students already occupy all available screens, our recommendation algorithm will instantly suggest the closest free slot!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Visual Slot Availability Matrix */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>
              Live Slot Availability ({bookingDate})
            </h2>
            <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Hourly occupancy matrix for {currentSub?.platform_name || "selected platform"} (Click slot to autofill)
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%", display: "inline-block" }}></span>
              Available
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 8, height: 8, background: "#f59e0b", borderRadius: "50%", display: "inline-block" }}></span>
              Partial
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 8, height: 8, background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>
              Full
            </span>
          </div>
        </div>

        {loadingAvail ? (
          <p style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Updating availability...</p>
        ) : availability ? (
          <div className="slot-grid">
            {availability.slots.map((s, idx) => {
              const isFull = s.occupied_count >= s.max_capacity;
              const isPartial = s.occupied_count > 0 && !isFull;
              const slotClass = isFull ? "full" : isPartial ? "partially-occupied" : "available";

              return (
                <div
                  key={idx}
                  className={`slot-item ${slotClass}`}
                  onClick={() => {
                    setStartTime(s.start_time);
                    setEndTime(s.end_time);
                  }}
                  style={{ cursor: "pointer" }}
                  title={s.current_users.length > 0 ? `Viewers: ${s.current_users.join(", ")}` : "Slot Free"}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{s.start_time} - {s.end_time}</div>
                  <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                    {isFull ? (
                      <span style={{ fontWeight: "bold" }}>Full ({s.occupied_count}/{s.max_capacity})</span>
                    ) : isPartial ? (
                      <span style={{ fontWeight: "bold" }}>{s.occupied_count}/{s.max_capacity} Users</span>
                    ) : (
                      <span style={{ fontWeight: "bold" }}>Available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", padding: "2rem", textAlign: "center" }}>
            Select a subscription to view availability.
          </p>
        )}
      </div>
    </div>
  );
}
