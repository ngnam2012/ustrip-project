import crypto from 'node:crypto';
import { db } from '../config/db.js';
import { isMomoMock, momoConfig } from '../config/momo.js';
import { refreshMemberContribution } from '../services/fund.service.js';
import { notifyTripMembers, notifyUser } from '../services/notifications.js';
import { createMomoPayment, momoStatus, queryMomoPayment, verifyResultSignature } from '../services/momo.service.js';
import { ApiError, asyncHandler, unwrap } from '../utils/api.js';

const publicPayment = (payment) => ({
  id: payment.id, trip_id: payment.trip_id, contribution_id: payment.contribution_id,
  member_id: payment.member_id, provider: payment.provider, amount: payment.amount,
  currency: payment.currency, status: payment.status, order_id: payment.order_id,
  transaction_id: payment.transaction_id, pay_url: payment.pay_url, deeplink: payment.deeplink,
  qr_code_url: payment.qr_code_url, paid_at: payment.paid_at, created_at: payment.created_at,
  updated_at: payment.updated_at
});

function validateClientReturnUrl(value) {
  if (!value) return null;
  try {
    const target = new URL(value);
    if (target.protocol === 'ustrip:') return target.toString();
    if (target.origin === new URL(momoConfig.clientUrl).origin) return target.toString();
  } catch {
    // The validation error below intentionally hides URL parsing details.
  }
  throw new ApiError(422, 'return_url must use the ustrip scheme or the configured web client origin');
}

function paymentReturnUrl(payment, status) {
  const fallback = `${momoConfig.clientUrl}/trips/${payment.trip_id}/fund`;
  const target = new URL(payment.raw_request?.clientReturnUrl || fallback);
  target.searchParams.set('paymentId', payment.id);
  target.searchParams.set('status', status);
  return target.toString();
}

async function applyPaymentResult(payment, payload, status) {
  if (payment.status === 'success') return payment;
  const paidAt = status === 'success' ? new Date().toISOString() : null;
  const updated = unwrap(await db.from('payments').update({
    status, transaction_id: payload.transId ? String(payload.transId) : payment.transaction_id,
    raw_response: payload, paid_at: paidAt
  }).eq('id', payment.id).neq('status', 'success').select('*').maybeSingle());
  if (!updated) return unwrap(await db.from('payments').select('*').eq('id', payment.id).single());
  await db.from('fund_contributions').update({ payment_status: status, paid_at: paidAt }).eq('id', payment.contribution_id);
  await refreshMemberContribution(payment.trip_id, payment.member_id);
  if (status === 'success') {
    await notifyUser(payment.member_id, payment.trip_id, 'new_expense', 'Đóng góp MoMo thành công', `Đã ghi nhận ${Number(payment.amount).toLocaleString('vi-VN')}đ vào quỹ chung.`);
    await notifyTripMembers(payment.trip_id, payment.member_id, 'new_expense', 'Quỹ chung vừa nhận đóng góp', `Đã nhận ${Number(payment.amount).toLocaleString('vi-VN')}đ qua MoMo.`);
  }
  return updated;
}

async function findPaymentByResult(payload) {
  const { data } = await db.from('payments').select('*').eq('order_id', payload.orderId).eq('request_id', payload.requestId).single();
  if (!data) throw new ApiError(404, 'Payment not found');
  if (String(Math.round(Number(data.amount))) !== String(payload.amount)) throw new ApiError(400, 'Payment amount mismatch');
  return data;
}

export const create = asyncHandler(async (req, res) => {
  const amount = Math.round(Number(req.body.amount));
  if (!Number.isFinite(amount) || amount < 1000 || amount > 50000000) throw new ApiError(422, 'MoMo amount must be between 1,000 and 50,000,000 VND');
  const clientReturnUrl = validateClientReturnUrl(req.body.return_url);
  const memberId = req.body.member_id || req.user.id;
  if (memberId !== req.user.id && req.tripRole !== 'owner') throw new ApiError(403, 'Only the trip owner can create a payment for another member');
  const { data: member } = await db.from('trip_members').select('id').eq('trip_id', req.params.tripId).eq('user_id', memberId).single();
  if (!member) throw new ApiError(403, 'Selected user is not a trip member');

  const paymentId = crypto.randomUUID();
  const contributionId = crypto.randomUUID();
  const stamp = Date.now();
  const orderId = `ustrip_${stamp}_${paymentId.slice(0, 8)}`;
  const requestId = `req_${stamp}_${crypto.randomBytes(4).toString('hex')}`;
  const contribution = unwrap(await db.from('fund_contributions').insert({
    id: contributionId, trip_id: req.params.tripId, user_id: memberId, amount,
    payment_method: 'momo', payment_status: 'pending', note: req.body.note || 'Thanh toán qua MoMo'
  }).select('*').single());
  let payment = unwrap(await db.from('payments').insert({
    id: paymentId, trip_id: req.params.tripId, contribution_id: contribution.id, member_id: memberId,
    amount, order_id: orderId, request_id: requestId, status: 'pending'
  }).select('*').single());
  await db.from('fund_contributions').update({ payment_id: payment.id }).eq('id', contribution.id);

  try {
    const momo = await createMomoPayment(payment, `${req.protocol}://${req.get('host')}`);
    payment = unwrap(await db.from('payments').update({
      pay_url: momo.payUrl, deeplink: momo.deeplink, qr_code_url: momo.qrCodeUrl,
      raw_request: { ...(momo.rawRequest || { mock: true }), clientReturnUrl }, raw_response: momo
    }).eq('id', payment.id).select('*').single());
    res.status(201).json({ ...publicPayment(payment), environment: momoConfig.env });
  } catch (error) {
    await applyPaymentResult(payment, { message: error.message }, 'failed');
    throw error;
  }
});

