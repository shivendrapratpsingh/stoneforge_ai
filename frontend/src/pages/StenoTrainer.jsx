import { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function StenoTrainer() {
  const { user } = useAuth();
  const [language, setLanguage] = useState(user?.lang_pref || "en");
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [current, setCurrent] = useState(null);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { search(""); /* initial list */ }, [language]);

  async function search(query) {
    try {
      const r = await api.get(`/steno/search`, { params: { q: query || "a", language } });
      setResults(r.data.results);
    } catch {}
  }

  async function check() {
    if (!current) return;
    setBusy(true); setFeedback(null);
    try {
      const r = await api.post("/steno/evaluate", {
        shorthand: current.shorthand, typed, language
      });
      setFeedback(r.data);
    } finally { setBusy(false); }
  }

  return (
    <div className="container">
      <h1 style={{marginTop:0}}>Shorthand Trainer</h1>
      <div className="card">
        <div className="row" style={{gap:10}}>
          <select className="input" style={{maxWidth:140}} value={language}
            onChange={e => { setLanguage(e.target.value); setCurrent(null); setTyped(""); setFeedback(null); }}>
            <option value="en">English (Pitman)</option>
            <option value="hi">हिन्दी</option>
          </select>
          <input className="input" placeholder="Search outlines..."
            value={q} onChange={e => { setQ(e.target.value); search(e.target.value); }}/>
        </div>

        <div className="grid-2" style={{marginTop:16}}>
          <div>
            <h3 style={{marginTop:0}}>Outlines</h3>
            <ul className="clean" style={{maxHeight: 360, overflow:"auto"}}>
              {results.map((r,i) => (
                <li key={i}
                    style={{cursor:"pointer", background: current?.shorthand === r.shorthand ? "var(--surface2)" : ""}}
                    onClick={() => { setCurrent(r); setTyped(""); setFeedback(null); }}>
                  <code style={{color:"var(--accent)"}}>{r.shorthand}</code>
                  <span className="muted small"> → {r.longhand}</span>
                </li>
              ))}
              {!results.length && <li className="muted small">No outlines match.</li>}
            </ul>
          </div>

          <div>
            <h3 style={{marginTop:0}}>Practice</h3>
            {!current && <p className="muted small">Select an outline from the list to practice.</p>}
            {current && (
              <>
                <div className="prompt-box" style={{fontSize: 28, textAlign:"center"}} lang={language}>
                  <code style={{color: "var(--accent)"}}>{current.shorthand}</code>
                </div>
                <p className="muted small" style={{marginTop:8}}>Type the longhand word this outline represents.</p>
                <input className="input" value={typed} lang={language}
                  onChange={e => setTyped(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") check(); }}
                  placeholder="longhand..."/>
                <div className="row" style={{marginTop:12, gap:10}}>
                  <button className="btn" onClick={check} disabled={busy || !typed}>Check</button>
                  <button className="btn ghost" onClick={() => { setTyped(""); setFeedback(null); }}>Clear</button>
                </div>
                {feedback && (
                  <div className={feedback.is_correct ? "success" : "error"} style={{marginTop:12}}>
                    {feedback.is_correct
                      ? `✓ Correct — "${feedback.expected}"`
                      : `✗ ${feedback.hint || `Expected: ${feedback.expected}`}`}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
