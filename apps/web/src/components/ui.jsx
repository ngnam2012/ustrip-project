import { AlertTriangle, Package, UploadCloud, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { uploadImage } from '../lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function Loader({ label = 'Đang tải dữ liệu...', count = 3 }) {
  return <div className="grid min-h-52 grid-cols-1 gap-5 md:grid-cols-3">
    {Array.from({ length: count }).map((_, item) => (
      <div key={item} className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%] border border-slate-100/80 animate-shimmer" style={{ animationDelay: `${item * 150}ms` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-100/50 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <div className="h-3 w-3/4 rounded-full bg-slate-200/60" />
          <div className="h-3 w-1/2 rounded-full bg-slate-200/40" />
        </div>
      </div>
    ))}
    <span className="sr-only">{label}</span>
  </div>;
}

export function Empty({ title = 'Chưa có dữ liệu', detail = 'Tạo mục đầu tiên để bắt đầu.', icon: Icon = Package }) {
  return <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="card py-16 text-center"
  >
    <div className="relative mx-auto mb-5">
      {/* Decorative rings */}
      <div className="absolute inset-0 mx-auto h-20 w-20 rounded-2xl bg-blue-100/50 blur-xl" />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-travel shadow-sm"
      >
        <Icon size={28} />
      </motion.div>
    </div>
    <h3 className="text-lg font-bold text-ink">{title}</h3>
    <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">{detail}</p>
  </motion.div>;
}

export function ErrorBox({ message }) {
  return message ? <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
  >
    <AlertTriangle size={18} className="shrink-0 text-red-500" />
    <span>{message}</span>
  </motion.div> : null;
}

export function Modal({ title, children, onClose }) {
  return <AnimatePresence>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ type: 'spring', damping: 28, stiffness: 350 }} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-modal border border-slate-100" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-travel">
              <Sparkles size={18} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 hover:rotate-90 duration-200">
            <X size={20} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  </AnimatePresence>;
}

export function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    partial: 'bg-blue-50 text-blue-700 border-blue-200/60',
    pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
    unpaid: 'bg-amber-50 text-amber-700 border-amber-200/60',
    failed: 'bg-red-50 text-red-700 border-red-200/60',
    cancelled: 'bg-slate-50 text-slate-600 border-slate-200/60',
    expired: 'bg-slate-50 text-slate-600 border-slate-200/60',
    owner: 'bg-blue-50 text-blue-700 border-blue-200/60',
    member: 'bg-slate-50 text-slate-600 border-slate-200/60'
  };
  const dots = {
    paid: 'bg-emerald-500', success: 'bg-emerald-500', partial: 'bg-blue-500',
    pending: 'bg-amber-500 animate-pulse-glow', unpaid: 'bg-amber-500', failed: 'bg-red-500',
    cancelled: 'bg-slate-400', expired: 'bg-slate-400', owner: 'bg-blue-500', member: 'bg-slate-400'
  };
  const labels = { paid: 'Đã đóng', success: 'Thành công', partial: 'Một phần', pending: 'Đang chờ', unpaid: 'Chưa đóng', failed: 'Thất bại', cancelled: 'Đã hủy', expired: 'Hết hạn', owner: 'Chủ chuyến', member: 'Thành viên' };
  return <span className={`badge border ${styles[status] || styles.member}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.member}`} />
    {labels[status] || status}
  </span>;
}

export function ImageUpload({ type = 'bill', value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true); setError('');
    try { onChange((await uploadImage(file, type)).url); toast.success('Tải ảnh thành công'); } catch (e) { setError(e.message); toast.error(e.message); } finally { setBusy(false); }
  };
  return <div onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); upload(event.dataTransfer.files?.[0]) }}>
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-5 text-travel transition-all duration-300 ${dragging ? 'scale-[1.01] border-travel bg-blue-50 shadow-glow' : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-blue-50/50'}`}>
      <motion.div
        animate={dragging ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-travel shrink-0"
      >
        <UploadCloud size={22} />
      </motion.div>
      <div>
        <span className="text-sm font-bold block">{busy ? 'Đang tải ảnh...' : dragging ? 'Thả ảnh để tải lên' : value ? 'Đổi ảnh hoặc kéo thả ảnh mới' : 'Chọn hoặc kéo thả ảnh để tải lên'}</span>
        <span className="text-xs text-slate-500 mt-0.5 block">JPG, PNG, WebP · Tối đa 10MB</span>
      </div>
      <input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={(event) => upload(event.target.files?.[0])} />
    </label>
    {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
    {value && <a href={value} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all hover:shadow-lift hover:-translate-y-0.5">
      <img src={value} alt="Ảnh đã tải lên" className="max-h-64 w-full object-contain" />
      <span className="block p-2.5 text-center text-xs font-bold text-travel">Mở ảnh kích thước đầy đủ</span>
    </a>}
  </div>;
}
