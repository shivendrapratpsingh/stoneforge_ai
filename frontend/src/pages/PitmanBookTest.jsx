import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

/**
 * Pitman Book Test
 * ----------------
 * 20+ graded passages drawn from the Pitman New Era / Pitman 2000
 * progression — Book 1 (basic consonants & vowels) through Book 5
 * (advanced legal & government dictation).  Each test ships with
 * its target dictation speed (WPM) and a passing accuracy bar
 * (95% by default), giving learners a structured "book → lesson"
 * journey instead of random practice text.
 *
 * The user reads / takes shorthand of the passage, then types the
 * longhand transcription into the box.  We grade on:
 *   - WPM      : net WPM via /typing/evaluate
 *   - Accuracy : char-level vs. canonical longhand
 *   - Target   : both must clear the test's threshold to pass
 */

const TESTS = [
  // ─────────── BOOK 1 — Foundations ───────────
  {
    id: "b1-l01",
    book: "Book 1",
    lesson: "Lesson 1",
    title: "Simple Consonants — straight & curved strokes",
    target_wpm: 30,
    pass_acc: 95,
    notes: "Practice: P, B, T, D, CH, J, K, G — each stroke alone, then in pairs.",
    text:
`A pup taps a tub. A boy beats a drum. A judge gives a fair deal. The cook
takes a cake. A team of boys plays a game. The dog digs a deep pit. A duck
dips a beak. A bee sips a drop. A baker bakes a cake. The judge takes a
seat. A cat catches a rat. A boy buys a pop.`,
  },
  {
    id: "b1-l02",
    book: "Book 1",
    lesson: "Lesson 2",
    title: "Liquids & Nasals — L, R, M, N, NG",
    target_wpm: 32,
    pass_acc: 95,
    notes: "Add L, R, M, N, NG. Note the use of upward and downward L and R.",
    text:
`A man rang a long bell on a rainy morning. The runner ran a mile in nine
minutes. A young lamb roams along a green lane. The miller mills the corn
all morning long. A merry maiden sings a simple song. The lone monk reads
a long manuscript. A nimble lad rolls a marble. The morning rain ran on
till noon.`,
  },
  {
    id: "b1-l03",
    book: "Book 1",
    lesson: "Lesson 3",
    title: "First-Place Vowels — heavy & light dots",
    target_wpm: 32,
    pass_acc: 95,
    notes: "Heavy dot = AH/AW; light dot = A/O.",
    text:
`A calm father took a long walk along the path. The author called all the
small boys. A father saw a tall hawk on a thatched roof. The dawn was warm
and calm. A poll was taken on the law. The author taught a small class. A
calm man took a long walk. The dog sat on a small mat.`,
  },
  {
    id: "b1-l04",
    book: "Book 1",
    lesson: "Lesson 4",
    title: "Second-Place Vowels — E, I sounds",
    target_wpm: 34,
    pass_acc: 95,
    notes: "Light dot = E/I; heavy dot = AY/EE.",
    text:
`The keen pupils read the simple rhyme. A bee sits in a green tree. The
teacher leads the team to the field. We see the steeple from the green
hill. He keeps a key in a tin. The stream flows past the mill. A neat
pupil writes a clean page. The leaf is green and the sky is clear.`,
  },
  {
    id: "b1-l05",
    book: "Book 1",
    lesson: "Lesson 5",
    title: "Third-Place Vowels — U, OO sounds",
    target_wpm: 34,
    pass_acc: 95,
    notes: "Heavy dot = OO/AW; light dot = U/OO short.",
    text:
`The book is full of useful rules. The cook took a good look at the food.
A pupil should put the book on the wood shelf. The boots are too good to
throw. He took a long look at the moon. We pull the rope and push the
truck. The crew rowed the boat to the cool brook. Good food is fuel for
the body.`,
  },
  // ─────────── BOOK 2 — Short forms & common words ───────────
  {
    id: "b2-l01",
    book: "Book 2",
    lesson: "Short forms — Group A",
    title: "be, to, do, we, will, are",
    target_wpm: 50,
    pass_acc: 95,
    notes: "Common short forms drilled in connected matter.",
    text:
`We will be glad to do all we are able to do for you. We will not be able
to attend the meeting, but we will write to you in due course. You will
do well to be there in time. We are sure you will agree with us. We will
be very pleased to hear from you. We are doing all we can to be of help.`,
  },
  {
    id: "b2-l02",
    book: "Book 2",
    lesson: "Short forms — Group B",
    title: "have, his, this, that, the, of",
    target_wpm: 55,
    pass_acc: 95,
    notes: "Joining the high-frequency forms with vowel-place precision.",
    text:
`The chairman of the board has decided that this matter must be referred
to the secretary. He has the authority to deal with all such cases. This
is the second time that we have written to him on the subject of the new
contract. Of course, we have to wait for his reply before any further
action can be taken on our part.`,
  },
  {
    id: "b2-l03",
    book: "Book 2",
    lesson: "Phrasing — common business openings",
    title: "Dear Sir / Yours faithfully / We beg to inform you",
    target_wpm: 60,
    pass_acc: 95,
    notes: "Standard letter phrases joined as a single outline.",
    text:
`Dear Sir, We beg to inform you that the goods you ordered on the second
of this month were despatched yesterday by passenger train. We have to
acknowledge receipt of your cheque for the amount due on our last
account, and we thank you for the same. We trust the goods will reach
you in good condition and that they will give you every satisfaction.
Yours faithfully, John Smith and Company.`,
  },
  {
    id: "b2-l04",
    book: "Book 2",
    lesson: "60 WPM dictation",
    title: "General correspondence — supplier reply",
    target_wpm: 60,
    pass_acc: 95,
    notes: "Three minutes of plain commercial matter.",
    text:
`We are in receipt of your letter of the fifteenth instant in which you
complain that one of the cases of goods received last week was found to
be short on arrival. We have made enquiries at this end and our records
show that the case was packed and weighed in the usual way before
despatch. We can only assume that the shortage occurred in transit, and
we have therefore taken the matter up with the railway company on your
behalf. Pending their reply we shall be glad to send you a fresh
consignment to make up the deficiency, free of cost, by the next
available train.`,
  },
  {
    id: "b2-l05",
    book: "Book 2",
    lesson: "70 WPM dictation",
    title: "Bank circular — revised lending rates",
    target_wpm: 70,
    pass_acc: 95,
    notes: "Note circular phrasing: 'with effect from', 'is hereby'.",
    text:
`This is to inform all branch managers that with effect from the first of
next month the bank's marginal cost of funds based lending rate will
stand revised by twenty-five basis points. The revised rate must be
displayed on the notice board of every branch and reflected in all loan
documents executed on or after the said date. Existing borrowers on the
floating rate scheme will see the change applied automatically on the
next reset date as per the terms of their loan agreement. Any
representation from a customer regarding the revision should be referred
to the head office without delay.`,
  },
  // ─────────── BOOK 3 — Phrasing & speed building ───────────
  {
    id: "b3-l01",
    book: "Book 3",
    lesson: "80 WPM dictation",
    title: "Newspaper editorial — economy in agriculture",
    target_wpm: 80,
    pass_acc: 95,
    notes: "Editorial style: long sentences, formal vocabulary.",
    text:
`The Indian economy continues to draw a substantial part of its strength
from the agricultural sector, which still employs nearly half of the
country's working population. While the share of agriculture in the
gross domestic product has declined steadily over the past three
decades, its importance to rural livelihoods, food security and the
political economy remains undiminished. Any sudden shock to this sector,
whether from monsoon failure, an unexpected fall in international
commodity prices or an abrupt change in support price policy, has the
capacity to ripple through the entire system and to undermine the
broader recovery that the government has been at pains to engineer.`,
  },
  {
    id: "b3-l02",
    book: "Book 3",
    lesson: "80 WPM dictation",
    title: "Speech extract — education and youth",
    target_wpm: 80,
    pass_acc: 95,
    notes: "Use phrasing on 'I am sure that', 'we must therefore'.",
    text:
`I am sure that every one of you will agree with me when I say that the
real wealth of our nation lies not in its mines or its forests but in
the youth that fills our schools and colleges today. We must therefore
spare no effort to ensure that every child, irrespective of where she
is born or what her parents do for a living, has access to a school
that teaches well and to a teacher who believes in her future. The cost
of providing such an education will be high, but the cost of failing to
do so will be many times higher.`,
  },
  {
    id: "b3-l03",
    book: "Book 3",
    lesson: "90 WPM dictation",
    title: "Insurance circular — health policy renewal",
    target_wpm: 90,
    pass_acc: 95,
    notes: "Watch out for technical insurance terminology.",
    text:
`Policyholders are hereby informed that the renewal of all health
insurance contracts maturing during the current quarter will be
processed on the basis of the revised premium schedule notified to the
Insurance Regulatory and Development Authority on the tenth of last
month. The revision takes into account the rising cost of medical
treatment, the higher claim ratios observed during the past financial
year and the additional benefits introduced under the master policy.
Insured persons who do not wish to continue under the revised terms may
exercise their option of porting the policy to another insurer or
opting out altogether by giving the company at least thirty days notice
in writing prior to the renewal date.`,
  },
  {
    id: "b3-l04",
    book: "Book 3",
    lesson: "90 WPM dictation",
    title: "Annual report extract — director's review",
    target_wpm: 90,
    pass_acc: 95,
    notes: "Corporate language; lots of 'the company', 'the board', 'the year under review'.",
    text:
`The directors have pleasure in presenting their fortieth annual report
together with the audited financial statements for the year under
review. The company has registered a turnover of one thousand four
hundred and eighty crore rupees during the year, an increase of nine
per cent over the corresponding period of the previous year. The board
is of the view that the steady performance, against the background of a
slowing global economy and an unusually long monsoon, reflects the
resilience of the company's product portfolio and the dedication of its
employees at every level of the organisation.`,
  },
  // ─────────── BOOK 4 — Court & government dictation ───────────
  {
    id: "b4-l01",
    book: "Book 4",
    lesson: "100 WPM dictation",
    title: "Government letter — Ministry of Home Affairs",
    target_wpm: 100,
    pass_acc: 95,
    notes: "SSC Steno Grade C standard. Government phraseology.",
    text:
`No. 14014 / 23 / 2026 - Estt.(B)
Government of India
Ministry of Home Affairs

I am directed to refer to the State Government's letter of the
fourteenth of last month on the subject cited above and to convey the
sanction of the Central Government to the deputation of two officers of
the rank of Superintendent of Police for a period of three years to
the office of the Director General of Civil Defence. The terms and
conditions of the deputation will be governed by the standard terms
notified by the Department of Personnel and Training from time to time.
Travelling allowance for the journey on transfer will be regulated as
in the case of an officer proceeding on tour. The expenditure involved
will be debitable to the head of account indicated in the enclosed
statement.`,
  },
  {
    id: "b4-l02",
    book: "Book 4",
    lesson: "100 WPM dictation",
    title: "Court judgment — civil appeal",
    target_wpm: 100,
    pass_acc: 95,
    notes: "Legal English. Long subordinate clauses.",
    text:
`Having heard the learned counsel appearing for the parties at some
length and having gone through the record carefully, we are of the
considered opinion that the findings recorded by the trial court and
affirmed by the first appellate court do not suffer from any such
infirmity as would warrant interference by this court in exercise of
its jurisdiction under section one hundred of the Code of Civil
Procedure. The concurrent findings of fact arrived at on a proper
appreciation of the oral and documentary evidence available on record
are not liable to be reopened in second appeal merely because another
view of the matter is also possible.`,
  },
  {
    id: "b4-l03",
    book: "Book 4",
    lesson: "100 WPM dictation",
    title: "Parliamentary debate — budget reply",
    target_wpm: 100,
    pass_acc: 95,
    notes: "Practise interjections and rapid changes of speaker.",
    text:
`Mr. Speaker, Sir, I rise to support the demand for grants moved by the
honourable minister for finance. The budget that has been placed before
this House represents, in my humble view, a serious and sustained
effort to address the twin challenges of containing the fiscal deficit
on one hand and stimulating the rural economy on the other. The
honourable members on the opposite benches have suggested that the
provisions for the social sector are inadequate. With great respect to
my honourable friends, I would like to invite their attention to the
fact that the outlay for elementary education and primary health has
been increased by twenty-three per cent over the figures of last year.`,
  },
  {
    id: "b4-l04",
    book: "Book 4",
    lesson: "120 WPM dictation",
    title: "Press conference — RBI Governor",
    target_wpm: 120,
    pass_acc: 95,
    notes: "Reporters' speed. Numbers and percentages.",
    text:
`Ladies and gentlemen, the Monetary Policy Committee at its meeting
concluded earlier today has decided unanimously to keep the policy repo
rate under the liquidity adjustment facility unchanged at six point
five per cent. The reverse repo rate accordingly stands at three point
three five per cent and the marginal standing facility rate at six
point seven five per cent. In arriving at this decision the Committee
has taken into account the latest projections for headline inflation,
which is now expected to ease to four point one per cent in the second
half of the financial year, the encouraging progress of the south west
monsoon and the still elevated levels of crude oil and edible oil
prices in the international market.`,
  },
  // ─────────── BOOK 5 — Advanced & mixed matter ───────────
  {
    id: "b5-l01",
    book: "Book 5",
    lesson: "120 WPM dictation",
    title: "Court order — bail application",
    target_wpm: 120,
    pass_acc: 95,
    notes: "Steno Grade A / Court reporter standard.",
    text:
`Heard learned counsel for the applicant and the learned Additional
Public Prosecutor for the State. The applicant is the sole accused in
the case arising out of First Information Report number two hundred
and fourteen of the current year, registered at Police Station Kotwali
under sections four hundred and twenty, four hundred and sixty seven
and four hundred and sixty eight of the Indian Penal Code. He has been
in judicial custody since the eighteenth of February last and the
investigation, according to the prosecution itself, is now complete and
the charge sheet has been filed in the court of the learned Chief
Judicial Magistrate. Having regard to the nature of the allegations,
the period of custody already undergone and the fact that all the
material witnesses are official, the applicant is admitted to bail on
his furnishing a personal bond in the sum of fifty thousand rupees with
two sureties of the like amount to the satisfaction of the trial
court.`,
  },
  {
    id: "b5-l02",
    book: "Book 5",
    lesson: "120 WPM dictation",
    title: "Editorial — judicial reform",
    target_wpm: 120,
    pass_acc: 95,
    notes: "Newspaper editorial; abstract vocabulary.",
    text:
`The pendency of cases in the subordinate judiciary has now reached a
stage where any further procrastination in pushing through the long
overdue reforms can only be described as a dereliction of public duty.
It is no longer enough to lament the fact that there are more than
forty million cases waiting to be heard. What is needed is a
comprehensive plan that addresses, in equal measure, the question of
adequate strength of the bench, the quality of the supporting
infrastructure, the efficient deployment of information technology and,
above all, a change in the institutional culture that has, for far too
long, treated adjournments as the rule and decisions on merits as the
exception.`,
  },
  {
    id: "b5-l03",
    book: "Book 5",
    lesson: "140 WPM dictation",
    title: "Conference speech — international finance",
    target_wpm: 140,
    pass_acc: 95,
    notes: "Top-tier reporters' speed. Use heavy phrasing.",
    text:
`Distinguished colleagues, the global financial architecture in which we
operate today is fundamentally different from the one that emerged
from the Bretton Woods agreement nearly eight decades ago. The
multilateral institutions that were created at that time have, on the
whole, served us well, but the world that they were designed to serve
has changed beyond recognition. Capital flows across borders today at a
speed and in volumes that would have been unimaginable to the framers
of the original system. The lines that once separated commercial banks
from investment banks, banks from non bank financial intermediaries,
and the regulated sector from the unregulated sector have, for all
practical purposes, ceased to exist. Any meaningful effort at reform
must therefore begin with an honest acknowledgment of these realities,
and must be informed by an understanding that the cost of inaction is
not the maintenance of the present order but the gradual erosion of
the legitimacy and the relevance of every institution that participates
in it.`,
  },
  {
    id: "b5-l04",
    book: "Book 5",
    lesson: "Mixed matter — transcription drill",
    title: "Mixed dictation — letter, circular, judgment",
    target_wpm: 100,
    pass_acc: 95,
    notes: "Switches register mid-passage; tests adaptability.",
    text:
`Dear Sir, with reference to your enquiry of the third instant we have
pleasure in enclosing herewith our latest catalogue together with our
revised price list, both of which we trust will meet with your
approval. Yours faithfully. The General Manager is pleased to announce
that the office will remain closed on Friday on account of the festival
of Diwali, and that all employees other than those on essential duty
will be granted a holiday on that day. Held that the contract was void
ab initio, having been entered into between parties one of whom was, at
the date of execution, a minor in the eye of the law, and that no
question of subsequent ratification could therefore arise.`,
  },
  {
    id: "b5-l05",
    book: "Book 5",
    lesson: "Speed test — final certification",
    title: "Final test — 100 WPM, 5 minutes",
    target_wpm: 100,
    pass_acc: 95,
    notes: "Equivalent to SSC Steno Grade C final test paper.",
    text:
`The Indian Constitution is a remarkable document not only because of
the breadth of its vision but also because of the manner in which it
has continued to adapt itself to the changing needs of a vast and
diverse society. Adopted in the immediate aftermath of partition, it
sought to bind together a population that was deeply divided on
considerations of language, religion, caste and region. The framers
were acutely aware that no constitution, however well drafted, could
by itself solve these problems. What they did, however, was to provide
the institutional framework within which solutions could be sought
through the orderly processes of representative government, an
independent judiciary and a free press. It is to the lasting credit of
the people of this country and to the political leadership across
generations that this framework, with all its imperfections, has stood
the test of time. The challenges that lie ahead, particularly in the
areas of inclusive growth, environmental sustainability and the use of
new technologies in governance, are formidable, but there is no reason
to believe that the Republic which has weathered so many storms will
not weather these as well.`,
  },
];

