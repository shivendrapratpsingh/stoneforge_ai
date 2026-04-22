import { useEffect, useState } from "react";
import { Outlet, NavLink, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function PromoBanner() {
  const [promo, setPromo] = useState(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await api.get("/promo/status");
        if (alive) setPromo(r.data);
      } catch {}
    }
    load();
    const t = setInterval(load, 300_000); // re-check every 5 min
    return () => { alive = false; clearInterval(t); };
  }, []);
  if (!promo?.active) return null;
  const exp = promo.expires_at ? new Date(promo.expires_at) : null;
  return (
    <div style={{
      background: "linear-gradient(90deg, #f2c94c, #f29c4c)",
      color: "#1a1a1a",
      padding: "8px 16px",
      textAlign: "center",
      fontWeight: 600,
      fontSize: 14,
      borderBottom: "1px solid rgba(0,0,0,0.2)",
    }}>
      Pro is free for everyone right now
      {exp && <> — ends {exp.toLocaleDateString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</>}
      {" "}• All lessons unlocked, daily limits off
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <PromoBanner/>
      <nav className="nav">
        <Link to="/" className="nav-brand">StenoForge AI</Link>
        <div className="nav-links">
          {user && <NavLink to="/app">Dashboard</NavLink>}
          {user && <NavLink to="/app/typing">Typing</NavLink>}
          {user && <NavLink to="/app/steno">Shorthand</NavLink>}
          {user && <NavLink to="/app/lessons">Lessons</NavLink>}
          <NavLink to="/pricing">Pricing</NavLink>
          {user?.is_admin && <NavLink to="/admin">Admin</NavLink>}
          {!user ? (
            <>
              <NavLink to="/login">Login</NavLink>
              <Link to="/signup" className="btn">Start free</Link>
            </>
          ) : (
            <>
              <span className="small muted">{user.email} · {user.plan}</span>
              <button className="btn ghost" onClick={logout}>Logout</button>
            </>
          )}
        </div>
      </nav>
      <Outlet />
    </>
  );
}
