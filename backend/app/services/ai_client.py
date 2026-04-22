"""Pluggable LLM client.

Chooses provider from settings.ai_provider:
  - "anthropic" → Claude Sonnet
  - "openai"    → GPT-4o-mini
  - "mock"      → deterministic offline generator (used in dev / CI)

All providers return plain text. The caller is responsible for parsing JSON
if the prompt requested JSON output.
"""
from __future__ import annotations
import json
import random
from typing import Optional

from app.config import get_settings

settings = get_settings()


# ─── MOCK PROVIDER (offline-safe) ───────────────────────────────────────────
_EN_TEMPLATES = [
    "The digital revolution has transformed every sector of modern economy. From banking to education, technology now plays a central role in daily life. Students and professionals alike must adapt to rapid change and constant learning. Typing skills and clear communication remain essential in this new world.",
    "Time management is one of the most important skills for a successful career. Whether you are preparing for a government examination or working in a private office, the ability to prioritise tasks and meet deadlines is invaluable. Practice steady habits and measure your progress.",
    "Court reporters and stenographers play a vital role in the justice system. They produce accurate verbatim records of proceedings at remarkable speeds, often exceeding one hundred and twenty words per minute. Their discipline, focus and years of training deserve far more recognition.",
    "Reading widely improves both vocabulary and typing fluency. When the brain has seen a word many times, the fingers can reproduce it without hesitation. Combine daily reading with deliberate typing practice, and your speed will rise steadily over the weeks.",
]

_HI_TEMPLATES = [
    "आज के समय में डिजिटल कौशल हर विद्यार्थी के लिए आवश्यक हो गया है। सरकारी और निजी दोनों क्षेत्रों में टाइपिंग और आशुलिपि की जानकारी रखने वाले उम्मीदवारों को प्राथमिकता दी जाती है। नियमित अभ्यास से गति और शुद्धता दोनों में सुधार होता है।",
    "स्वास्थ्य ही सबसे बड़ा धन है। यदि हम अपने दैनिक जीवन में संतुलित आहार, पर्याप्त नींद और व्यायाम को शामिल करें, तो हम अनेक रोगों से बच सकते हैं। पढ़ाई के साथ-साथ शारीरिक स्वास्थ्य पर भी ध्यान देना चाहिए।",
    "भारत की न्याय प्रणाली में आशुलिपिकों का महत्वपूर्ण योगदान है। वे न्यायालय की कार्यवाही को शब्द-दर-शब्द तेज़ी से रिकॉर्ड करते हैं। यह कार्य कठिन है परंतु अत्यंत सम्मानजनक भी है।",
    "सफलता का कोई छोटा रास्ता नहीं होता। हर दिन थोड़ा-थोड़ा अभ्यास बड़े परिणाम देता है। स्वयं पर विश्वास रखें और निरंतर प्रयास करते रहें।",
]


def _mock_paragraph(language: str, difficulty: str, topic: str, word_count: int) -> str:
    pool = _HI_TEMPLATES if language == "hi" else _EN_TEMPLATES
    random.seed(hash((language, difficulty, topic, word_count)))
    base = random.choice(pool)
    if topic:
        base = (f"Topic: {topic}. " if language == "en" else f"विषय: {topic}। ") + base
    # scale up/down to requested length
    words = base.split()
    while len(words) < word_count:
        words += random.choice(pool).split()
    words = words[:word_count]
    return " ".join(words)


def _mock_coach(recent_wpm: float, recent_accuracy: float,
                common_errors: list[str], language: str) -> str:
    if language == "hi":
        summary = (
            f"आपकी हाल की औसत गति {recent_wpm:.0f} WPM और शुद्धता "
            f"{recent_accuracy:.1f}% है। "
            "अगले दो हफ़्तों में हम पहले शुद्धता को 96% से ऊपर लाने पर ध्यान देंगे, "
            "फिर गति बढ़ाएँगे।"
        )
        drills = [
            {"name": "धीमी सटीक टाइपिंग", "minutes": 10,
             "desc": "60% गति पर टाइप करें, शून्य त्रुटि का लक्ष्य।"},
            {"name": "सामान्य गलती ड्रिल", "minutes": 10,
             "desc": "अपनी बार-बार होने वाली ग़लतियों वाले शब्दों को दोहराएँ।"},
            {"name": "पूर्ण पैराग्राफ परीक्षण", "minutes": 10,
             "desc": "एक लक्ष्य गति पर पूरे अनुच्छेद का टेस्ट दें।"},
        ]
    else:
        summary = (
            f"Your recent average is {recent_wpm:.0f} WPM at "
            f"{recent_accuracy:.1f}% accuracy. "
            "For the next two weeks focus on pushing accuracy above 96% "
            "before chasing raw speed — error-free typing compounds fastest."
        )
        drills = [
            {"name": "Slow-accurate drill", "minutes": 10,
             "desc": "Type at 60% of max speed; target zero errors."},
            {"name": "Error-word drill", "minutes": 10,
             "desc": "Repeat the words you misspelled most often."},
            {"name": "Full-paragraph test", "minutes": 10,
             "desc": "One timed paragraph at your target WPM."},
        ]
    return json.dumps({"summary": summary, "drills": drills}, ensure_ascii=False)


