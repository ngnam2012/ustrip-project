import crypto from 'node:crypto';
import { momoConfig, isMomoMock } from '../config/momo.js';
import { ApiError } from '../utils/api.js';

const hmac = (raw) => crypto.createHmac('sha256', momoConfig.secretKey).update(raw).digest('hex');

export function createSignature(payload) {
  const raw = `accessKey=${momoConfig.accessKey}&amount=${payload.amount}&extraData=${payload.extraData}&ipnUrl=${payload.ipnUrl}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo}&partnerCode=${payload.partnerCode}&redirectUrl=${payload.redirectUrl}&requestId=${payload.requestId}&requestType=${payload.requestType}`;
  return hmac(raw);
}

export function querySignature({ orderId, requestId }) {
  return hmac(`accessKey=${momoConfig.accessKey}&orderId=${orderId}&partnerCode=${momoConfig.partnerCode}&requestId=${requestId}`);
}

export function resultSignature(payload) {
  const raw = `accessKey=${momoConfig.accessKey}&amount=${payload.amount}&extraData=${payload.extraData || ''}&message=${payload.message || ''}&orderId=${payload.orderId}&orderInfo=${payload.orderInfo || ''}&orderType=${payload.orderType || ''}&partnerCode=${payload.partnerCode}&payType=${payload.payType || ''}&requestId=${payload.requestId}&responseTime=${payload.responseTime}&resultCode=${payload.resultCode}&transId=${payload.transId || ''}`;
  return hmac(raw);
}

export function verifyResultSignature(payload) {
  if (isMomoMock()) return true;
  if (!payload.signature) return false;
  const expected = resultSignature(payload);
  const actual = String(payload.signature);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(502, data.message || `MoMo returned HTTP ${response.status}`);
  return data;
}

export async function createMomoPayment(payment, publicBaseUrl) {
  if (isMomoMock()) {
    const base = publicBaseUrl || process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
    return {
      partnerCode: 'MOMO_MOCK',
      requestId: payment.request_id,
      orderId: payment.order_id,
      resultCode: 0,
      message: 'Mock payment created',
      payUrl: `${base}/api/payments/${payment.id}/mock`,
      deeplink: `${base}/api/payments/${payment.id}/mock`,
      qrCodeUrl: null
    };
  }
  if (!momoConfig.partnerCode || !momoConfig.accessKey || !momoConfig.secretKey) {
    throw new ApiError(503, 'MoMo merchant credentials are not configured');
  }
  const extraData = Buffer.from(JSON.stringify({ paymentId: payment.id, tripId: payment.trip_id })).toString('base64');
  const payload = {
    partnerCode: momoConfig.partnerCode,
    requestType: momoConfig.requestType,
    ipnUrl: momoConfig.ipnUrl,
    redirectUrl: momoConfig.redirectUrl,
    orderId: payment.order_id,
    amount: String(Math.round(Number(payment.amount))),
    orderInfo: `UsTrip contribution ${payment.order_id}`,
    requestId: payment.request_id,
    extraData,
    lang: 'vi',
    autoCapture: true
  };
  payload.signature = createSignature(payload);
  const response = await postJson(momoConfig.endpoint, payload);
  return { ...response, rawRequest: payload };
}

export async function queryMomoPayment(payment) {
  if (isMomoMock()) return { orderId: payment.order_id, requestId: payment.request_id, resultCode: payment.status === 'success' ? 0 : 1000, message: `Mock status: ${payment.status}` };
  const payload = {
    partnerCode: momoConfig.partnerCode,
    requestId: crypto.randomUUID(),
    orderId: payment.order_id,
    lang: 'vi'
  };
  payload.signature = querySignature(payload);
  return postJson(momoConfig.queryEndpoint, payload);
}

export function momoStatus(resultCode) {
  const code = Number(resultCode);
  if (code === 0 || code === 9000) return 'success';
  if ([1005, 1006].includes(code)) return 'cancelled';
  if ([1001, 1002, 1003, 1004].includes(code)) return 'expired';
  return code === 1000 ? 'pending' : 'failed';
}
