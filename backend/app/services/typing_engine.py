"""Typing evaluation: WPM, accuracy, per-character error analysis.

We support two WPM metrics:
  - gross_wpm = (chars_typed / 5) / minutes          (speed only)
  - net_wpm   = ((chars_typed - errors) / 5) / min   (speed + accuracy)

Error analysis aligns the user's typed text against the prompt using a fast
SequenceMatcher diff and returns a list of miss/extra/wrong segments that the
frontend can highlight and the coach can analyse.
"""
from __future__ import annotations
from difflib import SequenceMatcher
from typing import Any


def _diff_errors(prompt: str, typed: str) -> list[dict[str, Any]]:
    errors: list[dict[str, Any]] = []
    sm = SequenceMatcher(a=prompt, b=typed, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        errors.append({
            "type": tag,                       # replace|delete|insert
            "prompt_slice": prompt[i1:i2],
            "typed_slice":  typed[j1:j2],
            "prompt_range": [i1, i2],
            "typed_range":  [j1, j2],
        })
    return errors


def evaluate_typing(prompt: str, typed: str, duration_sec: float) -> dict[str, Any]:
    duration_sec = max(float(duration_sec), 0.001)
    minutes = duration_sec / 60.0

    total_typed = len(typed)

    # char-level correct count (position-aligned, for a simple accuracy signal)
    aligned_len = min(len(prompt), len(typed))
    aligned_correct = sum(1 for i in range(aligned_len) if prompt[i] == typed[i])

    # diff-based errors (more forgiving for transposition/insertion/deletion)
    errors = _diff_errors(prompt, typed)
    error_chars = sum(
        max(len(e["prompt_slice"]), len(e["typed_slice"])) for e in errors
    )

    gross_wpm = (total_typed / 5.0) / minutes if minutes else 0.0
    net_wpm   = max(0.0, ((total_typed - error_chars) / 5.0) / minutes) if minutes else 0.0

    accuracy = 100.0 * (1.0 - (error_chars / max(len(prompt), 1)))
    accuracy = max(0.0, min(100.0, accuracy))

    return {
        "wpm":            round(net_wpm, 2),
        "gross_wpm":      round(gross_wpm, 2),
        "accuracy":       round(accuracy, 2),
        "errors":         errors,
        "error_rate":     round(error_chars / max(len(prompt), 1), 4),
        "correct_chars":  aligned_correct,
        "incorrect_chars": error_chars,
        "duration_sec":   round(duration_sec, 2),
    }


# Back-compat with the old signature
def calculate_metrics(text: str, typed: str, time_taken: float):
    r = evaluate_typing(text, typed, time_taken)
    return r["wpm"], r["accuracy"]
