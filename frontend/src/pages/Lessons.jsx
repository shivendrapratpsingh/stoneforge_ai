import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function Lessons() {
  const { user } = useAuth();
  const [kind, setKind] = useState("typing");
  const [language, setLanguage] = useState(user?.lang_pref || "en");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await api.get(`/lessons?kind=${kind}&language=${language}`);
      setLessons(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      const msg = e?.response?.data?.detail
        || e?.message
        || "Could not reach the lessons service.";
      setError(msg);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [kind, language]);

  async function reseed() {
    if (!user?.is_admin) return;
    try {
      const r = await api.post("/admin/reseed");
      alert(`Seed done — lessons in DB: ${r.data?.lessons_after ?? "?"}`);
      load();
    } catch (e) {
      alert("Reseed failed: " + (e?.response?.data?.detail || e?.message));
    }
  }

  function targetFor(l) {
    if (l.content_json?.locked) return "/pricing";
    if (l.kind === "steno") return `/app/steno?lesson=${encodeURIComponent(l.slug)}`;
    return `/app/typing?lesson=${encodeURIComponent(l.slug)}`;
  }

  return (
    <div className="container">
      <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
        <h1 style={{marginTop:0}}>Lessons</h1>
        {user?.is_admin && (
          <button className="btn ghost" onClick={reseed} title="Admin: repopulate lessons in DB">
            Reseed lessons
          </button>
        )}
      </div>

      <div className="row" style={{gap:10}}>
        <select className="input" style={{maxWidth:180}} value={kind} onChange={e=>setKind(e.target.value)}>
          <option value="typing">Typing</option>
          <option value="steno">Shorthand</option>
        </select>
        <select className="input" style={{maxWidth:140}} value={language} onChange={e=>setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </div>

      {error && (
        <div className="card" style={{marginTop:16, borderColor:"var(--danger)", background:"rgba(239,68,68,0.08)"}}>
          <strong style={{color:"var(--danger)"}}>Could not load lessons</strong>
          <div className="small muted" style={{marginTop:4}}>{error}</div>
          <div className="small muted" style={{marginTop:6}}>
            If this keeps happening, the backend may be waking up (free tier cold-start). Try again in ~30 seconds.
          </div>
          <button className="btn" style={{marginTop:10}} onClick={load}>Retry</button>
        </div>
      )}

      <div className="grid-2" style={{marginTop:16}}>
        {loading && <p className="muted">Loading lessons…</p>}

        {!loading && lessons.map(l => {
          const locked = !!l.content_json?.locked;
          const preview = locked
            ? "🔒 Upgrade to Pro to unlock this lesson."
            : (l.content_json?.text || l.content_json?.body || "").slice(0, 180) + "…";
          return (
            <Link
              key={l.id}
              to={targetFor(l)}
              className="card"
              style={{
                textDecoration:"none",
                color:"inherit",
                display:"block",
                cursor:"pointer",
                transition:"transform 0.12s ease, box-shadow 0.12s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div className="row" style={{justifyContent:"space-between"}}>
                <strong>{l.title}</strong>
                {l.is_free
                  ? <span className="badge" style={{background:"rgba(34,197,94,0.15)", color:"var(--success)"}}>FREE</span>
                  : <span className="badge">PRO</span>}
              </div>
              <div className="muted small" style={{marginTop:6}}>
                {locked ? <em>{preview} See plans →</em> : preview}
              </div>
              <div className="small" style={{marginTop:10, color:"var(--primary, #3b82f6)", fontWeight:600}}>
                {locked ? "Upgrade →" : "Start practicing →"}
              </div>
            </Link>
          );
        })}

        {!loading && !error && lessons.length === 0 && (
          <div className="card">
            <strong>No lessons for this combo yet.</strong>
            <div className="small muted" style={{marginTop:4}}>
              The content set ships with 30 typing + 24 shorthand lessons per language.
              If nothing shows here, the DB is likely un-seeded.
              {user?.is_admin
                ? " Click \"Reseed lessons\" above to populate."
                : " Ask an admin to run the reseed."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
