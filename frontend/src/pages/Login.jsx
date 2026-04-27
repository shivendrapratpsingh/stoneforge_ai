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
        <form onSubmit={submit} autoComplete="off">
          {/* Honeypot fields — fool Chrome/Edge into autofilling these
              hidden inputs instead of the real ones. */}
          <input type="text" name="fake-user" autoComplete="username" style={{display:"none"}} tabIndex={-1} aria-hidden="true"/>
          <input type="password" name="fake-pass" autoComplete="new-password" style={{display:"none"}} tabIndex={-1} aria-hidden="true"/>

          <label className="label">Email</label>
          <input className="input" type="email" required
            name="login-email-no-autofill"
            value={email} onChange={e=>setEmail(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"/>
          <label className="label" style={{marginTop:12}}>Password</label>
          <input className="input" type="password" required
            name="login-password-no-autofill"
            value={password} onChange={e=>setPassword(e.target.value)}
            autoComplete="new-password"
            data-lpignore="true"
            data-form-type="other"/>
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
