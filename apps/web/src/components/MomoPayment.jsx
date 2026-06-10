import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { api, currency } from '../lib/api';
import { Link } from 'react-router-dom';

const statusStyle = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200'
};

export function PaymentStatusCard({ payment, onRefresh }) {
  if (!payment) return null;
  const link = payment.deeplink || payment.pay_url;
  return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-5 ${statusStyle[payment.status] || statusStyle.pending}`}>
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider">MoMo payment</p><p className="mt-1 text-xl font-extrabold">{currency(payment.amount)}</p></div><span className="badge bg-white/70">{payment.status}</span></div>
    {payment.status === 'pending' && link && <div className="mt-5 grid gap-5 md:grid-cols-[160px_1fr] md:items-center"><div className="rounded-xl bg-white p-3"><QRCodeSVG value={payment.pay_url || link} size={136}/></div><div><p className="text-sm">Quét QR hoặc mở liên kết MoMo để thanh toán. Trạng thái chỉ được cập nhật từ IPN/backend.</p><div className="mt-4 flex flex-wrap gap-2"><a className="btn-primary" href={link}><ExternalLink size={16}/>Mở MoMo</a><button className="btn-secondary" onClick={onRefresh}><RefreshCw size={16}/>Kiểm tra trạng thái</button></div></div></div>}
    {payment.status === 'success' && <p className="mt-3 font-semibold">Đóng góp đã được ghi nhận tự động vào quỹ chung.</p>}
    {payment.trip_id && payment.id && <Link className="mt-4 inline-block text-sm font-bold underline" to={`/trips/${payment.trip_id}/payments/${payment.id}`}>Xem chi tiết thanh toán</Link>}
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
      setPayment(result); toast.success('Đã tạo yêu cầu thanh toán MoMo');
    } catch (error) { toast.error(error.message); } finally { setBusy(false); }
  };
  const refresh = async () => {
    try {
      const result = await api(`/payments/${payment.id}/status`);
      setPayment(result);
      if (result.status === 'success') { toast.success('Thanh toán thành công'); onSuccess?.(); }
      else toast(`Trạng thái: ${result.status}`);
    } catch (error) { toast.error(error.message); }
  };
  useEffect(() => {
    if (!payment || payment.status !== 'pending') return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [payment?.id, payment?.status]);
  return <div className="space-y-4">
    {!payment && <><div><label>Số tiền đóng góp qua MoMo</label><input type="number" min="1000" max="50000000" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Tối thiểu 1.000đ"/></div><button type="button" disabled={busy || Number(amount) < 1000} className="btn w-full bg-[#a50064] text-white hover:bg-[#870052]" onClick={create}><Wallet size={18}/>{busy ? 'Đang tạo thanh toán...' : 'Thanh toán với MoMo'}</button></>}
    <PaymentStatusCard payment={payment} onRefresh={refresh}/>
  </div>;
}
