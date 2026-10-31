import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../api/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("ott_token") || null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await apiRequest("/users/me", "GET", null, token);
          setUser(profile);
          fetchUnreadNotifications(token);
        } catch (err) {
          console.error("Token invalid or expired", err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  async function fetchUnreadNotifications(authToken = token) {
    if (!authToken) return;
    try {
      const data = await apiRequest("/notifications", "GET", null, authToken);
      setUnreadCount(data.unread_count || 0);
    } catch (e) {
      // ignore
    }
  }

  async function login(email, password) {
    const data = await apiRequest("/auth/login", "POST", { email, password });
    localStorage.setItem("ott_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    fetchUnreadNotifications(data.access_token);
    return data.user;
  }

  async function register(name, email, password, role = "user") {
    const data = await apiRequest("/auth/register", "POST", { name, email, password, role });
    localStorage.setItem("ott_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    fetchUnreadNotifications(data.access_token);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("ott_token");
    setToken(null);
    setUser(null);
    setUnreadCount(0);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, unreadCount, fetchUnreadNotifications }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
