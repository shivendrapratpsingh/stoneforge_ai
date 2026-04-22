import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("stf_user") || "null"); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // re-fetch profile on mount if we have a token
    const token = localStorage.getItem("stf_token");
    if (token && !user) {
      api.get("/auth/me").then((r) => {
        setUser(r.data);
        localStorage.setItem("stf_user", JSON.stringify(r.data));
      }).catch(() => {});
    }
  }, []);

  async function signup(payload) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/signup", payload);
      localStorage.setItem("stf_token", data.access_token);
      localStorage.setItem("stf_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally { setLoading(false); }
  }

  async function login(email, password) {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("stf_token", data.access_token);
      localStorage.setItem("stf_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally { setLoading(false); }
  }

  function logout() {
    localStorage.removeItem("stf_token");
    localStorage.removeItem("stf_user");
    setUser(null);
  }

  async function refreshUser() {
    const r = await api.get("/auth/me");
    setUser(r.data);
    localStorage.setItem("stf_user", JSON.stringify(r.data));
    return r.data;
  }

  return (
    <AuthCtx.Provider value={{ user, loading, signup, login, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
