import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const [a, setA] = useState(null);
  const [coach, setCoach] = useState(null);
  const [err, setErr] = useState("");
  const [loadingCoach, setLoadingCoach] = useState(false);

  useEffect(() => {
    api.get("/analytics/me").then(r => setA(r.data)).catch(e => setErr("Could not load analytics"));
  }, []);

  async function getCoach() {
    setLoadingCoach(true);
    try {
      const r = await api.post("/ai/coach", {
        language: user.lang_pref,
        recent_wpm: a?.avg_wpm || 0,
        recent_accuracy: a?.avg_accuracy || 0,
        common_errors: a?.weak_areas || [],
        weak_chapters: [],
      });
      setCoach(r.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Coach unavailable — upgrade to Pro for unlimited coaching.");
    } finally {
      setLoadingCoach(false);
    }
  }

  return (
    <div className="container">
      <h1 style={{marginTop:0}}>Namaste, {user?.name || user?.email} 👋</h1>
      <p className="muted">Target: <b>{user?.exam_target}</b> · Plan: <b>{user?.plan}</b> · Language: <b>{user?.lang_pref}</b></p>

      {err && <div className="error" style={{marginBottom:12}}>{err}</div>}

      <div className="stat-grid">
        <div className="stat"><div className="k">Total sessions</div><div className="v">{a?.total_attempts ?? "—"}</div></div>
        <div className="stat"><div className="k">Best WPM</div><div className="v">{a?.best_wpm ?? "—"}</div></div>
        <div className="stat"><div className="k">Avg accuracy</div><div className="v">{a ? `${a.avg_accuracy}%` : "—"}</div></div>
        <div className="stat"><div className="k">Streak</div><div className="v">{a?.streak_days ?? 0}d</div></div>
      </div>

      <div className="grid-2" style={{marginTop:16}}>
        <div className="card">
          <h3 style={{marginTop:0}}>Quick start</h3>
          <ul className="clean">
            <li><Link to="/app/typing">⚡ Start a typing test</Link></li>
            <li><Link to="/app/steno">✍️ Shorthand practice</Link></li>
            <li><Link to="/app/lessons">📖 Browse lessons</Link></li>
            <li><Link to="/pricing">💎 Upgrade to Pro</Link></li>
          </ul>
        </div>
        <div className="card">
          <h3 style={{marginTop:0}}>🧑‍🏫 AI Coach</h3>
          {!coach && (
            <>
              <p className="muted small">Get a personalised 30-minute drill plan based on your recent attempts.</p>
              <button className="btn" onClick={getCoach} disabled={loadingCoach}>
                {loadingCoach ? "Generating..." : "Get my drill plan"}
              </button>
            </>
          )}
          {coach && (
            <>
              <p>{coach.summary}</p>
              <ul className="clean">
                {coach.drills.map((d, i) => (
                  <li key={i}>
                    <strong>{d.name}</strong> · {d.minutes} min
                    <div className="muted small">{d.desc}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {a?.progress?.length > 0 && (
        <div className="card" style={{marginTop:16}}>
          <h3 style={{marginTop:0}}>Last 30 days</h3>
          <ProgressBars data={a.progress} />
        </div>
      )}
    </div>
  );
}

function ProgressBars({ data }) {
  const maxWPM = Math.max(20, ...data.map(d => d.wpm));
  return (
    <div style={{display: "grid", gridTemplateColumns: `repeat(${data.length}, minmax(18px, 1fr))`, gap: 4, alignItems: "end", height: 140, marginTop: 8}}>
      {data.map(d => (
        <div key={d.date} title={`${d.date}: ${d.wpm} WPM · ${d.accuracy}%`}>
          <div style={{
            height: `${(d.wpm / maxWPM) * 100}%`,
            background: "var(--accent)",
            borderRadius: 4, minHeight: 3,
          }} />
        </div>
      ))}
    </div>
  );
}
