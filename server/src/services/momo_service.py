import hmac
import hashlib
import base64
import json
import uuid
import httpx
from typing import Dict, Any
from src.config.momo import momo_config, is_momo_mock
from src.config.settings import settings
from src.utils.api import ApiError

def _hmac(raw: str) -> str:
    key = momo_config['secretKey'].encode('utf-8')
    msg = raw.encode('utf-8')
    return hmac.new(key, msg, hashlib.sha256).hexdigest()

def create_signature(payload: Dict[str, Any]) -> str:
    raw = (f"accessKey={momo_config['accessKey']}&amount={payload['amount']}"
           f"&extraData={payload['extraData']}&ipnUrl={payload['ipnUrl']}"
           f"&orderId={payload['orderId']}&orderInfo={payload['orderInfo']}"
           f"&partnerCode={payload['partnerCode']}&redirectUrl={payload['redirectUrl']}"
           f"&requestId={payload['requestId']}&requestType={payload['requestType']}")
    return _hmac(raw)

def query_signature(order_id: str, request_id: str) -> str:
    raw = (f"accessKey={momo_config['accessKey']}&orderId={order_id}"
           f"&partnerCode={momo_config['partnerCode']}&requestId={request_id}")
    return _hmac(raw)

def result_signature(payload: Dict[str, Any]) -> str:
    raw = (f"accessKey={momo_config['accessKey']}&amount={payload.get('amount')}"
           f"&extraData={payload.get('extraData', '')}&message={payload.get('message', '')}"
           f"&orderId={payload.get('orderId')}&orderInfo={payload.get('orderInfo', '')}"
           f"&orderType={payload.get('orderType', '')}&partnerCode={payload.get('partnerCode')}"
           f"&payType={payload.get('payType', '')}&requestId={payload.get('requestId')}"
           f"&responseTime={payload.get('responseTime')}&resultCode={payload.get('resultCode')}"
           f"&transId={payload.get('transId', '')}")
    return _hmac(raw)

def verify_result_signature(payload: Dict[str, Any]) -> bool:
    if is_momo_mock():
        return True
    if 'signature' not in payload:
        return False
        
    expected = result_signature(payload)
    actual = str(payload['signature'])
    
    if len(expected) != len(actual):
        return False
    return hmac.compare_digest(expected, actual)

async def post_json(url: str, body: Dict[str, Any]) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=body)
        
        try:
            data = response.json()
        except Exception:
            data = {}
            
        if not response.is_success:
            raise ApiError(502, data.get('message', f"MoMo returned HTTP {response.status_code}"))
        return data

async def create_momo_payment(payment: Dict[str, Any], public_base_url: str = None) -> Dict[str, Any]:
    if is_momo_mock():
        base = public_base_url or f"http://localhost:{settings.PORT}"
        return {
            "partnerCode": "MOMO_MOCK",
            "requestId": payment.get('request_id'),
            "orderId": payment.get('order_id'),
            "resultCode": 0,
            "message": "Mock payment created",
            "payUrl": f"{base}/api/payments/{payment.get('id')}/mock",
            "deeplink": f"{base}/api/payments/{payment.get('id')}/mock",
            "qrCodeUrl": None
        }
        
    if not momo_config['partnerCode'] or not momo_config['accessKey'] or not momo_config['secretKey']:
        raise ApiError(503, 'MoMo merchant credentials are not configured')
        
    extra_data_json = json.dumps({"paymentId": payment.get('id'), "tripId": payment.get('trip_id')})
    extra_data = base64.b64encode(extra_data_json.encode('utf-8')).decode('utf-8')
    
    payload = {
        "partnerCode": momo_config['partnerCode'],
        "requestType": momo_config['requestType'],
        "ipnUrl": momo_config['ipnUrl'],
        "redirectUrl": momo_config['redirectUrl'],
        "orderId": payment.get('order_id'),
        "amount": str(round(float(payment.get('amount')))),
        "orderInfo": f"UsTrip contribution {payment.get('order_id')}",
        "requestId": payment.get('request_id'),
        "extraData": extra_data,
        "lang": "vi",
        "autoCapture": True
    }
    
    payload['signature'] = create_signature(payload)
    response = await post_json(momo_config['endpoint'], payload)
    return {**response, "rawRequest": payload}

async def query_momo_payment(payment: Dict[str, Any]) -> Dict[str, Any]:
    if is_momo_mock():
        return {
            "orderId": payment.get('order_id'),
            "requestId": payment.get('request_id'),
            "resultCode": 0 if payment.get('status') == 'success' else 1000,
            "message": f"Mock status: {payment.get('status')}"
        }
        
    request_id = str(uuid.uuid4())
    payload = {
        "partnerCode": momo_config['partnerCode'],
        "requestId": request_id,
        "orderId": payment.get('order_id'),
        "lang": "vi"
    }
    payload['signature'] = query_signature(payment.get('order_id'), request_id)
    return await post_json(momo_config['queryEndpoint'], payload)

def momo_status(result_code: Any) -> str:
    try:
        code = int(result_code)
    except (ValueError, TypeError):
        return 'failed'
        
    if code in (0, 9000): return 'success'
    if code in (1005, 1006): return 'cancelled'
    if code in (1001, 1002, 1003, 1004): return 'expired'
    if code == 1000: return 'pending'
    return 'failed'
