import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Signup() {
  const { signup, loading } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    email: "", password: "", name: "", phone: "",
    lang_pref: "en", exam_target: "ssc_steno"
  });
  const [err, setErr] = useState("");

  function up(k){ return e => setF({...f, [k]: e.target.value}); }

  async function submit(e) {
    e.preventDefault(); setErr("");
    try {
      await signup(f);
      nav("/app", { replace: true });
    } catch (ex) {
      const d = ex?.response?.data?.detail;
      let msg;
      if (Array.isArray(d)) {
        msg = d.map(x => `${(x.loc || []).join('.')}: ${x.msg}`).join(' | ');
      } else if (typeof d === "string") {
        msg = d;
      } else if (ex?.response?.status) {
        msg = `Signup failed (HTTP ${ex.response.status})`;
      } else {
        msg = `Signup failed: ${ex?.message || "backend unreachable — is it running on :8003?"}`;
      }
      setErr(msg);
    }
  }

  return (
    <div className="container" style={{maxWidth: 520}}>
      <div className="card">
        <h2 style={{marginTop:0}}>Create your free account</h2>
        <form onSubmit={submit}>
          <div className="grid-2">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={f.name} onChange={up("name")}/>
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input" value={f.phone} onChange={up("phone")}/>
            </div>
          </div>
          <label className="label" style={{marginTop:12}}>Email</label>
          <input className="input" type="email" required value={f.email} onChange={up("email")}/>
          <label className="label" style={{marginTop:12}}>Password</label>
          <input className="input" type="password" required minLength={6}
            value={f.password} onChange={up("password")}/>
          <div className="grid-2" style={{marginTop:12}}>
            <div>
              <label className="label">Language</label>
              <select className="input" value={f.lang_pref} onChange={up("lang_pref")}>
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
            <div>
              <label className="label">Target exam</label>
              <select className="input" value={f.exam_target} onChange={up("exam_target")}>
                <option value="ssc_steno">SSC Stenographer (Grade C/D)</option>
                <option value="ssc_cgl_chsl">SSC CGL / CHSL</option>
                <option value="bank_po_clerk">Bank PO / Clerk</option>
                <option value="court_clerk">Court Clerk / Judicial</option>
                <option value="general">General purpose</option>
              </select>
            </div>
          </div>
          {err && <div className="error" style={{marginTop:12}}>{err}</div>}
          <button className="btn" type="submit" disabled={loading} style={{marginTop:16,width:"100%"}}>
            {loading ? "Creating..." : "Create account — it's free"}
          </button>
        </form>
        <p className="muted small" style={{marginTop:14}}>
          Already have an account? <Link to="/login">Log in →</Link>
        </p>
      </div>
    </div>
  );
}
