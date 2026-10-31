import React, { useState, useEffect } from "react";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { CreditCard, PlusCircle, CheckCircle2, AlertCircle } from "lucide-react";

export default function Subscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [groupId, setGroupId] = useState("");
  const [platformName, setPlatformName] = useState("Netflix");
  const [accountEmail, setAccountEmail] = useState("");
  const [planName, setPlanName] = useState("Standard (2 Screens)");
  const [maxCapacity, setMaxCapacity] = useState(2);
  const [renewalDate, setRenewalDate] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [subData, grpData] = await Promise.all([
        apiRequest("/subscriptions"),
        apiRequest("/groups")
      ]);
      setSubscriptions(subData || []);
      setGroups(grpData || []);
      if (grpData && grpData.length > 0) {
        setGroupId(grpData[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSubscription(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!groupId) {
      setError("Please select a group first. Create or join a group if needed.");
      return;
    }

    try {
      await apiRequest("/subscriptions", "POST", {
        group_id: parseInt(groupId),
        platform_name: platformName,
        account_email: accountEmail,
        plan_name: planName,
        max_capacity: parseInt(maxCapacity),
        renewal_date: renewalDate || null
      });

      setMessage(`Added ${platformName} subscription successfully!`);
      setAccountEmail("");
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
        Loading Subscriptions...
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">OTT Subscriptions</h1>
          <p className="page-subtitle">Manage shared platform credentials and simultaneous screen capacity</p>
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

      <div className="grid" style={{ gap: "1.5rem" }}>
        {/* Subscriptions List */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CreditCard size={18} style={{ color: "var(--primary)" }} />
              <span>Active Subscriptions ({subscriptions.length})</span>
            </div>
          </div>
          {subscriptions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", padding: "1rem 0" }}>
              No subscriptions configured yet. Add your Netflix, Prime, or Hotstar account below.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>PLATFORM</th>
                    <th>GROUP</th>
                    <th>ACCOUNT EMAIL</th>
                    <th>MAX SCREENS</th>
                    <th>PLAN</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td><strong style={{ color: "#ffffff" }}>{s.platform_name}</strong></td>
                      <td>{s.group_name}</td>
                      <td style={{ color: "var(--text-muted)" }}>{s.account_email}</td>
                      <td>
                        <span className="badge badge-info">{s.max_capacity} Screens</span>
                      </td>
                      <td>{s.plan_name}</td>
                      <td>
                        <span className={`badge ${s.status === "active" ? "badge-success" : "badge-danger"}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Subscription Form */}
        <div className="card">
          <div className="card-title">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <PlusCircle size={18} style={{ color: "var(--accent-purple)" }} />
              <span>Add Shared Subscription</span>
            </div>
          </div>
          <form onSubmit={handleAddSubscription}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Assign to Group</label>
                <select
                  className="form-control"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  required
                >
                  {groups.length === 0 && <option value="">No Groups Available</option>}
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Code: {g.group_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">OTT Platform</label>
                <select
                  className="form-control"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                >
                  <option value="Netflix">Netflix</option>
                  <option value="Amazon Prime Video">Amazon Prime Video</option>
                  <option value="Disney+ Hotstar">Disney+ Hotstar</option>
                  <option value="SonyLIV">SonyLIV</option>
                  <option value="Zee5">Zee5</option>
                  <option value="Apple TV+">Apple TV+</option>
                  <option value="Crunchyroll">Crunchyroll</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Shared Email</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. shareddorm@gmail.com"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Simultaneous Screens (Capacity)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="form-control"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Standard, Premium 4K"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Renewal Date (Optional)</label>
                <input
                  type="date"
                  className="form-control"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
              Add Shared Subscription
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
