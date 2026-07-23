import { ArrowRight, CalendarDays, MapPin, Plus, Users, WalletCards, Plane, Camera } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorBox, Loader, Modal } from '../components/ui';
import { useRemote } from '../hooks/useRemote';
import { api, currency, dateText } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MapView } from '../components/MapView';
import { motion } from 'framer-motion';

const statIcons = [
  { bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', text: 'text-blue-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', text: 'text-emerald-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', text: 'text-amber-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-violet-50 to-violet-100/50', text: 'text-violet-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-slate-50 to-slate-100/50', text: 'text-slate-600', icon: WalletCards },
];

export function TripsPage() {
  const { data, loading, error, reload } = useRemote('/trips');
  const [show, setShow] = useState(false);
  
  if (loading) return <Loader/>;
  return <>
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="page-eyebrow">Chuyến đi của tôi</p>
        <h1 className="page-title mt-1">Sẵn sàng cho hành trình mới?</h1>
      </div>
      <button className="btn-coral group" onClick={()=>setShow(true)}>
        <Plus size={18}/>Tạo chuyến đi
      </button>
    </div>
    <ErrorBox message={error}/>
    {!data?.length ? (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card py-20 text-center">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 text-travel shadow-sm"
        >
          <Plane size={36} />
        </motion.div>
        <h3 className="text-xl font-bold text-ink">Chưa có chuyến đi nào</h3>
        <p className="mt-2 text-slate-500 max-w-xs mx-auto">Tạo chuyến đi đầu tiên để bắt đầu quản lý tài chính nhóm.</p>
        <button className="btn-primary mt-6" onClick={() => setShow(true)}><Plus size={18} />Tạo chuyến đi đầu tiên</button>
      </motion.div>
    ) : (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data?.map((trip, i) =>
          <motion.div key={trip.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={`/trips/${trip.id}`} className="group block overflow-hidden rounded-2xl bg-white border border-slate-100/80 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-blue-100/60">
              <div className="relative h-44 bg-gradient-to-br from-blue-500 via-blue-400 to-violet-400 bg-cover bg-center overflow-hidden" style={trip.cover_image_url ? {backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.25),rgba(0,0,0,.02)),url(${trip.cover_image_url})`} : {}}>
                {/* Overlay pattern */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                {/* Decorative shapes */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <div className="pointer-events-none absolute bottom-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <ArrowRight size={20} className="text-white/80" />
                </div>
                {/* Date badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/30 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                  <CalendarDays size={12} />{dateText(trip.start_date)}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-ink group-hover:text-travel transition-colors">{trip.name}</h2>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14}/>{trip.destination}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Users size={14}/>{trip.members?.[0]?.count || 1} thành viên
                  </span>
                  <span className="text-xs font-bold text-travel group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Xem chi tiết <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </div>
    )}
    {show && (
      <TripForm
        onClose={() => setShow(false)}
        onSaved={() => {
          setShow(false);
          reload();
        }}
      />
    )}
  </>;
}

function TripForm({ onClose, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    destination: '',
    start_date: '',
    end_date: '',
    estimated_budget: '',
    description: ''
  });
  const [error, setError] = useState('');
  
  const submit = async (e) => {
    e.preventDefault();
    if (!form.estimated_budget) {
      setError('Vui lòng nhập ngân sách dự kiến (nhập 0 nếu chưa có).');
      return;
    }
    try {
      const trip = await api('/trips', { method: 'POST', body: form });
      onSaved();
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(err.message);
    }
  };
  return <Modal title="Tạo chuyến đi mới" onClose={onClose}>
    <form onSubmit={submit}>
      <ErrorBox message={error}/>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label>Tên chuyến đi</label>
          <input
            required
            placeholder="VD: Phượt Đà Lạt"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label>Điểm đến</label>
          <input
            required
            placeholder="VD: Đà Lạt, Lâm Đồng"
            value={form.destination}
            onChange={e => setForm({ ...form, destination: e.target.value })}
          />
        </div>
        <div>
          <label>Ngày bắt đầu</label>
          <input
            required
            type="date"
            value={form.start_date}
            onChange={e => setForm({ ...form, start_date: e.target.value })}
          />
        </div>
        <div>
          <label>Ngày kết thúc</label>
          <input
            required
            type="date"
            value={form.end_date}
            onChange={e => setForm({ ...form, end_date: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label>Ngân sách dự kiến</label>
          <input
            required
            type="text"
            placeholder="VD: 5,000,000"
            value={form.estimated_budget ? Number(String(form.estimated_budget).replace(/[^0-9]/g, '')).toLocaleString() : ''}
            onChange={e => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              setForm({ ...form, estimated_budget: val });
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <label>Mô tả</label>
          <textarea
            rows="3"
            placeholder="Ghi chú thêm cho chuyến đi..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>
      <button className="btn-primary mt-6 w-full">Tạo chuyến đi</button>
    </form>
  </Modal>;
}

export function TripOverview() {
  const { tripId } = useParams();
  const { data, loading, error } = useRemote(`/trips/${tripId}/dashboard`);
  const finance = useRemote(`/trips/${tripId}/financial-summary`);
  
  if (loading || finance.loading) return <Loader/>;
  
  const f = finance.data || {};
  const trip = data?.trip || {};
  return <>
    <ErrorBox message={error||finance.error}/>

    {/* Hero */}
    <section className="relative mb-8 min-h-72 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-violet-700 bg-cover bg-center p-8 text-white shadow-lift" style={trip.cover_image_url?{backgroundImage:`linear-gradient(90deg,rgba(0,30,80,.88),rgba(80,40,180,.35)),url(${trip.cover_image_url})`}:{}}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="badge bg-white/15 text-white border border-white/10 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
          Chuyến đi sắp tới
        </span>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight">{trip.name}</h1>
        <p className="mt-2.5 flex items-center gap-2 text-blue-100/80"><MapPin size={18}/>{trip.destination}</p>
        <div className="mt-6 flex flex-wrap gap-6 text-sm font-semibold text-blue-100/70">
          <span className="flex items-center gap-2"><CalendarDays size={16} />{dateText(trip.start_date)} - {dateText(trip.end_date)}</span>
          <span className="flex items-center gap-2"><Users size={16} />{trip.members?.[0]?.count || 1} thành viên</span>
        </div>
      </motion.div>
    </section>

    {/* Financial stats */}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {[['Ngân sách dự kiến',f.total_budget],['Quỹ đã thu',f.total_collected],['Chi từ quỹ',f.fund_spent],['Số dư quỹ',f.remaining_fund],['Tổng chi chuyến đi',f.total_spent]].map(([l,v],i)=>
        <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} className="card group relative overflow-hidden" key={l}>
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-30 blur-xl transition-opacity group-hover:opacity-50" style={{ background: ['#2563EB','#10B981','#F59E0B','#7C3AED','#64748B'][i] }} />
          <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${statIcons[i].bg} ${statIcons[i].text}`}><WalletCards size={20}/></div>
          <p className="text-sm text-slate-500">{l}</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">{currency(v)}</p>
        </motion.div>
      )}
    </div>
    <p className="mt-3 text-sm text-slate-400">Số dư quỹ = quỹ đã thu - chi từ quỹ. Khoản thành viên trả hộ vẫn nằm trong tổng chi chuyến đi nhưng không trừ quỹ.</p>

    {/* Map */}
    <div className="mt-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-ink">
        <MapPin size={20} className="text-travel" />Bản đồ hành trình
      </h2>
      <MapView activities={data?.map_activities||data?.upcoming_activities||[]}/>
    </div>

    {/* Activity & Expense panels */}
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      <div className="card">
        <div className="mb-5 flex justify-between items-center">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <CalendarDays size={20} className="text-travel" />Lịch trình sắp tới
          </h2>
          <Link className="text-sm font-bold text-travel transition hover:text-blue-700 flex items-center gap-1" to="itinerary">Xem tất cả <ArrowRight size={14} /></Link>
        </div>
        <div className="space-y-3">
          {data?.upcoming_activities?.length ? data.upcoming_activities.map((a, i) =>
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={a.id} className="flex gap-4 rounded-xl bg-slate-50/80 p-4 transition-all hover:bg-blue-50/40 hover:-translate-y-0.5 hover:shadow-sm">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-travel"><CalendarDays size={18}/></div>
              <div className="min-w-0">
                <p className="font-bold text-ink truncate">{a.title}</p>
                <p className="mt-1 text-xs text-slate-500">{dateText(a.activity_date)} · {a.start_time?.slice(0,5)} · {a.location}</p>
              </div>
            </motion.div>
          ) : <p className="py-8 text-center text-sm text-slate-400">Chưa có hoạt động nào.</p>}
        </div>
      </div>
      <div className="card">
        <div className="mb-5 flex justify-between items-center">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <WalletCards size={20} className="text-emerald-600" />Chi tiêu gần đây
          </h2>
          <Link className="text-sm font-bold text-travel transition hover:text-blue-700 flex items-center gap-1" to="expenses">Xem tất cả <ArrowRight size={14} /></Link>
        </div>
        <div className="space-y-3">
          {f.recent_expenses?.length ? f.recent_expenses.map((e, i) =>
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={e.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-bold text-ink truncate">{e.title}</p>
                <p className="mt-1 text-xs text-slate-500">{e.payment_source==='shared_fund'?'Chi từ quỹ':'Thành viên trả hộ'} · {e.category} · {dateText(e.expense_date)}</p>
              </div>
              <p className="shrink-0 font-bold text-ink">{currency(e.amount)}</p>
            </motion.div>
          ) : <p className="py-8 text-center text-sm text-slate-400">Chưa có khoản chi nào.</p>}
        </div>
      </div>
    </div>
  </>;
}

export function ProfilePage() {
  const { user } = useAuth();
  return <div className="mx-auto max-w-2xl">
    <div className="mb-8">
      <p className="page-eyebrow">Cài đặt</p>
      <h1 className="page-title mt-1">Hồ sơ cá nhân</h1>
    </div>
    <div className="card">
      {/* Avatar section */}
      <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 text-3xl font-bold text-white shadow-lg shadow-blue-500/20">
            {user?.full_name?.[0]}
          </div>
          <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white shadow-md border border-slate-100">
            <Camera size={14} className="text-slate-400" />
          </div>
        </div>
        <div>
          <p className="text-xl font-bold text-ink">{user?.full_name}</p>
          <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
        </div>
      </div>
      <ProfileForm/>
    </div>
  </div>;
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || ''
  });
  const [message, setMessage] = useState('');
  
  const submit = async (e) => {
    e.preventDefault();
    try {
      const updated = await api('/auth/profile', { method: 'PATCH', body: form });
      setUser(updated);
      setMessage('Đã lưu thay đổi.');
    } catch (err) {
      setMessage(err.message);
    }
  };
  return <form onSubmit={submit} className="space-y-4">
    <div>
      <label>Họ và tên</label>
      <input
        placeholder="Nguyễn Văn A"
        value={form.full_name}
        onChange={e => setForm({ ...form, full_name: e.target.value })}
      />
    </div>
    <div>
      <label>Số điện thoại</label>
      <input
        placeholder="0901234567"
        value={form.phone}
        onChange={e => setForm({ ...form, phone: e.target.value })}
      />
    </div>
    <div>
      <label>Avatar URL</label>
      <input
        placeholder="https://..."
        value={form.avatar_url}
        onChange={e => setForm({ ...form, avatar_url: e.target.value })}
      />
    </div>
    {message&&<motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-sm font-semibold text-travel"><span className="h-1.5 w-1.5 rounded-full bg-travel" />{message}</motion.p>}
    <button className="btn-primary">Lưu hồ sơ</button>
  </form>;
}
