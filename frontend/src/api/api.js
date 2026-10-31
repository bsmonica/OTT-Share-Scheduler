const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function apiRequest(endpoint, method = "GET", body = null, token = null) {
  const headers = {
    "Content-Type": "application/json"
  };

  const authToken = token || localStorage.getItem("ott_token");
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const errorMsg = data.detail || (typeof data === "string" ? data : "Request failed");
      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    throw error;
  }
}