export const ipn = asyncHandler(async (req, res) => {
  if (!verifyResultSignature(req.body)) throw new ApiError(400, 'Invalid MoMo signature');
  const payment = await findPaymentByResult(req.body);
  await applyPaymentResult(payment, req.body, momoStatus(req.body.resultCode));
  res.status(204).end();
});

export const returnResult = asyncHandler(async (req, res) => {
  let status = 'failed'; let payment;
  try {
    if (!verifyResultSignature(req.query)) throw new ApiError(400, 'Invalid MoMo signature');
    payment = await findPaymentByResult(req.query);
    status = momoStatus(req.query.resultCode);
    await applyPaymentResult(payment, req.query, status);
  } catch (error) {
    return res.status(400).send(`<h1>Không thể xác minh thanh toán</h1><p>${error.message}</p>`);
  }
  res.redirect(paymentReturnUrl(payment, status));
});

export const status = asyncHandler(async (req, res) => {
  const payment = unwrap(await db.from('payments').select('*').eq('id', req.params.paymentId).single());
  const { data: membership } = await db.from('trip_members').select('id').eq('trip_id', payment.trip_id).eq('user_id', req.user.id).single();
  if (!membership) throw new ApiError(403, 'You are not a member of this trip');
  res.json(publicPayment(payment));
});

export const query = asyncHandler(async (req, res) => {
  const payment = unwrap(await db.from('payments').select('*').eq('id', req.body.payment_id).single());
  const { data: membership } = await db.from('trip_members').select('id').eq('trip_id', payment.trip_id).eq('user_id', req.user.id).single();
  if (!membership) throw new ApiError(403, 'You are not a member of this trip');
  const result = await queryMomoPayment(payment);
  if (!isMomoMock() && !verifyResultSignature(result)) throw new ApiError(400, 'Invalid MoMo query signature');
  const updated = await applyPaymentResult(payment, result, momoStatus(result.resultCode));
  res.json(publicPayment(updated));
});

export const mockPage = asyncHandler(async (req, res) => {
  if (!isMomoMock()) throw new ApiError(404, 'Mock payment is disabled');
  const payment = unwrap(await db.from('payments').select('*').eq('id', req.params.paymentId).single());
  if (payment.status === 'success') return res.redirect(paymentReturnUrl(payment, 'success'));
  const returnUrl = paymentReturnUrl(payment, payment.status);
  res.send(`<!doctype html><meta charset="utf-8"><title>MoMo Mock</title><style>body{font-family:system-ui;background:#fff0f7;display:grid;place-items:center;min-height:100vh}.c{background:white;padding:32px;border-radius:24px;box-shadow:0 15px 50px #a5006420;text-align:center}button{background:#a50064;color:white;border:0;padding:14px 24px;border-radius:14px;font-weight:700;cursor:pointer}a{display:inline-block;margin-top:14px;color:#a50064;font-weight:700}</style><div class="c"><h1>MoMo Mock Sandbox</h1><p>UsTrip contribution: ${Number(payment.amount).toLocaleString('vi-VN')}đ</p><form method="post" action="/api/payments/${payment.id}/mock-success"><button>Đánh dấu thanh toán thành công và quay lại UsTrip</button></form><a href="${returnUrl}">Quay lại UsTrip</a><p>Không sử dụng tiền thật.</p></div>`);
});

export const mockSuccess = asyncHandler(async (req, res) => {
  if (!isMomoMock()) throw new ApiError(404, 'Mock payment is disabled');
  const payment = unwrap(await db.from('payments').select('*').eq('id', req.params.paymentId).single());
  const updated = await applyPaymentResult(payment, { mock: true, transId: `mock_${Date.now()}` }, 'success');
  res.redirect(paymentReturnUrl(updated, 'success'));
});