const BOOKS = ["All", ...Array.from(new Set(TESTS.map(t => t.book)))];

export default function PitmanBookTest() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(TESTS[0].id);
  const [book, setBook] = useState("All");
  const [search, setSearch] = useState("");
  const [typed, setTyped] = useState("");
  const [startAt, setStartAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => () => clearInterval(tickRef.current), []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TESTS.filter(t =>
      (book === "All" || t.book === book) &&
      (!q || t.title.toLowerCase().includes(q) || t.lesson.toLowerCase().includes(q))
    );
  }, [book, search]);

  const active = useMemo(
    () => TESTS.find(t => t.id === activeId) || TESTS[0],
    [activeId]
  );
  const prompt = active.text;

  function reset() {
    setTyped(""); setResult(null); setStartAt(null); setElapsed(0); setError("");
    clearInterval(tickRef.current);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function pickTest(id) {
    setActiveId(id);
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
        prompt_text: prompt,
        typed_text: typed,
        duration_sec,
        language: "en",
      });
      setResult(r.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Evaluation failed");
    } finally {
      setBusy(false);
    }
  }

  // Character-level rendering
  const chars = prompt.split("").map((c, i) => {
    let cls = "ch-pending";
    if (i < typed.length) cls = typed[i] === c ? "ch-correct" : "ch-wrong";
    else if (i === typed.length) cls = "ch-current";
    return <span key={i} className={cls}>{c}</span>;
  });

  const liveWPM = elapsed > 2
    ? Math.round((typed.length / 5) / (elapsed / 60))
    : 0;
  const alignedCorrect = typed.split("").reduce(
    (acc, c, i) => acc + (prompt[i] === c ? 1 : 0), 0
  );
  const liveAcc = typed.length
    ? Math.round((alignedCorrect / typed.length) * 1000) / 10
    : 0;

  const passed = result
    ? result.wpm >= active.target_wpm && result.accuracy >= active.pass_acc
    : false;

  // Time budget — at the test's target WPM, how long should the passage take?
  const wordCount = prompt.trim().split(/\s+/).length;
  const idealMinutes = wordCount / active.target_wpm;

  return (
    <div className="container">
      <div className="row" style={{justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8}}>
        <div>
          <h1 style={{margin:0}}>Pitman Book Test</h1>
          <p className="muted small" style={{margin:"4px 0 0"}}>
            {TESTS.length} graded passages from Pitman Books 1–5 ·
            {" "}from 30 WPM foundations to 140 WPM reporter speed.
          </p>
        </div>
        <Link className="btn ghost" to="/app">← Dashboard</Link>
      </div>

      <div className="row" style={{gap:16, marginTop:16, alignItems:"flex-start", flexWrap:"wrap"}}>
        {/* Test list */}
        <div className="card" style={{flex:"0 0 320px", maxHeight:"75vh", overflow:"auto"}}>
          <div className="row" style={{gap:8, marginBottom:10, flexWrap:"wrap"}}>
            <select
              className="input"
              style={{flex:1, minWidth:120}}
              value={book}
              onChange={e => setBook(e.target.value)}
            >
              {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <input
            className="input"
            placeholder="Search lessons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{marginBottom:10}}
          />
          <ul className="clean" style={{display:"flex", flexDirection:"column", gap:6}}>
            {visible.map(t => (
              <li key={t.id}>
                <button
                  className={"btn " + (t.id === activeId ? "" : "ghost")}
                  style={{width:"100%", textAlign:"left", justifyContent:"flex-start"}}
                  onClick={() => pickTest(t.id)}
                >
                  <div>
                    <div style={{fontWeight:600}}>{t.title}</div>
                    <div className="muted small">
                      {t.book} · {t.lesson} · {t.target_wpm} WPM
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {visible.length === 0 && (
              <li className="muted small" style={{padding:8}}>No tests match.</li>
            )}
          </ul>
        </div>

        {/* Test area */}
        <div style={{flex:1, minWidth:300}}>
          <div className="card">
            <div className="row" style={{justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8, marginBottom:10}}>
              <div>
                <strong style={{fontSize:"1.05rem"}}>
                  {active.book} · {active.lesson}
                </strong>
                <div style={{fontWeight:600}}>{active.title}</div>
                <div className="muted small" style={{marginTop:2}}>
                  Target {active.target_wpm} WPM · pass at {active.pass_acc}% accuracy ·
                  {" "}~{idealMinutes.toFixed(1)} min at speed · {wordCount} words
                </div>
              </div>
              <button className="btn ghost" onClick={reset}>Reset</button>
            </div>

            {active.notes && (
              <div className="muted small" style={{marginBottom:10, fontStyle:"italic"}}>
                Tip: {active.notes}
              </div>
            )}

            <div
              className="prompt-box"
              style={{whiteSpace:"pre-wrap", lineHeight:1.65}}
            >
              {chars}
            </div>

            <textarea
              ref={inputRef}
              className="input"
              style={{
                marginTop:12,
                minHeight:200,
                fontFamily:"inherit",
                whiteSpace:"pre-wrap",
              }}
              value={typed}
              onChange={onType}
              placeholder="Type your transcription. The timer starts on your first keystroke."
              disabled={!!result}
              spellCheck={false}
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
            <div
              className="card"
              style={{
                marginTop:16,
                borderColor: passed ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.4)",
              }}
            >
              <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
                <h3 style={{margin:0}}>
                  {passed ? "✓ Cleared" : "✗ Below pass mark"} — {active.book} {active.lesson}
                </h3>
                <span className="muted small">
                  Need {active.target_wpm} WPM and ≥ {active.pass_acc}% accuracy
                </span>
              </div>
              <div className="stat-grid" style={{marginTop:10}}>
                <div className="stat"><div className="k">Net WPM</div><div className="v">{result.wpm}</div></div>
                <div className="stat"><div className="k">Gross WPM</div><div className="v">{result.gross_wpm}</div></div>
                <div className="stat"><div className="k">Accuracy</div><div className="v">{result.accuracy}%</div></div>
                <div className="stat"><div className="k">Errors</div><div className="v">{result.errors?.length || 0}</div></div>
              </div>
              {result.errors?.length > 0 && (
                <>
                  <h4>First 10 errors</h4>
                  <ul className="clean">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>
                        <code style={{color:"var(--danger)"}}>{e.prompt_slice || "∅"}</code>
                        {" → "}
                        <code style={{color:"var(--success)"}}>{e.typed_slice || "∅"}</code>
                        <span className="muted small"> ({e.type})</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <div className="row" style={{justifyContent:"flex-end", gap:8, marginTop:12}}>
                <button className="btn ghost" onClick={reset}>Retry this test</button>
                <button
                  className="btn"
                  onClick={() => {
                    const idx = TESTS.findIndex(t => t.id === active.id);
                    const next = TESTS[(idx + 1) % TESTS.length];
                    pickTest(next.id);
                  }}
                >
                  Next test →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
