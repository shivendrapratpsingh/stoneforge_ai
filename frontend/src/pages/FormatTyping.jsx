import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

/**
 * Format Typing
 * -------------
 * 20+ standard document formats used in Indian SSC / Court / Office /
 * Stenographer exams.  The user picks a format, types it verbatim, and
 * gets graded on WPM + accuracy via /typing/evaluate (same backend the
 * regular Typing Trainer uses).
 *
 * Each format is a real, layout-correct template with proper salutations,
 * subject lines, paragraph breaks and signature blocks — so practising
 * here also drills the *visual* discipline the exam checks for.
 */

const FORMATS = [
  {
    id: "formal-letter",
    title: "Formal Letter (Sender → Receiver)",
    category: "Letters",
    target_wpm: 35,
    text:
`123, Park Street
New Delhi - 110001
22 April 2026

The Manager
State Bank of India
Connaught Place Branch
New Delhi - 110001

Subject: Request to update registered mobile number

Sir,

I am an account holder at your branch (A/c No. 0123456789). I wish
to update the mobile number registered with my account from
+91-9876543210 to +91-9123456780, as the older number is no longer
in use.

I have enclosed a self-attested copy of my Aadhaar and a written
request as required. Kindly do the needful at the earliest.

Thanking you,

Yours faithfully,
Shivendra Pratap Singh
A/c No. 0123456789`,
  },
  {
    id: "leave-application",
    title: "Leave Application to Principal",
    category: "Applications",
    target_wpm: 35,
    text:
`The Principal
Delhi Public School
R. K. Puram, New Delhi

Subject: Application for sick leave

Respected Sir,

With due respect, I beg to state that I am a student of class XII-B,
Roll No. 24. Last evening I developed high fever and the doctor has
advised me three days of complete rest. As such, I will not be able
to attend school from 23 April 2026 to 25 April 2026.

I shall be highly obliged if you kindly grant me leave for the said
period. A medical certificate is enclosed for your reference.

Thanking you,

Yours obediently,
Aarav Sharma
Class XII-B, Roll No. 24
Date: 22 April 2026`,
  },
  {
    id: "job-application",
    title: "Job Application (Cover Letter)",
    category: "Applications",
    target_wpm: 38,
    text:
`Aarav Sharma
A-44, Sector 12
Noida - 201301
aarav.sharma@example.com
+91-9876543210

22 April 2026

The HR Manager
Infosys Limited
Electronic City, Bengaluru

Subject: Application for the post of Junior Software Engineer

Sir,

With reference to your advertisement on LinkedIn dated 18 April 2026,
I wish to apply for the post of Junior Software Engineer at your
esteemed organisation.

I have completed my B.Tech (Computer Science) from IIIT Allahabad
in 2025 with 8.6 CGPA. During my final year I built a typing-speed
trainer using React and FastAPI, which gave me hands-on exposure to
the full development lifecycle.

I am confident that my technical skills and willingness to learn
will allow me to contribute meaningfully to your team. My detailed
resume is enclosed for your kind consideration.

Thanking you,

Yours faithfully,
Aarav Sharma`,
  },
  {
    id: "resignation-letter",
    title: "Resignation Letter",
    category: "Letters",
    target_wpm: 38,
    text:
`Aarav Sharma
Software Engineer, Team Atlas
Employee ID: INF-22841

22 April 2026

The Reporting Manager
Infosys Limited
Electronic City, Bengaluru

Subject: Resignation from the post of Software Engineer

Sir,

Please accept this letter as formal notice of my resignation from
the post of Software Engineer at Infosys Limited, effective today.
In line with the terms of my employment contract, I will serve the
mandatory two-month notice period and my last working day will be
21 June 2026.

I am grateful for the learning opportunities, mentorship and the
collaborative culture I have enjoyed over the past three years. I
will ensure a smooth handover of all my ongoing assignments before
my exit.

I would like to thank you and the management for the support
extended to me throughout my tenure.

Yours sincerely,
Aarav Sharma`,
  },
  {
    id: "business-email",
    title: "Business Email (Quotation Request)",
    category: "Emails",
    target_wpm: 40,
    text:
`From: procurement@bharatlogistics.in
To: sales@orientpaper.in
Subject: Request for quotation - 500 reams A4 80 GSM
Date: 22 April 2026, 11:30 IST

Dear Sales Team,

We are interested in procuring 500 reams of A4 size 80 GSM copier
paper for our Mumbai office. Kindly share your best quotation
covering the following:

1. Per-ream price exclusive of GST
2. Bulk discount slabs, if any
3. Delivery timeline to Andheri East, Mumbai
4. Payment terms (we follow 30-day credit)

Please also confirm whether the paper carries an FSC certification.
We would appreciate receiving your offer by 25 April 2026 so that we
may finalise the purchase order this week.

Looking forward to your response.

Regards,
Neha Verma
Procurement Officer
Bharat Logistics Pvt. Ltd.
+91-22-4567 8900`,
  },
  {
    id: "office-memo",
    title: "Inter-office Memorandum",
    category: "Office",
    target_wpm: 40,
    text:
`MEMORANDUM

To:        All Department Heads
From:      Office of the General Manager
Date:      22 April 2026
Ref. No.:  GM/MEMO/2026-27/014
Subject:   Mandatory cybersecurity training for all staff

This is to inform all department heads that, in line with the
revised IT policy circulated on 10 April 2026, every employee is
required to complete the cybersecurity awareness module on the
Learning Portal by 15 May 2026.

Department heads will:

1. Share the attached schedule with their teams
2. Ensure 100 per cent participation
3. Forward the completion report to the IT Security cell

Non-completion shall be treated as a compliance breach under
clause 7.3 of the Code of Conduct.

(Rakesh Menon)
General Manager`,
  },
  {
    id: "notice-meeting",
    title: "Notice of Meeting",
    category: "Office",
    target_wpm: 40,
    text:
`NOTICE

Bharat Sahitya Parishad
Registered Office: 14, Janpath, New Delhi - 110001

Date: 22 April 2026

Notice is hereby given that the 18th Annual General Meeting of the
members of Bharat Sahitya Parishad will be held on Friday,
15 May 2026, at 11:00 AM at the registered office of the society
to transact the following business:

1. To confirm the minutes of the previous AGM
2. To consider and adopt the Audited Financial Statements for the
   year ended 31 March 2026
3. To appoint statutory auditors for the financial year 2026-27
4. Any other matter with the permission of the Chair

Members are requested to attend the meeting in person or through a
duly executed proxy form.

By order of the Executive Committee

(Aarti Kapoor)
Honorary Secretary`,
  },
  {
    id: "press-release",
    title: "Press Release",
    category: "Communications",
    target_wpm: 42,
    text:
`FOR IMMEDIATE RELEASE
22 April 2026, New Delhi

LexForge Technologies Launches AI-powered Court-ready Drafting Suite

LexForge Technologies today announced the public launch of LexForge
AI, an artificial-intelligence platform that produces court-ready
Indian legal drafts in under 30 seconds. The system has been built
with strict input fidelity controls so that generated documents
contain no fabricated names, dates or case citations.

"Indian litigants and junior advocates spend hours on routine
drafting that can be safely automated," said Shivendra Pratap
Singh, founder of LexForge Technologies. "Our platform gives them
back that time while keeping every fact under their control."

LexForge AI supports nineteen document types — including Legal
Notices, Writ Petitions, Bail Applications, RTI Applications and
Cheque-bounce Notices — and is available in a free tier as well as
a Pro plan that uses Llama 3.3 70B for stronger reasoning.

For media queries please write to media@lexforge.ai.

-- ENDS --`,
  },
  {
    id: "rti-application",
    title: "RTI Application (Form A)",
    category: "Government",
    target_wpm: 38,
    text:
`To,
The Public Information Officer
Municipal Corporation of Delhi
Town Hall, Chandni Chowk, Delhi - 110006

Subject: Application under Section 6(1) of the RTI Act, 2005

Sir,

I, Shivendra Pratap Singh, S/o Late Shri Rajendra Pratap Singh,
resident of 123 Park Street, New Delhi - 110001, request the
following information under the Right to Information Act, 2005:

1. Total expenditure incurred on the resurfacing of Park Street
   between January 2025 and March 2026, contractor-wise
2. Copies of the work-order, measurement book entries and
   completion certificate
3. Date of next scheduled audit of the said work

I am enclosing the prescribed application fee of Rs. 10/- by way
of Indian Postal Order No. 12F-345678 dated 21 April 2026.

Yours faithfully,
Shivendra Pratap Singh
Mobile: +91-9876543210
Date: 22 April 2026`,
  },
  {
    id: "fir-draft",
    title: "Draft First Information Report (FIR)",
    category: "Legal",
    target_wpm: 38,
    text:
`To,
The Station House Officer
Police Station Connaught Place
New Delhi - 110001

Subject: First Information Report regarding theft of mobile phone

Sir,

I, Aarav Sharma, S/o Shri Manoj Sharma, aged 28 years, resident of
B-204, Vasant Vihar, New Delhi - 110057, hereby report the
following facts for registration of an FIR:

1. On 21 April 2026 at about 19:45 hours, while I was travelling
   in DTC bus route 522 from Khan Market to Connaught Place, an
   unknown person standing next to me snatched my mobile phone
   (Samsung Galaxy S24, IMEI 351234567812345) from my shirt pocket
   and got off the bus near Janpath.

2. I tried to chase the accused but he escaped in the crowd. The
   approximate value of the stolen phone is Rs. 84,000.

I request you to kindly register an FIR and initiate
investigation. I shall extend full cooperation to the
investigating officer.

Yours faithfully,
Aarav Sharma
Mobile: +91-9876543210`,
  },
  {
    id: "police-complaint",
    title: "Police Complaint (Non-cognizable)",
    category: "Legal",
    target_wpm: 38,
    text:
`To,
The Officer-in-Charge
Police Station Hauz Khas
New Delhi - 110016

Subject: Complaint regarding loud-music nuisance after 23:00 hours

Sir,

I, Neha Verma, resident of C-12, Hauz Khas Enclave, beg to bring to
your kind notice that a banquet hall located adjacent to my house
("Royal Pearl Banquets") has been hosting events with loud DJ
music well past 23:00 hours, in clear violation of the Noise
Pollution (Regulation and Control) Rules, 2000.

The disturbance has continued every weekend for the past two
months, depriving the residents — including senior citizens and
school-going children — of basic rest.

I request you to kindly cause an inquiry and direct the
proprietors to comply with the permissible noise limits and
prescribed cut-off timings.

Yours faithfully,
Neha Verma
Mobile: +91-9123456780
Date: 22 April 2026`,
  },
  {
    id: "affidavit",
    title: "Affidavit (Name Correction)",
    category: "Legal",
    target_wpm: 36,
    text:
`AFFIDAVIT

I, Shivendra Pratap Singh, S/o Late Shri Rajendra Pratap Singh,
aged 32 years, resident of 123 Park Street, New Delhi - 110001,
do hereby solemnly affirm and declare as under:

1. That I am a citizen of India.

2. That my name has been recorded as "Shivender P. Singh" in my
   PAN Card (ABCDE1234F) and as "Shivendra Pratap Singh" in my
   Aadhaar (XXXX-XXXX-1234), passport and educational
   certificates.

3. That both the names refer to one and the same person, namely
   me, the deponent.

4. That I undertake to use only "Shivendra Pratap Singh" as my
   name for all future purposes.

5. That this affidavit is being executed for submission to the
   Income Tax Department for the purpose of name correction in my
   PAN records.

DEPONENT

Verification:
Verified at New Delhi on this 22nd day of April 2026, that the
contents of the above affidavit are true and correct to the best
of my knowledge and belief and nothing material has been concealed
therefrom.

DEPONENT`,
  },
  {
    id: "power-of-attorney",
    title: "Power of Attorney (General)",
    category: "Legal",
    target_wpm: 36,
    text:
`GENERAL POWER OF ATTORNEY

KNOW ALL MEN BY THESE PRESENTS that I, Aarav Sharma, S/o Shri
Manoj Sharma, aged 28 years, resident of B-204, Vasant Vihar,
New Delhi - 110057, do hereby appoint, nominate and constitute
Shri Manoj Sharma, S/o Late Shri R. K. Sharma, aged 58 years,
resident of B-204, Vasant Vihar, New Delhi - 110057, as my true
and lawful attorney to do and execute all or any of the following
acts on my behalf:

1. To represent me before any government, semi-government, civic
   or judicial authority in respect of my immovable property
   bearing No. C-15, Sector 21, Noida.

2. To sign, verify and submit any application, affidavit,
   undertaking or representation that may be necessary in
   connection with the said property.

3. To receive any sum due to me in respect of the said property
   and to grant valid receipts for the same.

I hereby ratify and confirm whatever my said attorney shall
lawfully do or cause to be done by virtue of these presents.

IN WITNESS WHEREOF I have set my hand on this 22nd day of April
2026 at New Delhi.

Executant: Aarav Sharma

Witnesses:
1.
2.`,
  },
  {
    id: "rent-receipt",
    title: "Rent Receipt",
    category: "Office",
    target_wpm: 38,
    text:
`RENT RECEIPT

Receipt No.: 2026-27/04
Date: 01 April 2026

Received with thanks a sum of Rs. 25,000/- (Rupees Twenty Five
Thousand Only) from Mr. Aarav Sharma, S/o Shri Manoj Sharma,
towards the monthly rent of the residential premises situated at
Flat No. 304, Sapphire Apartments, Sector 21, Noida - 201301, for
the month of April 2026.

Mode of payment: NEFT
Transaction reference: SBIN23092026A1
Period covered: 01 April 2026 to 30 April 2026

Landlord
Name: Mrs. Aarti Kapoor
PAN: AAKPK1234L
Address: A-12, Sector 18, Noida - 201301
Signature: ________________`,
  },
  {
    id: "cheque-bounce-notice",
    title: "Cheque-bounce Demand Notice (S. 138)",
    category: "Legal",
    target_wpm: 36,
    text:
`REGISTERED A.D. / SPEED POST

Date: 22 April 2026

To,
Mr. Vikram Singh
S/o Shri Karan Singh
H. No. 47, Lajpat Nagar - II
New Delhi - 110024

Subject: Statutory demand notice under Section 138 of the
Negotiable Instruments Act, 1881

Sir,

Under instructions from and on behalf of my client Mr. Aarav
Sharma, S/o Shri Manoj Sharma, R/o B-204, Vasant Vihar, New Delhi
- 110057 (hereinafter "the Complainant"), I hereby serve upon you
the following notice:

1. That you, towards discharge of your existing legal liability,
   issued in favour of the Complainant Cheque No. 045721 dated
   01 April 2026 for Rs. 5,00,000/- drawn on HDFC Bank, Lajpat
   Nagar Branch.

2. That the said cheque, on presentation through the
   Complainant's banker, has been returned unpaid on
   12 April 2026 with the remark "Funds Insufficient".

3. You are hereby called upon to pay the said sum of
   Rs. 5,00,000/- to the Complainant within fifteen days from the
   receipt of this notice, failing which appropriate criminal and
   civil proceedings shall be initiated against you at your sole
   risk and cost.

Yours faithfully,
(Advocate Megha Iyer)
Counsel for Mr. Aarav Sharma`,
  },
  {
    id: "consumer-complaint",
    title: "Consumer Complaint (Defective Product)",
    category: "Legal",
    target_wpm: 38,
    text:
`Before the District Consumer Disputes Redressal Commission,
Gautam Budh Nagar (U.P.)

Complaint No. _____ of 2026

Aarav Sharma                                ...Complainant
S/o Shri Manoj Sharma
B-204, Vasant Vihar, New Delhi - 110057

Versus

Apex Electronics Pvt. Ltd.                  ...Opposite Party
Through its Managing Director
Plot 12, Sector 63, Noida - 201301

COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019

Most Respectfully Showeth:

1. That the Complainant purchased a 55-inch LED television
   (Model AX-55U, Serial No. AX55U240003421) from the Opposite
   Party on 05 January 2026 for a sum of Rs. 64,990/- against
   Invoice No. AE/12345.

2. That within four months of purchase the said television
   started showing severe screen flicker and audio distortion.

3. That despite repeated written complaints dated 02, 09 and 18
   April 2026, the Opposite Party has refused to either repair or
   replace the unit, thereby committing a clear deficiency of
   service and unfair trade practice.

PRAYER:

It is therefore most respectfully prayed that this Hon'ble
Commission may be pleased to:

(a) Direct the Opposite Party to refund Rs. 64,990/- with
    interest at 12 per cent per annum;
(b) Award Rs. 25,000/- towards mental agony and litigation cost.

Place: Noida
Date: 22 April 2026                         Complainant`,
  },
  {
    id: "tender-notice",
    title: "Tender Notice (NIT)",
    category: "Government",
    target_wpm: 38,
    text:
`Government of India
Ministry of Road Transport and Highways
National Highways Authority of India
Notice Inviting e-Tender

NIT No.: NHAI/PIU-DEL/2026-27/008                Date: 22 April 2026

Online bids are invited under the Two-Bid System from eligible
bidders for the following work:

Name of work : Periodic renewal coat on NH-44 between km 28.000
               and km 56.000 (Delhi-Sonipat section)
EMD          : Rs. 12,50,000/- (refundable)
Tender fee   : Rs. 2,000/- (non-refundable)
Bid security : Bank guarantee from a scheduled commercial bank
Period       : 12 months from the date of work-order

Sale of bid documents : 23 April 2026 (10:00) to
                        12 May 2026 (17:00)
Last date for         : 14 May 2026, 15:00 hours
submission of bids
Date of opening       : 14 May 2026, 16:00 hours
of technical bids

Bid documents shall be downloaded only from the Central Public
Procurement Portal (https://etenders.gov.in). The Authority
reserves the right to accept or reject any or all bids without
assigning any reason.

Project Director
PIU-Delhi, NHAI`,
  },
  {
    id: "press-condolence",
    title: "Condolence Message / Obituary",
    category: "Communications",
    target_wpm: 40,
    text:
`In Loving Memory

It is with profound sorrow that we announce the passing of
Shri Rajendra Pratap Singh, beloved father of Shivendra Pratap
Singh, on 21 April 2026 at his residence in New Delhi after a
brief illness, at the age of 71 years.

Shri Singh, a retired Deputy Director of the Ministry of External
Affairs, was a deeply principled officer who served the nation
with quiet distinction for over thirty years. He is survived by
his wife, Smt. Sunita Singh, his son and his grandchildren.

The Antim Sanskar will be performed on Wednesday, 23 April 2026
at 11:00 AM at the Lodhi Road Crematorium. The Uthala will be
held on Friday, 25 April 2026 at the family residence,
123 Park Street, New Delhi - 110001, between 16:00 and 18:00
hours.

The family acknowledges with gratitude the messages of condolence
received from friends and well-wishers. In lieu of flowers,
contributions may be made in his memory to the HelpAge India
Foundation.

May his noble soul rest in eternal peace.`,
  },
  {
    id: "minutes-of-meeting",
    title: "Minutes of Meeting",
    category: "Office",
    target_wpm: 42,
    text:
`MINUTES OF THE 142ND BOARD MEETING

Bharat Logistics Pvt. Ltd.
Date: 22 April 2026
Time: 11:00 - 13:15
Venue: Board Room, Corporate Office, BKC, Mumbai

Present:
- Mr. Rakesh Menon, Chairman
- Ms. Aarti Kapoor, Managing Director
- Mr. Vikram Singh, Director (Finance)
- Mr. Pranav Iyer, Director (Operations)
- Ms. Neha Verma, Company Secretary - in attendance

Item 1 - Confirmation of previous minutes
The minutes of the 141st meeting circulated on 18 April 2026
were taken as read and unanimously confirmed.

Item 2 - Quarterly financial review
The CFO presented unaudited Q4 results showing a revenue growth
of 11.4 per cent year-on-year and an EBITDA margin of 18.2
per cent. After deliberation the Board took the report on record.

Item 3 - Capital expenditure approval
The Board approved capital expenditure of Rs. 18 crore for the
warehouse automation project at Bhiwandi, subject to obtaining
fire-safety clearance.

Item 4 - Any other business
The Board congratulated the Operations team on receiving ISO
9001:2015 recertification.

The meeting concluded with a vote of thanks to the Chair.

(Neha Verma)
Company Secretary`,
  },
  {
    id: "internship-application",
    title: "Internship Application",
    category: "Applications",
    target_wpm: 40,
    text:
`Aarav Sharma
Final-year B.Tech (CSE)
IIIT Allahabad
aarav.sharma@iiita.ac.in
+91-9876543210

22 April 2026

The Talent Acquisition Team
Razorpay Software Pvt. Ltd.
Bengaluru

Subject: Application for Summer Internship 2026 - Backend
         Engineering

Sir / Madam,

I am writing to apply for the Summer Internship 2026 in your
Backend Engineering team. I am currently in the final year of my
B.Tech in Computer Science at IIIT Allahabad, with a CGPA of 8.6
out of 10.

During the past year I have built two production-style projects: a
typing-speed trainer using FastAPI + React, and a payment-reminder
microservice in Go that handled 4,000 requests per minute on a
single t3.small instance. I have also been an active contributor
to the institute's open-source club.

The opportunity to work alongside Razorpay's core payments team
will sharpen my systems-design instincts and let me ship features
that real merchants depend on. I would welcome a chance to discuss
how I can add value to your team.

Yours sincerely,
Aarav Sharma
(Resume enclosed)`,
  },
  {
    id: "circular",
    title: "Office Circular",
    category: "Office",
    target_wpm: 42,
    text:
`Bharat Logistics Pvt. Ltd.
Corporate Office, BKC, Mumbai

CIRCULAR No. HR/2026-27/07                Date: 22 April 2026

Subject: Revised work-from-home policy effective 01 May 2026

This circular is being issued in supersession of the
work-from-home guidelines dated 01 January 2024.

1. With effect from 01 May 2026 every employee shall work from
   the office for a minimum of three working days each week.

2. The two days that may be availed as work-from-home shall be
   chosen by the employee in consultation with the reporting
   manager and shall be uniform across a calendar month.

3. Critical functions notified separately by the COO (e.g.
   Treasury, Customer Support Tier-1) shall continue to operate
   on a full-time-from-office basis.

4. Heads of Departments are requested to circulate this policy
   among their teams and ensure strict compliance. Any deviation
   will require prior written approval from the HR Director.

This circular is issued with the approval of the Managing
Director.

(Asha Pillai)
Head - Human Resources`,
  },
  {
    id: "speech-formal",
    title: "Welcome Speech (Formal Function)",
    category: "Communications",
    target_wpm: 42,
    text:
`Welcome Address

Honourable Chief Guest, distinguished members of the dais,
respected teachers, dear parents and my fellow students -
namaskar and a very warm good morning to each one of you.

It is my privilege to welcome you all to the 25th Annual Day
celebrations of Delhi Public School, R. K. Puram. A silver
jubilee is more than a milestone; it is a moment to pause, look
back at the journey, and look ahead at the road that still
beckons.

Twenty-five years ago this institution opened its doors with a
single batch of forty-two students. Today, more than four thousand
alumni carry its values into universities, hospitals, courtrooms
and start-ups across the world.

To our Chief Guest, Dr. Rina Sengupta, whose work in paediatric
oncology has saved thousands of young lives, we say - thank you
for honouring us with your presence. Your journey from these very
corridors to the Padma Shri reminds every student in this hall
that hard work and humility are still the surest path to
greatness.

I now invite you to settle in, enjoy the programme our students
have prepared, and celebrate with us the silver legacy of our
beloved school.

Thank you, and Jai Hind.`,
  },
  {
    id: "complaint-society",
    title: "Complaint to Housing Society",
    category: "Letters",
    target_wpm: 40,
    text:
`To,
The Honorary Secretary
Sapphire Apartments Co-operative Society Ltd.
Sector 21, Noida - 201301

Subject: Complaint regarding non-functional lift in Tower B
         since 15 April 2026

Respected Sir,

I, Aarav Sharma, owner of Flat No. B-304, wish to bring to the
notice of the Managing Committee the following grievance:

1. The right-side passenger lift of Tower B has been out of
   service since 15 April 2026 - i.e. for the last seven days as
   on date.

2. Senior citizens and small children residing on the upper
   floors have been forced to use the staircase, causing severe
   inconvenience and a real safety risk in case of any
   medical emergency.

3. Despite three reminders submitted in the suggestion box and a
   phone call to the Estate Manager on 18 April 2026, no
   restoration timeline has been communicated to the residents.

It is therefore requested that:

(a) The lift be made operational at the earliest, preferably
    within forty-eight hours;
(b) A written communication be put up on the notice board
    explaining the cause of the breakdown and the
    expected date of restoration.

Thanking you,

Yours faithfully,
Aarav Sharma
Flat No. B-304, Tower B
Mobile: +91-9876543210`,
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(FORMATS.map(f => f.category)))];