# ─── REAL PROVIDERS ─────────────────────────────────────────────────────────
def _call_anthropic(prompt: str, system: str = "", max_tokens: int = 900) -> str:
    import anthropic  # deferred import
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    resp = client.messages.create(
        model=settings.anthropic_model,
        max_tokens=max_tokens,
        system=system or "You are a helpful writing coach.",
        messages=[{"role": "user", "content": prompt}],
    )
    parts = resp.content or []
    return "".join(getattr(p, "text", "") for p in parts)


def _call_openai(prompt: str, system: str = "", max_tokens: int = 900) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    resp = client.chat.completions.create(
        model=settings.openai_model,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system or "You are a helpful writing coach."},
            {"role": "user",   "content": prompt},
        ],
    )
    return resp.choices[0].message.content or ""


def generate_paragraph(language: str, difficulty: str, topic: str,
                       target_wpm: int, exam_style: str, word_count: int) -> str:
    if settings.ai_provider == "mock" or (
        settings.ai_provider == "anthropic" and not settings.anthropic_api_key
    ) or (settings.ai_provider == "openai" and not settings.openai_api_key):
        return _mock_paragraph(language, difficulty, topic, word_count)

    system = ("You are a typing-test content generator for Indian government "
              "examinations (SSC Stenographer, Bank PO, court clerks). "
              "Always return ONLY the plain text of the paragraph — no "
              "headings, no bullets, no JSON.")
    lang_line = "Language: Hindi (Devanagari script)." if language == "hi" else "Language: English."
    prompt = (
        f"Generate ONE paragraph of approximately {word_count} words "
        f"suitable for a {exam_style.upper()} typing test at {difficulty} "
        f"difficulty and a target of {target_wpm} WPM. "
        f"{lang_line} "
        f"{'Topic: ' + topic + '.' if topic else 'Pick a neutral general-knowledge topic.'} "
        "Use natural punctuation and avoid rare proper nouns."
    )
    try:
        if settings.ai_provider == "anthropic":
            return _call_anthropic(prompt, system=system).strip()
        if settings.ai_provider == "openai":
            return _call_openai(prompt, system=system).strip()
    except Exception:
        pass
    return _mock_paragraph(language, difficulty, topic, word_count)


def generate_coach(language: str, recent_wpm: float, recent_accuracy: float,
                   common_errors: list[str], weak_chapters: list[str]) -> dict:
    if settings.ai_provider == "mock" or (
        settings.ai_provider == "anthropic" and not settings.anthropic_api_key
    ) or (settings.ai_provider == "openai" and not settings.openai_api_key):
        return json.loads(_mock_coach(recent_wpm, recent_accuracy, common_errors, language))

    system = ("You are a personal typing and stenography coach. Respond ONLY "
              "with valid JSON matching: "
              '{"summary": string, "drills": [{"name":string,"minutes":int,"desc":string}]}. '
              "No markdown, no commentary.")
    lang_line = "Reply in Hindi." if language == "hi" else "Reply in English."
    prompt = (
        f"Student metrics: avg WPM {recent_wpm:.1f}, avg accuracy {recent_accuracy:.1f}%. "
        f"Common error substrings: {common_errors or 'none recorded'}. "
        f"Weak shorthand chapters: {weak_chapters or 'none recorded'}. "
        f"{lang_line} "
        "Produce a short motivational summary (3 sentences) and 3 concrete "
        "10-minute drills that target the weakest area first."
    )
    try:
        raw = (_call_anthropic(prompt, system=system) if settings.ai_provider == "anthropic"
               else _call_openai(prompt, system=system)).strip()
        # strip possible ```json fences
        if raw.startswith("```"):
            raw = raw.strip("`")
            if raw.lower().startswith("json"):
                raw = raw[4:]
        return json.loads(raw)
    except Exception:
        return json.loads(_mock_coach(recent_wpm, recent_accuracy, common_errors, language))
