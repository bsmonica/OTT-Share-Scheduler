import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Play, AlertCircle, UserCheck, Shield } from "lucide-react";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message || "Authentication failed. Please check details.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(type) {
    if (type === "user") {
      setEmail("monica@college.edu");
      setPassword("Password123!");
    } else {
      setEmail("admin@college.edu");
      setPassword("AdminPassword123!");
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "14px",
            background: "var(--primary-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem auto",
            boxShadow: "var(--primary-glow)",
            color: "#ffffff"
          }}>
            <Play size={24} fill="#ffffff" stroke="none" />
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.01em" }}>
            OTT Share Scheduler
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
            Intelligent OTT Subscription & Slot Scheduling
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? "active" : ""}`}
            onClick={() => { setIsRegister(false); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? "active" : ""}`}
            onClick={() => { setIsRegister(true); setError(""); }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g. student@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">Student User (Normal)</option>
                <option value="admin">Administrator (Admin privileges)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "1.75rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1.25rem" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginBottom: "0.65rem", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
            Quick Demo Access
          </p>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fillDemo("user")}
            >
              <UserCheck size={14} />
              <span>Demo Student</span>
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fillDemo("admin")}
            >
              <Shield size={14} />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
