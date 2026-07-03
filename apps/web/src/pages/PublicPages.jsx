import { ArrowRight, CalendarDays, CheckCircle2, ChartPie, CreditCard, Globe, Map, Shield, Sparkles, Users, WalletCards, Zap, Star, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBox } from '../components/ui';
import { Logo, LogoWhite } from '../components/Logo';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.5, ease: 'easeOut' } });
const fadeIn = (delay = 0) => ({ initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: 0.6 } });

const features = [
  { icon: WalletCards, title: 'Quỹ chung minh bạch', desc: 'Mỗi đồng đều rõ ràng. Ai đóng bao nhiêu, quỹ còn bao nhiêu — cập nhật realtime.', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', text: 'text-blue-600' },
  { icon: ChartPie, title: 'Chia chi phí thông minh', desc: 'Ghi nhận ai trả hộ, chia đều cho người liên quan. Không ai bị thiệt, không ai quên.', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { icon: CalendarDays, title: 'Lịch trình theo ngày', desc: 'Sắp xếp hoạt động, đánh dấu địa điểm trên bản đồ. Cả nhóm luôn biết kế hoạch.', color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', text: 'text-violet-600' },
  { icon: CreditCard, title: 'Thanh toán MoMo', desc: 'Đóng góp quỹ chung qua MoMo — nhanh, tiện, tự động ghi nhận.', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', text: 'text-rose-600' },
  { icon: Map, title: 'Bản đồ hành trình', desc: 'Xem tuyến đường và các điểm dừng trên bản đồ OpenStreetMap tương tác.', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', text: 'text-amber-600' },
  { icon: Shield, title: 'Nhắc nhẹ, không ngại', desc: 'Gửi nhắc thanh toán tự động. Giữ hòa khí nhóm, tiền bạc rõ ràng.', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', text: 'text-cyan-600' },
];

const steps = [
  { num: '01', title: 'Tạo chuyến đi', desc: 'Đặt tên, chọn điểm đến, mời bạn bè tham gia nhóm.' },
  { num: '02', title: 'Góp quỹ & chi tiêu', desc: 'Mỗi thành viên đóng góp, ghi nhận chi tiêu rõ ràng.' },
  { num: '03', title: 'Chia tiền & hoàn tất', desc: 'Hệ thống tự tính công nợ, nhắc hoàn tiền cho ai trả hộ.' },
];

const stats = [
  { value: '1,200+', label: 'Chuyến đi đã tạo' },
  { value: '8,500+', label: 'Thành viên tham gia' },
  { value: '2.5 tỷ+', label: 'Số tiền đã quản lý' },
  { value: '99%', label: 'Hài lòng' },
];

export function Landing() {
  const { user } = useAuth(); if (user) return <Navigate to="/app" replace />;
  return <div className="min-h-screen bg-white overflow-hidden">
    {/* Nav */}
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
      <Logo to="/app" size={36} />
      <div className="flex gap-2">
        <Link className="btn-secondary" to="/login">Đăng nhập</Link>
        <Link className="btn-primary" to="/register">Bắt đầu miễn phí</Link>
      </div>
    </nav>

    {/* Hero */}
    <main className="relative mx-auto grid max-w-7xl gap-16 px-5 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-blue-100/40 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-100/30 blur-3xl animate-float-slow" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] rounded-full bg-rose-100/20 blur-3xl animate-float" />

      <div className="relative">
        <motion.div {...fadeUp(0.1)} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-4 py-2 text-sm font-bold text-travel shadow-sm">
          <Sparkles size={14} className="text-amber-500" />Group travel, made clear
        </motion.div>
        <motion.h1 {...fadeUp(0.2)} className="mt-7 text-5xl font-extrabold leading-[1.08] tracking-tight text-ink md:text-6xl lg:text-[3.5rem]">
          Đi cùng nhau.<br/>
          <span className="text-gradient">Rõ từng khoản.</span>
        </motion.h1>
        <motion.p {...fadeUp(0.35)} className="mt-6 max-w-xl text-lg leading-8 text-slate-500">
          Lên lịch trình, quản lý quỹ chung, chia chi phí và nhắc thanh toán — tất cả trong một nơi duy nhất.
        </motion.p>
        <motion.div {...fadeUp(0.5)} className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="btn-coral group">
            Tạo chuyến đi đầu tiên
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link to="/login" className="btn-secondary">Xem tài khoản mẫu</Link>
        </motion.div>
        {/* Trust signals */}
        <motion.div {...fadeUp(0.65)} className="mt-10 flex items-center gap-3">
          <div className="flex -space-x-2">
            {['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'].map((bg, i) =>
              <div key={i} className={`h-8 w-8 rounded-full ${bg} border-2 border-white shadow-sm grid place-items-center text-xs font-bold text-white`}>
                {['T', 'L', 'H', 'M'][i]}
              </div>
            )}
          </div>
          <div className="text-sm text-slate-500">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
            </div>
            <span className="font-semibold text-ink">1,200+</span> nhóm đã sử dụng
          </div>
        </motion.div>
      </div>

      {/* Preview card */}
      <motion.div initial={{ opacity: 0, y: 32, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.4, duration: 0.7, type: 'spring', damping: 20 }} className="relative">
        {/* Floating decoration */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 opacity-20 blur-2xl animate-float" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-500 opacity-20 blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="rounded-[28px] bg-gradient-to-br from-blue-600 via-blue-500 to-violet-600 p-1.5 shadow-lift">
          <div className="rounded-[22px] bg-white p-6 shadow-card">
            <div className="mb-5 flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Chuyến đi sắp tới</p>
                <h3 className="mt-1.5 text-xl font-bold text-ink">Phượt Đà Lạt</h3>
              </div>
              <span className="badge border border-emerald-200 bg-emerald-50 text-emerald-700 h-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
                Đang chuẩn bị
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[[WalletCards,'Quỹ chung','6.000.000đ','from-blue-50 to-blue-100/50'],[ChartPie,'Đã chi','360.000đ','from-emerald-50 to-emerald-100/50'],[Users,'Thành viên','3 người','from-violet-50 to-violet-100/50'],[CheckCircle2,'Hoạt động','2 mục','from-amber-50 to-amber-100/50']].map(([Icon,l,v,gradient],i)=>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className={`rounded-xl bg-gradient-to-br ${gradient} p-4 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5`}
                  key={l}
                >
                  <Icon size={20} className="mb-3 text-travel"/>
                  <p className="text-xs text-slate-500">{l}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{v}</p>
                </motion.div>
              )}
            </div>
            {/* Progress bar */}
            <div className="mt-5 rounded-xl bg-slate-50 p-3">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Tiến trình góp quỹ</span>
                <span className="text-travel">67%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '67%' }}
                  transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </main>

    {/* Features Section */}
    <section className="relative bg-gradient-to-b from-white via-slate-50/80 to-white py-24">
      <div className="mx-auto max-w-7xl px-5">
        <motion.div {...fadeUp()} viewport={{ once: true }} whileInView={{ opacity: 1, y: 0 }} className="text-center">
          <span className="badge bg-blue-50 text-travel border border-blue-200">Tính năng nổi bật</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Mọi thứ bạn cần cho một<br/>
            <span className="text-gradient">chuyến đi hoàn hảo</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-500">UsTrip giúp nhóm bạn quản lý tài chính minh bạch, lên kế hoạch dễ dàng và tập trung vào trải nghiệm.</p>
        </motion.div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover hover:border-blue-100/60"
            >
              <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl ${f.bg} ${f.text} transition-transform duration-300 group-hover:scale-110`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">Cách hoạt động</span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            3 bước đơn giản
          </h2>
        </motion.div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              {/* Connector line */}
              {i < steps.length - 1 && <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-blue-200 to-transparent md:block" />}
              <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-travel to-blue-600 text-2xl font-extrabold text-white shadow-lg shadow-blue-500/20">
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Stats */}
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-violet-700 py-20">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <p className="text-4xl font-extrabold text-white">{stat.value}</p>
            <p className="mt-2 text-sm font-semibold text-blue-100/70">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Sẵn sàng cho chuyến đi tiếp theo?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
            Tạo tài khoản miễn phí và bắt đầu lên kế hoạch cùng nhóm bạn ngay hôm nay.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-coral group text-base px-8 py-4">
              Tạo tài khoản miễn phí
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4">Đăng nhập</Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-slate-100 bg-slate-50/50 py-12">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5">
        <div className="flex items-center gap-6">
          <Logo to="/" size={30} />
          <p className="text-sm text-slate-500">© 2026 UsTrip · Group Travel Hub</p>
        </div>
        <div className="flex items-center gap-6 text-sm font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><Globe size={14} /> Tiếng Việt</span>
          <span>Điều khoản</span>
          <span>Liên hệ</span>
        </div>
      </div>
    </footer>
  </div>;
}

export function AuthPage({ mode }) {
  const isRegister = mode === 'register'; const { user, login, register } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); try { await (isRegister ? register(form) : login(form)); navigate('/app'); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  return <div className="grid min-h-screen bg-white lg:grid-cols-2">
    {/* Left panel */}
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-violet-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
      {/* Floating shapes */}
      <div className="pointer-events-none absolute right-20 top-32 h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-sm animate-float rotate-12" />
      <div className="pointer-events-none absolute left-16 bottom-40 h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm animate-float" style={{ animationDelay: '2s' }} />
      <div className="pointer-events-none absolute right-32 bottom-64 h-10 w-10 rounded-lg bg-amber-400/20 backdrop-blur-sm animate-float" style={{ animationDelay: '1s' }} />

      <LogoWhite size={38} />
      <div className="relative">
        <motion.h2 {...fadeUp(0.2)} className="text-5xl font-extrabold leading-tight">
          Mỗi chuyến đi<br/>là một câu chuyện chung.
        </motion.h2>
        <motion.p {...fadeUp(0.4)} className="mt-5 max-w-md text-blue-100/80">
          Minh bạch chi phí để cả nhóm chỉ cần tập trung vào trải nghiệm.
        </motion.p>
        {/* Feature pills */}
        <motion.div {...fadeUp(0.55)} className="mt-8 flex flex-wrap gap-2">
          {['Quỹ chung', 'Chia chi phí', 'Lịch trình', 'Thanh toán MoMo'].map(f =>
            <span key={f} className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/80 backdrop-blur-sm border border-white/10">
              {f}
            </span>
          )}
        </motion.div>
      </div>
      <p className="text-sm text-blue-200/60">UsTrip · Group Travel Hub</p>
    </div>

    {/* Right panel — form */}
    <div className="flex items-center justify-center p-5">
      <motion.form onSubmit={submit} className="w-full max-w-md" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-10 lg:hidden"><Logo to="/" size={36} /></div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1>
        <p className="mb-8 mt-2 text-slate-500">{isRegister ? 'Bắt đầu tổ chức chuyến đi của bạn.' : 'Đăng nhập để tiếp tục hành trình.'}</p>
        <ErrorBox message={error}/>
        {isRegister && <div className="mb-4">
          <label>Họ và tên</label>
          <input required placeholder="Nguyễn Văn A" value={form.full_name} onChange={(e)=>setForm({...form,full_name:e.target.value})}/>
        </div>}
        <div className="mb-4">
          <label>Email</label>
          <input required type="email" placeholder="email@example.com" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/>
        </div>
        <div className="mb-6">
          <label>Mật khẩu</label>
          <div className="relative">
            <input required minLength={8} type={showPass ? 'text' : 'password'} placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})}/>
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button disabled={busy} className="btn-primary w-full text-base py-3.5">
          {busy ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Đang xử lý...</> : isRegister ? 'Đăng ký' : 'Đăng nhập'}
        </button>
        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
          <Link className="font-bold text-travel transition hover:text-blue-700" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Đăng nhập' : 'Đăng ký'}
          </Link>
        </p>
      </motion.form>
    </div>
  </div>;
}
