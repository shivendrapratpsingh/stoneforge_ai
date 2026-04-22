import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

/** Tiny card primitive to avoid any CSS plumbing. */
function StatCard({ label, value, sub }) {
  return (
    <div style={{
      background: "#11161f", border: "1px solid #22304a",
      borderRadius: 12, padding: "16px 18px", minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: "#8ea0bf", textTransform: "uppercase",
                    letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#8ea0bf", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Sparkline({ series }) {
  const max = Math.max(1, ...series.map(p => p.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4,
                  height: 60, marginTop: 6 }}>
      {series.map((p) => (
        <div key={p.date} title={`${p.date}: ${p.count}`}
             style={{
               width: 18,
               height: `${(p.count / max) * 100}%`,
               minHeight: p.count > 0 ? 4 : 2,
               background: p.count > 0 ? "#f2c94c" : "#22304a",
               borderRadius: 3,
             }}/>
      ))}
    </div>
  );
}

export default function AdminStats() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const r = await api.get("/admin/stats");
        if (alive) setData(r.data);
      } catch (e) {
        if (alive) setErr(e?.response?.data?.detail || e.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 60_000); // auto-refresh every 60s
    return () => { alive = false; clearInterval(t); };
  }, []);

  const series = useMemo(() => data?.signups_series || [], [data]);

  // Gate: only admins
  if (user === null) return <Navigate to="/login" replace />;
  if (user && !user.is_admin) {
    return (
      <main style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
        <h1>Not authorised</h1>
        <p>This page is only visible to StenoForge admins.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px 32px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Admin · Usage stats</h1>
        <span style={{ fontSize: 12, color: "#8ea0bf" }}>
          {loading ? "refreshing…" :
            data ? `updated ${new Date(data.generated_at).toLocaleTimeString()}` : ""}
        </span>
      </div>

      {err && (
        <div style={{ background: "#3b1a1a", border: "1px solid #a04040",
                      padding: 12, borderRadius: 8, marginBottom: 16 }}>
          {err}
        </div>
      )}

      {!data ? (
        !err && <p>Loading…</p>
      ) : (
        <>
          <h3 style={{ color: "#8ea0bf", marginTop: 8 }}>Users</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total users" value={data.users.total}/>
            <StatCard label="New · 7 days" value={data.users.new_7d}/>
            <StatCard label="New · 30 days" value={data.users.new_30d}/>
            {Object.entries(data.users.by_plan || {}).map(([plan, cnt]) => (
              <StatCard key={plan} label={`Plan · ${plan}`} value={cnt}/>
            ))}
          </div>

          <h3 style={{ color: "#8ea0bf" }}>Active users (ran a test)</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="DAU (today)" value={data.active.dau}/>
            <StatCard label="WAU (7 days)" value={data.active.wau}/>
            <StatCard label="MAU (30 days)" value={data.active.mau}/>
          </div>

          <h3 style={{ color: "#8ea0bf" }}>Engagement</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <StatCard label="Total attempts" value={data.engagement.total_attempts}/>
            <StatCard label="Attempts · 7d" value={data.engagement.attempts_7d}/>
            <StatCard label="AI paragraphs" value={data.engagement.total_ai_generations}/>
            <StatCard label="AI · 7d" value={data.engagement.ai_generations_7d}/>
            <StatCard label="Active subs" value={data.revenue.active_subscriptions}/>
          </div>

          <h3 style={{ color: "#8ea0bf" }}>Signups · last 14 days</h3>
          <Sparkline series={series}/>
          <div style={{ fontSize: 11, color: "#8ea0bf", marginTop: 2 }}>
            {series.length > 0 && `${series[0].date} → ${series[series.length - 1].date}`}
          </div>

          <h3 style={{ color: "#8ea0bf", marginTop: 28 }}>Recent signups</h3>
          <div style={{ overflowX: "auto", border: "1px solid #22304a",
                        borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse",
                            fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#0e131c" }}>
                  <Th>When</Th><Th>Email</Th><Th>Name</Th>
                  <Th>Plan</Th><Th>Exam</Th><Th>Lang</Th>
                </tr>
              </thead>
              <tbody>
                {data.recent_signups.map((u) => (
                  <tr key={u.id} style={{ borderTop: "1px solid #22304a" }}>
                    <Td>{u.created_at ? new Date(u.created_at).toLocaleString() : ""}</Td>
                    <Td>{u.email}</Td>
                    <Td>{u.name || "—"}</Td>
                    <Td><Pill>{u.plan}</Pill></Td>
                    <Td>{u.exam_target}</Td>
                    <Td>{u.lang_pref}</Td>
                  </tr>
                ))}
                {data.recent_signups.length === 0 && (
                  <tr><Td colSpan={6} style={{ color: "#8ea0bf", textAlign: "center",
                                               padding: 18 }}>
                    No signups yet.
                  </Td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

function Th({ children }) {
  return <th style={{ textAlign: "left", padding: "10px 12px",
                      fontWeight: 600, color: "#8ea0bf" }}>{children}</th>;
}
function Td({ children, ...rest }) {
  return <td {...rest} style={{ padding: "10px 12px", ...(rest.style||{}) }}>
    {children}
  </td>;
}
function Pill({ children }) {
  const bg = children === "pro" ? "#2d4a2d"
           : children === "institute" ? "#4a3f2d" : "#22304a";
  return <span style={{
    background: bg, padding: "2px 10px", borderRadius: 999, fontSize: 12,
  }}>{children}</span>;
}
