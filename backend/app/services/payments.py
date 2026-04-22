"""Razorpay helpers for one-time orders + subscriptions.

For the MVP we use one-time orders (amount x period) which is the simplest
flow to integrate and test. A later upgrade can switch to Razorpay
Subscriptions by populating *plan_*_id settings and calling
`client.subscription.create`.
"""
from __future__ import annotations
import hmac
import hashlib
from typing import Optional

from app.config import get_settings

settings = get_settings()

# ── Plan catalogue (in paise — smallest INR unit) ───────────────────────────
PLAN_CATALOG: dict[str, dict] = {
    "pro_monthly":       {"amount":   19900, "period_days": 30,  "label": "Pro Monthly"},
    "pro_yearly":        {"amount":   99900, "period_days": 365, "label": "Pro Yearly"},
    "institute_monthly": {"amount":  299900, "period_days": 30,  "label": "Institute Monthly"},
}

PLAN_TO_ROLE = {
    "pro_monthly":       "pro",
    "pro_yearly":        "pro",
    "institute_monthly": "institute",
}


def _client():
    """Return a configured Razorpay client. Raises if keys not set."""
    if not (settings.razorpay_key_id and settings.razorpay_key_secret):
        raise RuntimeError("Razorpay keys not configured")
    import razorpay
    return razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


def create_order(plan_code: str, user_email: str) -> dict:
    plan = PLAN_CATALOG[plan_code]
    try:
        client = _client()
        order = client.order.create({
            "amount":          plan["amount"],
            "currency":        "INR",
            "receipt":         f"stf_{plan_code}_{user_email[:20]}",
            "payment_capture": 1,
            "notes":           {"plan_code": plan_code, "email": user_email},
        })
        return {
            "order_id":  order["id"],
            "amount":    order["amount"],
            "currency":  order["currency"],
            "key_id":    settings.razorpay_key_id,
            "plan_code": plan_code,
            "razorpay_sub_id": "",
        }
    except Exception:
        # dev-mode stub so the UI flow is testable without real keys
        return {
            "order_id":  f"order_mock_{plan_code}",
            "amount":    plan["amount"],
            "currency":  "INR",
            "key_id":    "rzp_test_mock",
            "plan_code": plan_code,
            "razorpay_sub_id": "",
        }


def verify_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify the checkout-success signature. In mock mode (no secret), accept
    any signature that starts with 'mock_' so local UX testing works."""
    if not settings.razorpay_key_secret:
        return signature.startswith("mock_") or order_id.startswith("order_mock_")
    msg = f"{order_id}|{payment_id}".encode()
    expected = hmac.new(settings.razorpay_key_secret.encode(), msg,
                        hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def verify_webhook(body: bytes, signature: str) -> bool:
    if not settings.razorpay_webhook_secret:
        return False
    expected = hmac.new(settings.razorpay_webhook_secret.encode(), body,
                        hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
