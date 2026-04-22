import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <>
      <section className="hero">
        <h1>Crack <span>SSC Steno</span>, Bank PO & Court typing<br/>with AI-graded practice.</h1>
        <p>
          Live WPM + accuracy. AI-generated paragraphs in English &amp; Hindi.
          Pitman New Era shorthand drills. Built for Indian government exams.
        </p>
        <div className="row" style={{justifyContent:"center", gap: 12}}>
          <Link to="/signup" className="btn">Start free →</Link>
          <Link to="/pricing" className="btn ghost">View pricing</Link>
        </div>

        <div className="container">
          <div className="features">
            <div className="card">
              <h3>⚡ Instant WPM feedback</h3>
              <p className="muted">Net &amp; gross WPM, error-by-error diff, streak tracker.</p>
            </div>
            <div className="card">
              <h3>🤖 AI paragraph generator</h3>
              <p className="muted">Fresh exam-style passages on demand — SSC, Bank, Court.</p>
            </div>
            <div className="card">
              <h3>🇮🇳 English + हिन्दी</h3>
              <p className="muted">Devanagari support with Mangal-compatible script.</p>
            </div>
            <div className="card">
              <h3>✍️ Pitman New Era</h3>
              <p className="muted">24 structured shorthand chapters from strokes to legal vocab.</p>
            </div>
            <div className="card">
              <h3>📊 Progress analytics</h3>
              <p className="muted">30-day charts, weak-area detection, daily streaks.</p>
            </div>
            <div className="card">
              <h3>🧑‍🏫 Personal coach</h3>
              <p className="muted">AI-generated drill plan based on your recent mistakes.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
