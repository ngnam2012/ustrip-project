import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, MapPin, Plus, Users, WalletCards, Plane, Camera, Share2, Globe, Link2, Lock, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ErrorBox, Loader, Modal } from '../components/ui';
import { useRemote } from '../hooks/useRemote';
import { api, currency, dateText } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { MapView } from '../components/MapView';
import { motion } from 'framer-motion';
import { ShareTripModal } from './SharedTripsPages';

const statIcons = [
  { bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', text: 'text-blue-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', text: 'text-emerald-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', text: 'text-amber-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-violet-50 to-violet-100/50', text: 'text-violet-600', icon: WalletCards },
  { bg: 'bg-gradient-to-br from-slate-50 to-slate-100/50', text: 'text-slate-600', icon: WalletCards },
];

const defaultCovers = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?q=80&w=1200&auto=format&fit=crop'
];

const getCoverUrl = (trip, index) => {
  if (trip?.cover_image_url) return trip.cover_image_url;
  if (index !== undefined) return defaultCovers[index % defaultCovers.length];
  if (trip?.id) {
    const hash = String(trip.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return defaultCovers[hash % defaultCovers.length];
  }
  return defaultCovers[0];
};

const debtTone = {
  danger: { card: 'from-red-50 to-orange-50/60 border-red-100', icon: 'bg-red-100 text-red-600', value: 'text-red-600' },
  success: { card: 'from-emerald-50 to-teal-50/60 border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-600' },
};

function DebtDashboard({ remote }) {
  if (remote.loading) {
    return <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
    </div>;
  }

  if (remote.error) return <div className="mb-8"><ErrorBox message={remote.error} /></div>;
  const debt = remote.data;
  if (!debt) return null;

  const summaryCards = [
    ['Mình nợ quỹ', debt.summary.fund_i_owe, 'danger', WalletCards],
    ['Quỹ nợ mình', debt.summary.fund_owed_to_me, 'success', WalletCards],
    ['Mình nợ người khác', debt.summary.personal_i_owe, 'danger', ArrowUpRight],
    ['Người khác nợ mình', debt.summary.personal_owed_to_me, 'success', ArrowDownLeft],
  ];
  const hasPersonalDebt = debt.personal_by_trip.length > 0;

  return <section className="mb-10" aria-labelledby="debt-dashboard-title">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="page-eyebrow">Sổ công nợ</p>
        <h2 id="debt-dashboard-title" className="mt-1 text-2xl font-extrabold text-ink">Tình hình tài chính của bạn</h2>
      </div>
      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${debt.summary.personal_net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
        Cá nhân ròng: {debt.summary.personal_net >= 0 ? '+' : '−'}{currency(Math.abs(debt.summary.personal_net))}
      </span>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map(([label, value, tone, Icon]) => {
        const styles = debtTone[tone];
        return <div key={label} className={`rounded-2xl border bg-gradient-to-br p-5 ${styles.card}`}>
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${styles.icon}`}><Icon size={19} /></div>
          <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
          <p className={`mt-1 text-xl font-extrabold ${styles.value}`}>{currency(value)}</p>
        </div>;
      })}
    </div>

    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <div className="card border border-slate-100">
        <div className="mb-4 flex items-center gap-2"><WalletCards size={19} className="text-travel" /><h3 className="font-bold">Quỹ theo chuyến</h3></div>
        {!debt.fund_by_trip.length ? <p className="py-6 text-center text-sm text-slate-500">Chưa có chuyến đi nào để tính công nợ quỹ.</p> :
          <div className="space-y-2">{debt.fund_by_trip.map((item) => <Link key={item.trip.id} to={`/trips/${item.trip.id}/fund`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
            <div className="min-w-0"><p className="truncate text-sm font-bold text-ink">{item.trip.name}</p><p className="mt-0.5 text-xs text-slate-500">Đã góp {currency(item.contributed)} · Đã dùng {currency(item.consumed)}</p></div>
            <div className="shrink-0 text-right"><p className={`text-sm font-extrabold ${item.direction === 'i_owe' ? 'text-red-600' : item.direction === 'owed_to_me' ? 'text-emerald-600' : 'text-slate-400'}`}>{item.direction === 'i_owe' ? 'Nợ quỹ ' : item.direction === 'owed_to_me' ? 'Quỹ nợ ' : ''}{item.direction === 'settled' ? 'Cân bằng' : currency(item.amount)}</p><span className="text-[11px] text-slate-400">Xem quỹ →</span></div>
          </Link>)}</div>}
      </div>

      <div className="card border border-slate-100">
        <div className="mb-4 flex items-center gap-2"><Users size={19} className="text-travel" /><h3 className="font-bold">Số ròng theo người</h3></div>
        {!debt.counterparty_net.length ? <p className="py-6 text-center text-sm text-slate-500">Bạn chưa có công nợ cá nhân cần thanh toán.</p> :
          <div className="space-y-2">{debt.counterparty_net.map((item) => <div key={item.profile.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-travel shadow-sm">{item.profile.full_name?.[0]}</div><p className="truncate text-sm font-bold">{item.profile.full_name}</p></div>
            <p className={`shrink-0 text-sm font-extrabold ${item.direction === 'i_owe' ? 'text-red-600' : item.direction === 'owed_to_me' ? 'text-emerald-600' : 'text-slate-400'}`}>{item.direction === 'i_owe' ? 'Bạn nợ ' : item.direction === 'owed_to_me' ? 'Nợ bạn ' : 'Đã cân bằng'}{item.direction === 'settled' ? '' : currency(item.amount)}</p>
          </div>)}</div>}
      </div>
    </div>

    <div className="card mt-5 border border-slate-100">
      <div className="mb-4 flex items-center gap-2"><ReceiptText size={19} className="text-travel" /><h3 className="font-bold">Công nợ cá nhân theo từng chuyến</h3></div>
      {!hasPersonalDebt ? <p className="py-6 text-center text-sm text-slate-500">Tuyệt vời! Không có khoản công nợ cá nhân nào đang mở.</p> :
        <div className="grid gap-3 md:grid-cols-2">{debt.personal_by_trip.map((item, index) => <Link key={`${item.trip.id}-${item.counterparty.id}-${item.direction}-${index}`} to={`/trips/${item.trip.id}/settlements`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
          <div className="min-w-0"><p className="truncate text-sm font-bold">{item.counterparty.full_name}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.trip.name}</p></div>
          <div className="shrink-0 text-right"><p className={`text-sm font-extrabold ${item.direction === 'i_owe' ? 'text-red-600' : 'text-emerald-600'}`}>{item.direction === 'i_owe' ? 'Bạn nợ ' : 'Nợ bạn '}{currency(item.amount)}</p><span className="text-[11px] text-slate-400">Mở chia tiền →</span></div>
        </Link>)}</div>}
    </div>
  </section>;
}

export function TripsPage() {
  const { data, loading, error, reload } = useRemote('/trips');
  const debts = useRemote('/dashboard/debts');
  const [show, setShow] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const trips = Array.isArray(data) ? data : (data?.trips || []);
  const pendingInvitations = Array.isArray(data) ? [] : (data?.pending_invitations || []);

  const respondInvitation = async (tripId, action) => {
    if (respondingId) return;
    setRespondingId(tripId + action);
    try {
      await api(`/trips/${tripId}/members/respond`, {
        method: 'POST',
        body: { action }
      });
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setRespondingId(null);
    }
  };

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
    <DebtDashboard remote={debts} />

    {/* Pending Invitations Section */}
    {pendingInvitations.length > 0 && (
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Lời mời đang chờ ({pendingInvitations.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pendingInvitations.map((trip) => (
            <div key={trip.id} className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-ink">{trip.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin size={14} />{trip.destination}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500 flex items-center gap-1">
                <CalendarDays size={12} />{dateText(trip.start_date)} → {dateText(trip.end_date)}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  disabled={!!respondingId}
                  onClick={() => respondInvitation(trip.id, 'accept')}
                  className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {respondingId === trip.id + 'accept' ? '...' : '✓ Chấp nhận'}
                </button>
                <button
                  disabled={!!respondingId}
                  onClick={() => respondInvitation(trip.id, 'decline')}
                  className="flex-1 rounded-xl border border-red-300 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {respondingId === trip.id + 'decline' ? '...' : '✕ Từ chối'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {!trips.length && !pendingInvitations.length ? (
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
        {trips.map((trip, i) =>
          <motion.div key={trip.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={`/trips/${trip.id}`} className="group block overflow-hidden rounded-2xl bg-white border border-slate-100/80 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-blue-100/60">
              <div className="relative h-44 bg-gradient-to-br from-blue-500 via-blue-400 to-violet-400 bg-cover bg-center overflow-hidden" style={{backgroundImage:`linear-gradient(0deg,rgba(0,0,0,.25),rgba(0,0,0,.02)),url(${getCoverUrl(trip, i)})`}}>
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
    destination: 'Đà Lạt',
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
    if (form.start_date && form.end_date) {
      if (new Date(form.start_date) > new Date(form.end_date)) {
        setError('Ngày bắt đầu không được sau ngày kết thúc.');
        return;
      }
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
            disabled
            value="Đà Lạt"
            className="bg-slate-50"
          />
          <p className="mt-1 text-xs text-slate-400">MVP: Hiện chỉ hỗ trợ Đà Lạt</p>
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
  const { user } = useAuth();
  const { data, loading, error } = useRemote(`/trips/${tripId}/dashboard`);
  const finance = useRemote(`/trips/${tripId}/financial-summary`);
  const [showShare, setShowShare] = useState(false);
  const [visibility, setVisibility] = useState(null);
  
  if (loading || finance.loading) return <Loader/>;
  
  const f = finance.data || {};
  const trip = data?.trip || {};
  const isOwner = trip.created_by === user?.id;
  const currentVisibility = visibility ?? trip.visibility ?? 'private';

  const visibilityBadge = {
    private: { icon: Lock, label: 'Riêng tư', cls: 'bg-slate-500/20 text-slate-200' },
    link: { icon: Link2, label: 'Chia sẻ qua link', cls: 'bg-blue-500/20 text-blue-200' },
    public: { icon: Globe, label: 'Công khai', cls: 'bg-violet-500/20 text-violet-200' },
  }[currentVisibility] || { icon: Lock, label: 'Riêng tư', cls: 'bg-slate-500/20 text-slate-200' };
  const VisIcon = visibilityBadge.icon;
  return <>
    <ErrorBox message={error||finance.error}/>

    {/* Hero */}
    <section className="relative mb-8 min-h-72 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-violet-700 bg-cover bg-center p-8 text-white shadow-lift" style={{backgroundImage:`linear-gradient(90deg,rgba(0,30,80,.88),rgba(80,40,180,.35)),url(${getCoverUrl(trip)})`}}>
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
      
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className="badge bg-white/15 text-white border border-white/10 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
            Chuyến đi sắp tới
          </span>
          {isOwner && (
            <button
              id="share-trip-btn"
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition"
            >
              <Share2 size={13} /> Chia sẻ
            </button>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${visibilityBadge.cls}`}>
            <VisIcon size={11} />{visibilityBadge.label}
          </span>
        </div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{trip.name}</h1>
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

    {/* Map — isolated stacking context so Leaflet z-indices don't bleed above the modal */}
    <div className="mt-8" style={{ isolation: 'isolate' }}>
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
    {showShare && (
      <ShareTripModal
        tripId={tripId}
        currentVisibility={currentVisibility}
        tripData={trip}
        onClose={() => setShowShare(false)}
        onSaved={(v) => setVisibility(v)}
      />
    )}
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
