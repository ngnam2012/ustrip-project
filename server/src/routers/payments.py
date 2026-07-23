import uuid
import time
import secrets
from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import HTMLResponse, RedirectResponse
from typing import Any, Dict
from urllib.parse import urlparse
from src.schemas.payment import PaymentCreateRequest, PaymentQueryRequest
from src.dependencies.auth import get_trip_member, get_current_user
from src.config.db import db
from src.utils.api import ApiError
from src.config.momo import momo_config, is_momo_mock
from src.services.fund_service import refresh_member_contribution
from src.services.notifications_service import notify_trip_members, notify_user
from src.services.momo_service import create_momo_payment, momo_status, query_momo_payment, verify_result_signature
from src.utils.momo_mock_template import get_momo_mock_html
from datetime import datetime

router = APIRouter(tags=["payments"])

def public_payment(payment: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": payment.get('id'), "trip_id": payment.get('trip_id'), "contribution_id": payment.get('contribution_id'),
        "member_id": payment.get('member_id'), "provider": payment.get('provider'), "amount": payment.get('amount'),
        "currency": payment.get('currency'), "status": payment.get('status'), "order_id": payment.get('order_id'),
        "transaction_id": payment.get('transaction_id'), "pay_url": payment.get('pay_url'), "deeplink": payment.get('deeplink'),
        "qr_code_url": payment.get('qr_code_url'), "paid_at": payment.get('paid_at'), "created_at": payment.get('created_at'),
        "updated_at": payment.get('updated_at')
    }

def validate_client_return_url(value: str) -> str:
    if not value: return None
    try:
        parsed = urlparse(value)
        if parsed.scheme == 'ustrip': return value
        client_parsed = urlparse(momo_config['clientUrl'])
        if parsed.scheme == client_parsed.scheme and parsed.netloc == client_parsed.netloc:
            return value
    except:
        pass
    raise ApiError(422, 'return_url must use the ustrip scheme or the configured web client origin')

def payment_return_url(payment: Dict[str, Any], status: str) -> str:
    fallback = f"{momo_config['clientUrl']}/trips/{payment.get('trip_id')}/fund"
    target = fallback
    if payment.get('raw_request') and payment['raw_request'].get('clientReturnUrl'):
        target = payment['raw_request']['clientReturnUrl']
        
    parsed = urlparse(target)
    query = parsed.query
    query_parts = dict(q.split('=') for q in query.split('&')) if query else {}
    query_parts['paymentId'] = payment.get('id')
    query_parts['status'] = status
    
    new_query = '&'.join(f"{k}={v}" for k, v in query_parts.items())
    return parsed._replace(query=new_query).geturl()

async def apply_payment_result(payment: Dict[str, Any], payload: Dict[str, Any], status: str) -> Dict[str, Any]:
    if payment.get('status') == 'success': return payment
    
    paid_at = datetime.utcnow().isoformat() if status == 'success' else None
    transaction_id = str(payload.get('transId')) if payload.get('transId') else payment.get('transaction_id')
    
    res = db.table('payments').update({
        "status": status,
        "transaction_id": transaction_id,
        "raw_response": payload,
        "paid_at": paid_at
    }).eq('id', payment['id']).neq('status', 'success').execute()
    
    if not res.data:
        p_res = db.table('payments').select('*').eq('id', payment['id']).execute()
        return p_res.data[0] if p_res.data else payment
        
    updated = res.data[0]
    db.table('fund_contributions').update({"payment_status": status, "paid_at": paid_at}).eq('id', payment['contribution_id']).execute()
    await refresh_member_contribution(payment['trip_id'], payment['member_id'])
    
    if status == 'success':
        await notify_user(payment['member_id'], payment['trip_id'], 'new_expense', 'Đóng góp MoMo thành công', f"Đã ghi nhận {float(payment['amount']):,.0f}đ vào quỹ chung.")
        await notify_trip_members(payment['trip_id'], payment['member_id'], 'new_expense', 'Quỹ chung vừa nhận đóng góp', f"Đã nhận {float(payment['amount']):,.0f}đ qua MoMo.")
        
    return updated

async def find_payment_by_result(payload: Dict[str, Any]) -> Dict[str, Any]:
    res = db.table('payments').select('*').eq('order_id', payload.get('orderId')).eq('request_id', payload.get('requestId')).execute()
    if not res.data:
        raise ApiError(404, 'Payment not found')
    data = res.data[0]
    if str(round(float(data['amount']))) != str(payload.get('amount')):
        raise ApiError(400, 'Payment amount mismatch')
    return data

