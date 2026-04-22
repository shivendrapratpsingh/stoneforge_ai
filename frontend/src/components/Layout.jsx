import { Outlet, NavLink, Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-brand">StenoForge AI</Link>
        <div className="nav-links">
          {user && <NavLink to="/app">Dashboard</NavLink>}
          {user && <NavLink to="/app/typing">Typing</NavLink>}
          {user && <NavLink to="/app/steno">Shorthand</NavLink>}
          {user && <NavLink to="/app/lessons">Lessons</NavLink>}
          <NavLink to="/pricing">Pricing</NavLink>
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
