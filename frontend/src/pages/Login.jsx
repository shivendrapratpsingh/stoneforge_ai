import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault(); setErr("");
    try {
      await login(email, password);
      nav(loc.state?.from?.pathname || "/app", { replace: true });
    } catch (ex) {
      setErr(ex?.response?.data?.detail || "Login failed");
    }
  }

  return (
    <div className="container" style={{maxWidth: 440}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Log in</h2>
        <form onSubmit={submit}>
          <label className="label">Email</label>
          <input className="input" type="email" required
            value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/>
          <label className="label" style={{marginTop:12}}>Password</label>
          <input className="input" type="password" required
            value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/>
          {err && <div className="error" style={{marginTop:12}}>{err}</div>}
          <button className="btn" type="submit" disabled={loading} style={{marginTop:16,width:"100%"}}>
            {loading ? "..." : "Log in"}
          </button>
        </form>
        <p className="muted small" style={{marginTop:14}}>
          No account? <Link to="/signup">Sign up free →</Link>
        </p>
      </div>
    </div>
  );
}
