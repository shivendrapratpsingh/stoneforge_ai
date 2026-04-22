import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

const PLAN_META = {
  pro_monthly:       { title: "Pro Monthly",       highlight: true,
    perks: ["Unlimited AI paragraphs", "All 30 typing + 24 shorthand lessons",
            "Unlimited attempts", "AI personal coach", "Progress analytics"] },
  pro_yearly:        { title: "Pro Yearly",        highlight: true,
    perks: ["Everything in Pro Monthly", "Save ~58% vs monthly",
            "2 months free", "Priority support"] },
  institute_monthly: { title: "Institute",          highlight: false,
    perks: ["Up to 25 student accounts", "Teacher dashboard",
            "Bulk progress reports", "Custom exam packs", "Priority onboarding"] },
};

export default function Pricing() {
  const { user, refreshUser } = useAuth();
  const nav = useNavigate();
  const [plans, setPlans] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api.get("/payments/plans").then(r => setPlans(r.data));
  }, []);

  async function buy(code) {
    if (!user) { nav("/signup"); return; }
    setBusy(code); setErr("");
    try {
      const { data: order } = await api.post("/payments/create-order", { plan_code: code });
      // Try the Razorpay checkout widget if it's loaded; otherwise use mock flow
      if (window.Razorpay && !String(order.order_id).startsWith("order_mock_")) {
        const rzp = new window.Razorpay({
          key: order.key_id, amount: order.amount, currency: order.currency,
          name: "StenoForge AI", order_id: order.order_id,
          description: PLAN_META[code].title,
          prefill: { email: user.email, contact: user.phone || "" },
          theme: { color: "#facc15" },
          handler: async (resp) => {
            await api.post("/payments/verify", {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              plan_code: code,
            });
            await refreshUser();
            nav("/app");
          }
        });
        rzp.open();
      } else {
        // Mock-mode verify (dev only)
        await api.post("/payments/verify", {
          razorpay_order_id: order.order_id,
          razorpay_payment_id: "pay_mock_" + Date.now(),
          razorpay_signature: "mock_devtest",
          plan_code: code,
        });
        await refreshUser();
        alert("Mock payment successful — your account is now Pro (dev mode).");
        nav("/app");
      }
    } catch (e) {
      setErr(e?.response?.data?.detail || "Payment failed");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="container">
      <h1 style={{textAlign:"center", marginTop:0}}>Simple pricing, built for Indian students</h1>
      <p className="muted center">Start free · cancel anytime · GST invoice on request</p>

      {err && <div className="error" style={{marginTop:12}}>{err}</div>}

      <div className="price-grid" style={{marginTop:24}}>
        {plans && Object.entries(plans).map(([code, p]) => {
          const meta = PLAN_META[code];
          if (!meta) return null;
          return (
            <div key={code} className={`price-card ${meta.highlight ? "highlight" : ""}`}>
              <div className="badge">{code.includes("yearly") ? "BEST VALUE" : meta.highlight ? "POPULAR" : "TEAMS"}</div>
              <h3 style={{marginTop:0}}>{meta.title}</h3>
              <div className="price">
                ₹{Number(p.amount_rupees).toLocaleString("en-IN")}
                <small> / {code.includes("yearly") ? "year" : "month"}</small>
              </div>
              <ul className="clean">
                {meta.perks.map((perk, i) => <li key={i}>✓ {perk}</li>)}
              </ul>
              <button className="btn" disabled={!!busy} onClick={() => buy(code)} style={{width:"100%"}}>
                {busy === code ? "..." : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="muted small center" style={{marginTop:24}}>
        Secure payments via Razorpay · No auto-debit without consent
      </p>
    </div>
  );
}
