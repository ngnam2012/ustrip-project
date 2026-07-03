import { Bell, Bot, CalendarDays, ChartPie, CircleDollarSign, Compass, LogOut, Menu, Settings, Users, WalletCards, X, MapPin, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from './Logo';
import { useRemote } from '../hooks/useRemote';

const tripItems = [
  ['Tổng quan', '', Compass], ['Lịch trình', 'itinerary', CalendarDays], ['Thành viên', 'members', Users],
  ['Quỹ chung', 'fund', WalletCards], ['Chi tiêu', 'expenses', CircleDollarSign], ['Chia tiền', 'settlements', ChartPie],
  ['Thống kê', 'finance', ChartPie], ['Nhắc thanh toán', 'reminders', Bell], ['Gợi ý AI', 'ai', Bot],
  ['Gợi ý địa điểm', 'ai-places', MapPin], ['Trò chuyện', 'chat', MessageSquare]
];

function SidebarLink({ to, icon: Icon, label, end }) {
  return <NavLink to={to} end={end} className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-travel shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
    {({ isActive }) => <>
      {isActive && <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-travel" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
      <Icon size={18} className={`transition-colors ${isActive ? 'text-travel' : 'text-slate-400 group-hover:text-slate-600'}`} />
      {label}
    </>}
  </NavLink>;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { tripId } = useParams();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const base = tripId ? `/trips/${tripId}/` : '/';

  // Load trip name when inside a trip
  const { data: tripData } = useRemote(tripId ? `/trips/${tripId}/dashboard` : null);
  const tripName = tripData?.trip?.name;

  return <div className="min-h-screen">
    {/* Sidebar */}
    <aside className={`fixed inset-y-0 left-0 z-40 w-[272px] border-r border-slate-200/80 bg-white/90 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
      <div className="p-5 pb-0 mb-4 flex items-center justify-between">
        <Logo to="/app" size={34} />
        <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 md:hidden" onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 space-y-0.5 pb-4">
        <SidebarLink to="/app" icon={Compass} label="Chuyến đi của tôi" end />
        
        {tripId && <>
          {/* Trip name badge */}
          {tripName && <div className="mx-2 my-3 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 p-3 border border-blue-100/60">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-travel to-blue-600 text-xs font-bold text-white shadow-sm">
                <MapPin size={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-ink">{tripName}</p>
                <p className="text-[10px] text-slate-500">Đang xem chuyến đi</p>
              </div>
            </div>
          </div>}
          
          <div className="mx-4 my-2 h-px bg-slate-100" />
          {tripItems.map(([label, path, Icon]) => (
            <SidebarLink key={label} to={`${base}${path}`} icon={Icon} label={label} end={!path} />
          ))}
        </>}
      </nav>

      {/* User card */}
      <div className="p-5 border-t border-slate-100 bg-white">
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3.5">
          <Link to="/profile" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 text-sm font-bold text-white shadow-md ring-2 ring-white">
                {user?.full_name?.[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink group-hover:text-travel transition-colors">{user?.full_name}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
            <Settings size={16} className="text-slate-400 transition-transform group-hover:rotate-45 duration-300" />
          </Link>
          <button onClick={logout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-xs font-bold text-slate-400 transition-all hover:text-coral hover:bg-red-50">
            <LogOut size={14} />Đăng xuất
          </button>
        </div>
      </div>
    </aside>

    {/* Mobile overlay */}
    <AnimatePresence>
      {open && <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-sm md:hidden"
        onClick={() => setOpen(false)}
      />}
    </AnimatePresence>

    {/* Header */}
    <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl md:left-[272px] md:px-8">
      <button className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 md:hidden" onClick={() => setOpen(true)}>
        <Menu size={20} />
      </button>
      <div className="hidden text-sm font-medium text-slate-400 md:flex md:items-center md:gap-2">
        <span className="text-gradient font-bold">UsTrip</span>
        <span>·</span>
        Đi cùng nhau, rõ từng khoản.
      </div>
      <Link to="/notifications" className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 group">
        <Bell size={20} className="transition-transform group-hover:rotate-12" />
        <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-coral ring-2 ring-white animate-pulse-glow" />
      </Link>
    </header>

    {/* Main content */}
    <main className="min-h-screen px-4 pb-16 pt-24 md:ml-[272px] md:px-8">
      <AnimatePresence mode="wait">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="mx-auto max-w-7xl">
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </main>
  </div>;
}
