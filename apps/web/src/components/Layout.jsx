import { Bell, Bot, CalendarDays, ChartPie, CircleDollarSign, Compass, LogOut, Menu, Plane, Settings, Users, WalletCards, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

const tripItems = [
  ['Tổng quan', '', Compass], ['Lịch trình', 'itinerary', CalendarDays], ['Thành viên', 'members', Users],
  ['Quỹ chung', 'fund', WalletCards], ['Chi tiêu', 'expenses', CircleDollarSign], ['Chia tiền', 'settlements', ChartPie],
  ['Thống kê', 'finance', ChartPie], ['Nhắc thanh toán', 'reminders', Bell], ['Gợi ý AI', 'ai', Bot]
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { tripId } = useParams();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const base = tripId ? `/trips/${tripId}/` : '/';
  return <div className="min-h-screen">
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white p-4 shadow-card transition md:translate-x-0 ${open ? '' : '-translate-x-full'}`}>
      <div className="mb-8 flex items-center justify-between px-2"><Link to="/app" className="flex items-center gap-2 text-xl font-extrabold text-travel"><span className="grid h-10 w-10 place-items-center rounded-xl bg-travel text-white"><Plane size={22}/></span>UsTrip</Link><button className="md:hidden" onClick={() => setOpen(false)}><X/></button></div>
      <nav className="space-y-1">
        <NavLink to="/app" end className={({isActive}) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-blue-50 text-travel' : 'text-slate-600 hover:bg-slate-50'}`}><Plane size={19}/>Chuyến đi của tôi</NavLink>
        {tripId && tripItems.map(([label, path, Icon]) => <NavLink key={label} to={`${base}${path}`} end={!path} className={({isActive}) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-blue-50 text-travel' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={19}/>{label}</NavLink>)}
      </nav>
      <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-slate-50 p-3"><Link to="/profile" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-travel font-bold text-white">{user?.full_name?.[0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{user?.full_name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div><Settings size={17}/></Link><button onClick={logout} className="mt-3 flex w-full items-center gap-2 text-xs font-bold text-slate-500"><LogOut size={15}/>Đăng xuất</button></div>
    </aside>
    <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:left-64 md:px-8"><button className="md:hidden" onClick={() => setOpen(true)}><Menu/></button><div className="hidden text-sm font-semibold text-slate-500 md:block">Đi cùng nhau, rõ từng khoản.</div><Link to="/notifications" className="relative rounded-full p-2 hover:bg-slate-100"><Bell size={21}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-coral"/></Link></header>
    <main className="min-h-screen px-4 pb-12 pt-24 md:ml-64 md:px-8"><AnimatePresence mode="wait"><motion.div key={location.pathname} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:.2}} className="mx-auto max-w-7xl"><Outlet/></motion.div></AnimatePresence></main>
  </div>;
}
