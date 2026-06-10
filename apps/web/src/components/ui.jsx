import { X, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { uploadImage } from '../lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function Loader({ label = 'Đang tải dữ liệu...' }) {
  return <div className="grid min-h-52 grid-cols-1 gap-4 md:grid-cols-3">{[0,1,2].map((item)=><div key={item} className="h-36 animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-100 bg-[length:200%_100%] shadow-card"/>) }<span className="sr-only">{label}</span></div>;
}
export function Empty({ title = 'Chưa có dữ liệu', detail = 'Tạo mục đầu tiên để bắt đầu.' }) {
  return <div className="card py-14 text-center"><div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-blue-50" /><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm text-slate-500">{detail}</p></div>;
}
export function ErrorBox({ message }) { return message ? <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{message}</div> : null; }
export function Modal({ title, children, onClose }) {
  return <AnimatePresence><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={onClose}><motion.div initial={{opacity:0,scale:.96,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:20}} transition={{type:'spring',damping:24,stiffness:300}} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X size={20}/></button></div>{children}</motion.div></motion.div></AnimatePresence>;
}
export function StatusBadge({ status }) {
  const styles = { paid: 'bg-emerald-50 text-emerald-700', success: 'bg-emerald-50 text-emerald-700', partial: 'bg-blue-50 text-blue-700', pending: 'bg-amber-50 text-amber-700', unpaid: 'bg-amber-50 text-amber-700', failed: 'bg-red-50 text-red-700', cancelled: 'bg-slate-100 text-slate-600', expired: 'bg-slate-100 text-slate-600', owner: 'bg-blue-50 text-blue-700', member: 'bg-slate-100 text-slate-600' };
  const labels = { paid: 'Đã đóng', success: 'Thành công', partial: 'Một phần', pending: 'Đang chờ', unpaid: 'Chưa đóng', failed: 'Thất bại', cancelled: 'Đã hủy', expired: 'Hết hạn', owner: 'Chủ chuyến', member: 'Thành viên' };
  return <span className={`badge ${styles[status] || styles.member}`}>{labels[status] || status}</span>;
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
  return <div onDragOver={(event)=>{event.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(event)=>{event.preventDefault();setDragging(false);upload(event.dataTransfer.files?.[0])}}>
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-travel transition ${dragging?'scale-[1.01] border-travel bg-blue-100 shadow-lift':'border-blue-300 bg-blue-50'}`}><UploadCloud/><span className="text-sm font-bold">{busy ? 'Đang tải ảnh...' : dragging ? 'Thả ảnh để tải lên' : value ? 'Đổi ảnh hoặc kéo thả ảnh mới' : 'Chọn hoặc kéo thả ảnh để tải lên'}</span><input className="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={(event)=>upload(event.target.files?.[0])}/></label>
    {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
    {value && <a href={value} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50"><img src={value} alt="Ảnh đã tải lên" className="max-h-64 w-full object-contain"/><span className="block p-2 text-center text-xs font-bold text-travel">Mở ảnh kích thước đầy đủ</span></a>}
  </div>;
}
