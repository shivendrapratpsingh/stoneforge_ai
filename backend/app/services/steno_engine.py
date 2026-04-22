"""Shorthand evaluator.

Uses two pluggable maps:
  - app/data/steno_map.json     (English — Pitman New Era style)
  - app/data/steno_map_hi.json  (Hindi  — Devanagari short-forms / Mangal-style)

Both maps are { shorthand_key: longhand_word }. The engine accepts either
direction: given a shorthand it returns the expected longhand; given a
longhand it returns the expected shorthand outline (lookup inverse).
"""
from __future__ import annotations
import json
import os
from functools import lru_cache

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


@lru_cache(maxsize=4)
def _load_map(language: str) -> dict[str, str]:
    fname = "steno_map.json" if language == "en" else f"steno_map_{language}.json"
    path = os.path.join(DATA_DIR, fname)
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_steno(shorthand: str, typed: str, language: str = "en") -> dict:
    m = _load_map(language)
    expected = m.get(shorthand.strip().lower(), "")
    is_correct = bool(expected) and expected.strip().lower() == typed.strip().lower()
    hint = None
    if not expected:
        hint = "Outline not found — double-check the shorthand key."
    elif not is_correct:
        hint = f"Expected longhand: {expected}"
    return {"expected": expected, "is_correct": is_correct, "hint": hint}


def outline_for(word: str, language: str = "en") -> dict:
    """Reverse lookup: given a longhand word, return its known outline."""
    m = _load_map(language)
    inv = {v.strip().lower(): k for k, v in m.items()}
    key = word.strip().lower()
    outline = inv.get(key, "")
    notes = (
        "Pitman New Era outline" if language == "en"
        else "Devanagari short-form"
    ) if outline else "No outline stored — add via admin panel."
    return {"word": word, "outline": outline, "notes": notes}


def search_outlines(query: str, language: str = "en", limit: int = 20) -> list[dict]:
    m = _load_map(language)
    q = query.strip().lower()
    out = []
    for sh, lh in m.items():
        if q in sh.lower() or q in lh.lower():
            out.append({"shorthand": sh, "longhand": lh})
            if len(out) >= limit:
                break
    return out