@router.post("/trips/{tripId}/contributions/momo/create", status_code=status.HTTP_201_CREATED)
async def create(request: Request, payment_in: PaymentCreateRequest, current_user: Dict[str, Any] = Depends(get_trip_member)):
    trip_id = request.path_params.get('tripId')
    client_return_url = validate_client_return_url(payment_in.return_url)
    member_id = payment_in.member_id or current_user['id']
    
    if member_id != current_user['id'] and getattr(request.state, 'trip_role', None) != 'owner':
        raise ApiError(403, 'Only the trip owner can create a payment for another member')
        
    mem_res = db.table('trip_members').select('id').eq('trip_id', trip_id).eq('user_id', member_id).execute()
    if not mem_res.data:
        raise ApiError(403, 'Selected user is not a trip member')
        
    payment_id = str(uuid.uuid4())
    contribution_id = str(uuid.uuid4())
    stamp = int(time.time() * 1000)
    order_id = f"ustrip_{stamp}_{payment_id[:8]}"
    request_id = f"req_{stamp}_{secrets.token_hex(4)}"
    
    contrib_res = db.table('fund_contributions').insert({
        "id": contribution_id, "trip_id": trip_id, "user_id": member_id, "amount": payment_in.amount,
        "payment_method": "momo", "payment_status": "pending", "note": payment_in.note or 'Thanh toán qua MoMo'
    }).execute()
    contribution = contrib_res.data[0]
    
    pay_res = db.table('payments').insert({
        "id": payment_id, "trip_id": trip_id, "contribution_id": contribution['id'], "member_id": member_id,
        "amount": payment_in.amount, "order_id": order_id, "request_id": request_id, "status": "pending"
    }).execute()
    payment = pay_res.data[0]
    
    db.table('fund_contributions').update({"payment_id": payment['id']}).eq('id', contribution['id']).execute()
    
    try:
        base_url = f"{request.url.scheme}://{request.url.netloc}"
        momo = await create_momo_payment(payment, base_url)
        
        raw_request = momo.get('rawRequest') or {"mock": True}
        raw_request['clientReturnUrl'] = client_return_url
        
        upd_res = db.table('payments').update({
            "pay_url": momo.get('payUrl'), "deeplink": momo.get('deeplink'), "qr_code_url": momo.get('qrCodeUrl'),
            "raw_request": raw_request, "raw_response": momo
        }).eq('id', payment['id']).execute()
        payment = upd_res.data[0]
        
        return {**public_payment(payment), "environment": momo_config['env']}
    except Exception as e:
        await apply_payment_result(payment, {"message": str(e)}, 'failed')
        raise e

@router.post("/payments/momo/ipn", status_code=status.HTTP_204_NO_CONTENT)
async def ipn(request: Request):
    payload = await request.json()
    if not verify_result_signature(payload):
        raise ApiError(400, 'Invalid MoMo signature')
    payment = await find_payment_by_result(payload)
    await apply_payment_result(payment, payload, momo_status(payload.get('resultCode')))
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/payments/momo/return")
async def return_result(request: Request):
    payload = dict(request.query_params)
    status = 'failed'
    payment = None
    try:
        if not verify_result_signature(payload):
            raise ApiError(400, 'Invalid MoMo signature')
        payment = await find_payment_by_result(payload)
        status = momo_status(payload.get('resultCode'))
        await apply_payment_result(payment, payload, status)
    except Exception as e:
        return HTMLResponse(content=f"<h1>Không thể xác minh thanh toán</h1><p>{str(e)}</p>", status_code=400)
        
    return RedirectResponse(url=payment_return_url(payment, status))

@router.get("/payments/{paymentId}/status")
async def payment_status(request: Request, current_user: Dict[str, Any] = Depends(get_current_user)):
    payment_id = request.path_params.get('paymentId')
    res = db.table('payments').select('*').eq('id', payment_id).execute()
    if not res.data:
        raise ApiError(404, 'Payment not found')
    payment = res.data[0]
    
    mem_res = db.table('trip_members').select('id').eq('trip_id', payment['trip_id']).eq('user_id', current_user['id']).execute()
    if not mem_res.data:
        raise ApiError(403, 'You are not a member of this trip')
    return public_payment(payment)

@router.post("/payments/momo/query")
async def query(request: Request, query_in: PaymentQueryRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    res = db.table('payments').select('*').eq('id', query_in.payment_id).execute()
    if not res.data:
        raise ApiError(404, 'Payment not found')
    payment = res.data[0]
    
    mem_res = db.table('trip_members').select('id').eq('trip_id', payment['trip_id']).eq('user_id', current_user['id']).execute()
    if not mem_res.data:
        raise ApiError(403, 'You are not a member of this trip')
        
    result = await query_momo_payment(payment)
    if not is_momo_mock() and not verify_result_signature(result):
        raise ApiError(400, 'Invalid MoMo query signature')
        
    updated = await apply_payment_result(payment, result, momo_status(result.get('resultCode')))
    return public_payment(updated)

@router.get("/payments/{paymentId}/mock")
async def mock_page(request: Request):
    if not is_momo_mock():
        raise ApiError(404, 'Mock payment is disabled')
        
    payment_id = request.path_params.get('paymentId')
    res = db.table('payments').select('*').eq('id', payment_id).execute()
    if not res.data:
        raise ApiError(404, 'Payment not found')
    payment = res.data[0]
    
    if payment.get('status') == 'success':
        return RedirectResponse(url=payment_return_url(payment, 'success'))
        
    return_url = payment_return_url(payment, payment.get('status'))
    success_url = f"/api/payments/{payment['id']}/mock-success"
    
    html = get_momo_mock_html(float(payment['amount']), success_url, return_url, payment.get('status'))
    
    return HTMLResponse(content=html)

@router.api_route("/payments/{paymentId}/mock-success", methods=["GET", "POST"])
async def mock_success(request: Request):
    if not is_momo_mock():
        raise ApiError(404, 'Mock payment is disabled')
        
    payment_id = request.path_params.get('paymentId')
    res = db.table('payments').select('*').eq('id', payment_id).execute()
    if not res.data:
        raise ApiError(404, 'Payment not found')
    payment = res.data[0]
    
    payload = {"mock": True, "transId": f"mock_{int(time.time()*1000)}"}
    updated = await apply_payment_result(payment, payload, 'success')
    
    accept = request.headers.get('accept', '')
    wants_json = 'application/json' in accept or request.headers.get('sec-fetch-dest') == 'empty' or (request.headers.get('x-requested-with') == 'XMLHttpRequest')
    
    if wants_json:
        return {"status": "success", "id": updated['id']}
        
    return RedirectResponse(url=payment_return_url(updated, 'success'))