export default function FormatTyping() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(FORMATS[0].id);
  const [category, setCategory] = useState("All");
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

  const visibleFormats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FORMATS.filter(f =>
      (category === "All" || f.category === category) &&
      (!q || f.title.toLowerCase().includes(q) || f.text.toLowerCase().includes(q))
    );
  }, [category, search]);

  const active = useMemo(
    () => FORMATS.find(f => f.id === activeId) || FORMATS[0],
    [activeId]
  );
  const prompt = active.text;

  function reset() {
    setTyped(""); setResult(null); setStartAt(null); setElapsed(0); setError("");
    clearInterval(tickRef.current);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function pickFormat(id) {
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
    ? result.wpm >= active.target_wpm && result.accuracy >= 95
    : false;

  return (
    <div className="container">
      <div className="row" style={{justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8}}>
        <div>
          <h1 style={{margin:0}}>Format Typing</h1>
          <p className="muted small" style={{margin:"4px 0 0"}}>
            {FORMATS.length} real document templates · type them verbatim,
            including the layout. Pass mark: target WPM &amp; ≥ 95% accuracy.
          </p>
        </div>
        <Link className="btn ghost" to="/app">← Dashboard</Link>
      </div>

      <div className="row" style={{gap:16, marginTop:16, alignItems:"flex-start", flexWrap:"wrap"}}>
        {/* Format list */}
        <div className="card" style={{flex:"0 0 320px", maxHeight:"75vh", overflow:"auto"}}>
          <div className="row" style={{gap:8, marginBottom:10, flexWrap:"wrap"}}>
            <select
              className="input"
              style={{flex:1, minWidth:120}}
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input
            className="input"
            placeholder="Search formats..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{marginBottom:10}}
          />
          <ul className="clean" style={{display:"flex", flexDirection:"column", gap:6}}>
            {visibleFormats.map(f => (
              <li key={f.id}>
                <button
                  className={"btn " + (f.id === activeId ? "" : "ghost")}
                  style={{width:"100%", textAlign:"left", justifyContent:"flex-start"}}
                  onClick={() => pickFormat(f.id)}
                >
                  <div>
                    <div style={{fontWeight:600}}>{f.title}</div>
                    <div className="muted small">
                      {f.category} · target {f.target_wpm} WPM
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {visibleFormats.length === 0 && (
              <li className="muted small" style={{padding:8}}>No formats match.</li>
            )}
          </ul>
        </div>

        {/* Typing area */}
        <div style={{flex:1, minWidth:300}}>
          <div className="card">
            <div className="row" style={{justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:10}}>
              <div>
                <strong>{active.title}</strong>
                <div className="muted small">
                  {active.category} · target {active.target_wpm} WPM ·
                  {" "}{active.text.length} characters
                </div>
              </div>
              <button className="btn ghost" onClick={reset}>Reset</button>
            </div>

            <div
              className="prompt-box"
              style={{whiteSpace:"pre-wrap", fontFamily:"ui-monospace, Consolas, monospace", lineHeight:1.55}}
            >
              {chars}
            </div>

            <textarea
              ref={inputRef}
              className="input"
              style={{
                marginTop:12,
                minHeight:180,
                fontFamily:"ui-monospace, Consolas, monospace",
                whiteSpace:"pre-wrap",
              }}
              value={typed}
              onChange={onType}
              placeholder="Reproduce the format above exactly — line breaks, indentation and punctuation all count."
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
            <div className="card" style={{marginTop:16, borderColor: passed ? "rgba(16,185,129,0.5)" : "rgba(239,68,68,0.4)"}}>
              <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
                <h3 style={{margin:0}}>
                  {passed ? "Passed" : "Try again"} — {active.title}
                </h3>
                <span className="muted small">target {active.target_wpm} WPM · ≥ 95% accuracy</span>
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
                <button className="btn ghost" onClick={reset}>Retry this format</button>
                <button
                  className="btn"
                  onClick={() => {
                    const idx = FORMATS.findIndex(f => f.id === active.id);
                    const next = FORMATS[(idx + 1) % FORMATS.length];
                    pickFormat(next.id);
                  }}
                >
                  Next format →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
