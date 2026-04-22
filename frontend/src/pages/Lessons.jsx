import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function Lessons() {
  const { user } = useAuth();
  const [kind, setKind] = useState("typing");
  const [language, setLanguage] = useState(user?.lang_pref || "en");
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    api.get(`/lessons?kind=${kind}&language=${language}`).then(r => setLessons(r.data));
  }, [kind, language]);

  return (
    <div className="container">
      <h1 style={{marginTop:0}}>Lessons</h1>
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

      <div className="grid-2" style={{marginTop:16}}>
        {lessons.map(l => (
          <div key={l.id} className="card">
            <div className="row" style={{justifyContent:"space-between"}}>
              <strong>{l.title}</strong>
              {l.is_free
                ? <span className="badge" style={{background:"rgba(34,197,94,0.15)", color:"var(--success)"}}>FREE</span>
                : <span className="badge">PRO</span>}
            </div>
            <div className="muted small" style={{marginTop:6}}>
              {l.content_json?.locked
                ? <em>🔒 Upgrade to Pro to unlock this lesson. <Link to="/pricing">See plans</Link></em>
                : (l.content_json?.text || l.content_json?.body || "").slice(0, 180) + "…"}
            </div>
          </div>
        ))}
        {!lessons.length && <p className="muted">No lessons yet.</p>}
      </div>
    </div>
  );
}
