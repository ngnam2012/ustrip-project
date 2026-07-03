import { motion } from 'framer-motion';
import { Check, ExternalLink, RefreshCw, RotateCcw, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { api, currency, BASE_URL } from '../lib/api';
import { Link } from 'react-router-dom';

const statusStyle = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
  expired: 'bg-slate-50 text-slate-600 border-slate-200'
};

const statusLabels = {
  pending: 'Đang chờ thanh toán',
  success: 'Thanh toán thành công',
  failed: 'Thanh toán thất bại',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn'
};

const statusIcons = {
  pending: <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse-glow" />,
  success: <CheckCircle2 size={18} className="text-emerald-600" />,
  failed: <AlertTriangle size={18} className="text-red-600" />,
  cancelled: <div className="h-2 w-2 rounded-full bg-slate-400" />,
  expired: <div className="h-2 w-2 rounded-full bg-slate-400" />
};

function getMockSuccessPath(payment) {
  const source = payment?.pay_url || payment?.deeplink || '';
  if (source) {
    try {
      const url = new URL(source, window.location.origin);
      const match = url.pathname.match(/\/api\/payments\/([^/]+)\/mock$/);
      if (match) return `/payments/${match[1]}/mock-success`;
    } catch {
      // Fall back to the payment id below.
    }
  }
  return payment?.id ? `/payments/${payment.id}/mock-success` : null;
}

export function markMockPaymentSuccess(payment) {
  const path = getMockSuccessPath(payment);
  if (!path) throw new Error('Không tìm được mock endpoint');
  return api(path, { method: 'POST', headers: { Accept: 'application/json' } });
}

export function PaymentStatusCard({ payment, onRefresh, onMockSuccess, onReset }) {
  if (!payment) return null;
  const rawLink = payment.deeplink || payment.pay_url;
  const isMock = payment.environment === 'mock' || rawLink?.includes('/mock');
  const link = isMock && payment.id ? `${BASE_URL}/payments/${payment.id}/mock` : rawLink;
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-6 ${statusStyle[payment.status] || statusStyle.pending}`}>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          {statusIcons[payment.status]}
          MoMo payment
        </p>
        <p className="mt-2 text-2xl font-extrabold tracking-tight">{currency(payment.amount)}</p>
      </div>
      <span className="badge bg-white/70 border border-white/50">{statusLabels[payment.status] || payment.status}</span>
    </div>
    {payment.status === 'pending' && link && <div className="mt-6">
      {/* Only show QR code when NOT in mock mode */}
      {!isMock && <div className="mb-4 inline-block rounded-2xl bg-white p-4 shadow-sm"><QRCodeSVG value={payment.pay_url || link} size={136}/></div>}
      <p className="text-sm leading-relaxed">{isMock
        ? 'Đây là môi trường thử nghiệm. Bấm "Đánh dấu thành công" để giả lập thanh toán thành công.'
        : 'Quét QR hoặc mở liên kết MoMo để thanh toán. Trạng thái chỉ được cập nhật từ IPN/backend.'
      }</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {/* Mock mode: direct success button */}
        {isMock && onMockSuccess && <button type="button" className="btn bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-md" onClick={onMockSuccess}><Check size={16}/>Đánh dấu thành công</button>}
        <button type="button" className={isMock ? 'btn-secondary' : 'btn-primary'} onClick={() => window.open(link, '_blank')}><ExternalLink size={16}/>{isMock ? 'Mở trang mock' : 'Mở MoMo'}</button>
        <button type="button" className="btn-secondary" onClick={onRefresh}><RefreshCw size={16}/>Kiểm tra trạng thái</button>
      </div>
    </div>}
    {payment.status === 'success' && <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-emerald-100/50 p-3"><CheckCircle2 size={18}/><p className="font-semibold text-sm">Đóng góp đã được ghi nhận tự động vào quỹ chung.</p></div>}
    {payment.status === 'failed' && <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-red-100/50 p-3"><AlertTriangle size={18}/><p className="font-semibold text-sm">Thanh toán không thành công. Bạn có thể thử lại.</p></div>}
    {/* Reset button: let user create a new payment when stuck or failed */}
    {onReset && payment.status !== 'success' && <button type="button" className="btn-secondary mt-5 w-full" onClick={onReset}><RotateCcw size={16}/>Tạo thanh toán mới</button>}
    {payment.trip_id && payment.id && <Link className="mt-4 inline-flex items-center gap-1 text-sm font-bold underline underline-offset-2 transition hover:opacity-70" to={`/trips/${payment.trip_id}/payments/${payment.id}`}>Xem chi tiết thanh toán</Link>}
  </motion.div>;
}

export function MomoPaymentForm({ tripId, memberId, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const returnUrl = `${window.location.origin}/trips/${tripId}/fund`;
      const result = await api(`/trips/${tripId}/contributions/momo/create`, { method: 'POST', body: { amount, member_id: memberId, return_url: returnUrl } });
      setPayment(result);
      toast.success('Đã tạo yêu cầu thanh toán MoMo');
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  };

  const refresh = async () => {
    if (!payment) return;
    try {
      const result = await api(`/payments/${payment.id}/status`);
      setPayment(result);
      if (result.status === 'success') { toast.success('Thanh toán thành công! Đóng góp đã được ghi nhận.'); onSuccess?.(); }
      else if (result.status === 'failed') toast.error('Thanh toán thất bại.');
      else toast(`Trạng thái: ${statusLabels[result.status] || result.status}`);
    } catch (error) { toast.error(error.message); }
  };

  const mockSuccess = async () => {
    if (!payment) return;
    setBusy(true);
    try {
      await markMockPaymentSuccess(payment);
      const updated = await api(`/payments/${payment.id}/status`);
      setPayment(updated);
      if (updated.status === 'success') {
        toast.success('Đã đánh dấu thanh toán thành công!');
        onSuccess?.();
      } else {
        toast(`Trạng thái: ${statusLabels[updated.status] || updated.status}`);
      }
    } catch (error) {
      toast.error(error.message || 'Không thể đánh dấu thành công');
    } finally { setBusy(false); }
  };

  // Reset to create a new payment
  const reset = () => {
    setPayment(null);
    setAmount('');
  };

  // Auto-poll when pending
  useEffect(() => {
    if (!payment || payment.status !== 'pending') return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [payment?.id, payment?.status]);

  return <div className="space-y-4">
    {!payment && <>
      <div>
        <label>Số tiền đóng góp qua MoMo</label>
        <input type="number" min="1000" max="50000000" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Tối thiểu 1.000đ"/>
      </div>
      <button type="button" disabled={busy || Number(amount) < 1000} className="btn w-full bg-[#a50064] text-white shadow-sm hover:bg-[#870052] hover:shadow-md" onClick={create}>
        <Wallet size={18}/>{busy ? 'Đang tạo thanh toán...' : 'Thanh toán với MoMo'}
      </button>
    </>}
    <PaymentStatusCard payment={payment} onRefresh={refresh} onMockSuccess={mockSuccess} onReset={reset}/>
  </div>;
}
