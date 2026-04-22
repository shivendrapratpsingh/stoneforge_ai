from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models_db import Subscription, User
from app.schemas import CreateOrderIn, CreateOrderOut, VerifyPaymentIn
from app.services.payments import (PLAN_CATALOG, PLAN_TO_ROLE,
                                   create_order, verify_signature, verify_webhook)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/plans")
def plans():
    return {
        code: {**info, "amount_rupees": info["amount"] / 100}
        for code, info in PLAN_CATALOG.items()
    }


@router.post("/create-order", response_model=CreateOrderOut)
def create_order_endpoint(
    data: CreateOrderIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if data.plan_code not in PLAN_CATALOG:
        raise HTTPException(400, "Unknown plan")
    order = create_order(data.plan_code, user.email)
    sub = Subscription(
        user_id=user.id,
        razorpay_order_id=order["order_id"],
        plan_code=data.plan_code,
        status="pending",
    )
    db.add(sub); db.commit()
    return order


@router.post("/verify")
def verify(
    data: VerifyPaymentIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_signature(data.razorpay_order_id, data.razorpay_payment_id,
                            data.razorpay_signature):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Signature verification failed")
    if data.plan_code not in PLAN_CATALOG:
        raise HTTPException(400, "Unknown plan")

    sub = (db.query(Subscription)
             .filter(Subscription.razorpay_order_id == data.razorpay_order_id,
                     Subscription.user_id == user.id)
             .first())
    if not sub:
        sub = Subscription(user_id=user.id,
                           razorpay_order_id=data.razorpay_order_id,
                           plan_code=data.plan_code)
        db.add(sub)

    plan = PLAN_CATALOG[data.plan_code]
    sub.status = "active"
    sub.current_period_end = datetime.utcnow() + timedelta(days=plan["period_days"])
    user.plan = PLAN_TO_ROLE[data.plan_code]
    db.commit()
    return {"ok": True, "plan": user.plan,
            "current_period_end": sub.current_period_end.isoformat()}


@router.post("/webhook")
async def webhook(request: Request,
                  x_razorpay_signature: str = Header(default=""),
                  db: Session = Depends(get_db)):
    body = await request.body()
    if not verify_webhook(body, x_razorpay_signature):
        raise HTTPException(400, "Invalid webhook signature")
    # Real impl would parse body['event'] and update subscriptions
    return {"ok": True}
