import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

const DEFAULT_EN = "The Government of India has launched several digital schemes to promote literacy among youth. These initiatives aim to make the country a knowledge based economy by the end of the decade.";
const DEFAULT_HI = "सरकार ने युवाओं के लिए कई रोज़गार योजनाएँ शुरू की हैं। इन योजनाओं का उद्देश्य कौशल विकास के माध्यम से आत्मनिर्भर भारत का निर्माण करना है।";

export default function TypingTrainer() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const lessonSlug = searchParams.get("lesson");

  const [language, setLanguage] = useState(user?.lang_pref || "en");
  const [prompt, setPrompt]     = useState(language === "hi" ? DEFAULT_HI : DEFAULT_EN);
  const [typed, setTyped]       = useState("");
  const [startAt, setStartAt]   = useState(null);
  const [elapsed, setElapsed]   = useState(0);
  const [result, setResult]     = useState(null);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState("");
  const [lessonMeta, setLessonMeta] = useState(null);   // { title, locked }
  const [gen, setGen]           = useState({ topic: "", difficulty: "medium", word_count: 120, target_wpm: 40 });
  const inputRef = useRef(null);
  const tickRef  = useRef(null);

  useEffect(() => () => clearInterval(tickRef.current), []);

  // When the URL has ?lesson=<slug>, load that lesson's text as the prompt.
  useEffect(() => {
    if (!lessonSlug) { setLessonMeta(null); return; }
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get(`/lessons/${encodeURIComponent(lessonSlug)}`);
        if (cancelled) return;
        const l = r.data;
        const locked = !!l.content_json?.locked;
        setLessonMeta({ title: l.title, locked, slug: l.slug, kind: l.kind });
        if (locked) {
          setError("This lesson is Pro-only. Upgrade to unlock.");
          return;
        }
        const txt = l.content_json?.text || l.content_json?.body || "";
        if (txt) {
          setPrompt(txt);
          setLanguage(l.language || "en");
          setTyped(""); setResult(null); setStartAt(null); setElapsed(0); setError("");
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.detail || "Could not load lesson");
      }
    })();
    return () => { cancelled = true; };
  }, [lessonSlug]);

  function reset() {
    setTyped(""); setResult(null); setStartAt(null); setElapsed(0); setError("");
    clearInterval(tickRef.current);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function onType(e) {
    const v = e.target.value;
    setTyped(v);
    if (!startAt && v.length > 0) {
      const now = Date.now();
      setStartAt(now);
      tickRef.current = setInterval(() => {
        setElapsed((Date.now() - now) / 1000);
      }, 200);
    }
  }

  async function submit() {
    if (!typed) return;
    setBusy(true); setError("");
    const duration_sec = startAt ? (Date.now() - startAt) / 1000 : 0;
    clearInterval(tickRef.current);
    try {
      const r = await api.post("/typing/evaluate", {
        prompt_text: prompt, typed_text: typed, duration_sec, language,
      });
      setResult(r.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Evaluation failed");
    } finally {
      setBusy(false);
    }
  }

  async function generatePrompt() {
    setBusy(true); setError(""); setResult(null);
    try {
      const r = await api.post("/ai/paragraph", {
        language,
        topic: gen.topic,
        difficulty: gen.difficulty,
        target_wpm: Number(gen.target_wpm),
        exam_style: user?.exam_target || "ssc_steno",
        word_count: Number(gen.word_count),
      });
      setPrompt(r.data.text);
      setLessonMeta(null);
      reset();
    } catch (e) {
      setError(e?.response?.data?.detail || "Could not generate paragraph");
    } finally {
      setBusy(false);
    }
  }

  // Character-level rendering with correct / wrong / pending
  const chars = prompt.split("").map((c, i) => {
    let cls = "ch-pending";
    if (i < typed.length) cls = typed[i] === c ? "ch-correct" : "ch-wrong";
    else if (i === typed.length) cls = "ch-current";
    return <span key={i} className={cls}>{c}</span>;
  });

  // live stats while typing
  const liveWPM = elapsed > 2
    ? Math.round((typed.length / 5) / (elapsed / 60))
    : 0;
  const alignedCorrect = typed.split("").reduce((acc, c, i) => acc + (prompt[i] === c ? 1 : 0), 0);
  const liveAcc = typed.length ? Math.round((alignedCorrect / typed.length) * 1000) / 10 : 0;

  return (
    <div className="container">
      <h1 style={{marginTop:0}}>Typing Trainer</h1>

      {lessonMeta && (
        <div className="card" style={{marginBottom:12, background:"rgba(59,130,246,0.08)", borderColor:"rgba(59,130,246,0.35)"}}>
          <div className="row" style={{justifyContent:"space-between", alignItems:"center", gap:10}}>
            <div>
              <div className="muted small">Practicing lesson</div>
              <strong style={{fontSize:"1.1rem"}}>{lessonMeta.title}</strong>
            </div>
            <div className="row" style={{gap:8}}>
              {lessonMeta.locked && <Link className="btn" to="/pricing">Upgrade</Link>}
              <Link className="btn ghost" to="/app/lessons">← Back to lessons</Link>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="row" style={{flexWrap:"wrap", gap: 10, marginBottom: 12}}>
          <select className="input" style={{maxWidth:140}} value={language}
            onChange={e => { setLanguage(e.target.value); setPrompt(e.target.value === "hi" ? DEFAULT_HI : DEFAULT_EN); setLessonMeta(null); reset(); }}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
          <select className="input" style={{maxWidth:160}} value={gen.difficulty}
            onChange={e => setGen({...gen, difficulty: e.target.value})}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <input className="input" style={{maxWidth:140}} type="number" min="30" max="400"
            value={gen.word_count} onChange={e => setGen({...gen, word_count: e.target.value})}
            placeholder="word count"/>
          <input className="input" style={{maxWidth:140}} type="number" min="20" max="120"
            value={gen.target_wpm} onChange={e => setGen({...gen, target_wpm: e.target.value})}
            placeholder="target WPM"/>
          <input className="input" style={{flex:1, minWidth:160}} placeholder="topic (optional)"
            value={gen.topic} onChange={e => setGen({...gen, topic: e.target.value})}/>
          <button className="btn" onClick={generatePrompt} disabled={busy}>
            {busy ? "..." : "Generate"}
          </button>
          <button className="btn ghost" onClick={reset}>Reset</button>
        </div>

        <div className="prompt-box" lang={language}>{chars}</div>

        <textarea
          ref={inputRef}
          className="input"
          style={{marginTop: 12, minHeight: 120, fontFamily:"inherit"}}
          value={typed}
          onChange={onType}
          placeholder="Start typing here — the timer begins on your first keystroke."
          disabled={!!result}
          lang={language}
        />

        <div className="stat-grid" style={{marginTop:12}}>
          <div className="stat"><div className="k">Live WPM</div><div className="v">{liveWPM}</div></div>
          <div className="stat"><div className="k">Live Accuracy</div><div className="v">{liveAcc}%</div></div>
          <div className="stat"><div className="k">Time</div><div className="v">{elapsed.toFixed(1)}s</div></div>
          <div className="stat"><div className="k">Chars</div><div className="v">{typed.length}/{prompt.length}</div></div>
        </div>

        {error && <div className="error" style={{marginTop:12}}>{error}</div>}

        <div className="row" style={{marginTop:12, justifyContent:"flex-end"}}>
          <button className="btn" disabled={busy || !typed} onClick={submit}>
            {busy ? "..." : "Submit & Grade"}
          </button>
        </div>
      </div>

      {result && (
        <div className="card" style={{marginTop:16}}>
          <h3 style={{marginTop:0}}>Result</h3>
          <div className="stat-grid">
            <div className="stat"><div className="k">Net WPM</div><div className="v">{result.wpm}</div></div>
            <div className="stat"><div className="k">Gross WPM</div><div className="v">{result.gross_wpm}</div></div>
            <div className="stat"><div className="k">Accuracy</div><div className="v">{result.accuracy}%</div></div>
            <div className="stat"><div className="k">Errors</div><div className="v">{result.errors?.length || 0}</div></div>
          </div>
          {result.errors?.length > 0 && (
            <>
              <h4>Error breakdown</h4>
              <ul className="clean">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    <code style={{color: "var(--danger)"}}>{e.prompt_slice || "∅"}</code>
                    {" → "}
                    <code style={{color: "var(--success)"}}>{e.typed_slice || "∅"}</code>
                    <span className="muted small"> ({e.type})</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button className="btn" onClick={reset} style={{marginTop:12}}>Next attempt</button>
        </div>
      )}
    </div>
  );
}
