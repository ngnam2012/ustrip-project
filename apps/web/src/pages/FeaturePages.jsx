import { Bell, Bot, CalendarDays, Check, CircleDollarSign, MapPin, Plus, Send, Sparkles, Trash2, UserPlus, Users, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Empty, ErrorBox, ImageUpload, Loader, Modal, StatusBadge } from '../components/ui';
import { useRemote } from '../hooks/useRemote';
import { api, currency, dateText } from '../lib/api';
import { LocationSearchInput, MapView } from '../components/MapView';
import { MomoPaymentForm, PaymentStatusCard, markMockPaymentSuccess } from '../components/MomoPayment';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

const categories={food:'Ăn uống',transport:'Di chuyển',hotel:'Khách sạn',ticket:'Vé',shopping:'Mua sắm',other:'Khác'};
const sourceLabels={shared_fund:'Quỹ chung',personal:'Thành viên trả hộ'};
const colors=['#2563EB','#10B981','#F43F5E','#F59E0B','#8B5CF6','#94A3B8'];
const Head=({eyebrow,title,action})=><motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="page-eyebrow">{eyebrow}</p><h1 className="page-title mt-1.5">{title}</h1></div>{action}</motion.div>;

export function ItineraryPage(){
 const {tripId}=useParams();const {data,loading,error,reload}=useRemote(`/trips/${tripId}/activities`);const[show,setShow]=useState(false);
 const groups=useMemo(()=>Object.groupBy?Object.groupBy(data||[],x=>x.activity_date):(data||[]).reduce((r,x)=>({...r,[x.activity_date]:[...(r[x.activity_date]||[]),x]}),{}),[data]);
 if(loading)return <Loader/>;return <><Head eyebrow="Lịch trình" title="Kế hoạch theo ngày" action={<button className="btn-primary" onClick={()=>setShow(true)}><Plus size={18}/>Thêm hoạt động</button>}/><ErrorBox message={error}/>{!data?.length?<Empty title="Chưa có hoạt động" detail="Thêm hoạt động đầu tiên để bắt đầu lên kế hoạch."/>:<div className="space-y-8">{Object.entries(groups).map(([date,items])=><ItineraryDay key={date} date={date} items={items} tripId={tripId}/>)}</div>}{show&&<ActivityForm tripId={tripId} onClose={()=>setShow(false)} onSaved={()=>{setShow(false);reload()}}/>}</>;
}
function ItineraryDay({date,items,tripId}){const[open,setOpen]=useState(true);return <section><button onClick={()=>setOpen(value=>!value)} className="mb-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-bold text-slate-600 transition-all duration-200 hover:bg-blue-50/60 hover:text-travel"><span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-xs font-extrabold text-travel">{items.length}</span>{dateText(date)}</span><span className={`text-slate-400 transition-transform duration-200 ${open?'rotate-90':''}`}>›</span></button><AnimatePresence initial={false}>{open&&<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="relative space-y-3 overflow-hidden border-l-2 border-dashed border-blue-200/60 pl-6">{items.map(item=><Link to={`/trips/${tripId}/activities/${item.id}`} key={item.id} className="card relative block border-l-4 border-l-travel/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-l-travel"><span className="absolute -left-[32px] top-6 h-3 w-3 rounded-full bg-travel ring-4 ring-blue-50 shadow-sm"/><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-ink">{item.title}</h3><p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14}/>{item.location||'Chưa đặt địa điểm'}</p></div><div className="text-right"><p className="font-bold text-travel">{item.start_time?.slice(0,5)} - {item.end_time?.slice(0,5)}</p><p className="mt-1 text-xs text-slate-400">{currency(item.estimated_cost)}</p></div></div></Link>)}</motion.div>}</AnimatePresence></section>}
function ActivityForm({tripId,onClose,onSaved}){const[f,setF]=useState({title:'',activity_date:'',start_time:'',end_time:'',location:'',location_name:'',address:'',latitude:null,longitude:null,map_provider:'openstreetmap',estimated_cost:0,notes:''});const[e,setE]=useState('');const submit=async(x)=>{x.preventDefault();try{await api(`/trips/${tripId}/activities`,{method:'POST',body:f});toast.success('Đã thêm hoạt động');onSaved()}catch(err){setE(err.message);toast.error(err.message)}};return <Modal title="Thêm hoạt động" onClose={onClose}><form onSubmit={submit}><ErrorBox message={e}/><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label>Tên hoạt động</label><input required value={f.title} onChange={x=>setF({...f,title:x.target.value})}/></div><div><label>Ngày</label><input required type="date" value={f.activity_date} onChange={x=>setF({...f,activity_date:x.target.value})}/></div><div><label>Bắt đầu</label><input type="time" value={f.start_time} onChange={x=>setF({...f,start_time:x.target.value})}/></div><div className="sm:col-span-2"><label>Tìm địa điểm</label><LocationSearchInput value={f.location} onChange={value=>setF({...f,location:value})} onSelect={place=>setF({...f,...place})}/></div><div className="sm:col-span-2"><MapView activities={f.latitude?[{...f,id:'selected',title:f.title||'Địa điểm đã chọn'}]:[]} selected={f} onPick={point=>setF({...f,...point,map_provider:'openstreetmap'})} height={240}/><p className="mt-2 text-xs text-slate-500">Có thể tìm kiếm hoặc bấm trực tiếp lên bản đồ để chọn tọa độ.</p></div><div><label>Kết thúc</label><input type="time" value={f.end_time} onChange={x=>setF({...f,end_time:x.target.value})}/></div><div><label>Chi phí dự kiến</label><input type="number" min="0" value={f.estimated_cost} onChange={x=>setF({...f,estimated_cost:x.target.value})}/></div></div><button className="btn-primary mt-6 w-full">Lưu hoạt động</button></form></Modal>}

export function MembersPage(){const{tripId}=useParams();const{data,loading,error,reload}=useRemote(`/trips/${tripId}/members`);const[show,setShow]=useState(false);const[momo,setMomo]=useState(false);if(loading)return <Loader/>;return <><Head eyebrow="Nhóm đồng hành" title={`${data?.length||0} thành viên`} action={<div className="flex gap-2"><button onClick={()=>setMomo(true)} className="btn bg-[#a50064] text-white shadow-sm hover:bg-[#870052] hover:shadow-md">Đóng góp MoMo</button><button onClick={()=>setShow(true)} className="btn-primary"><UserPlus size={18}/>Mời thành viên</button></div>}/><ErrorBox message={error}/><div className="table-wrap"><table className="table"><thead><tr><th>Thành viên</th><th>Vai trò</th><th>Trạng thái</th><th>Đã đóng</th><th>Còn thiếu</th></tr></thead><tbody>{data?.map(m=><tr key={m.id}><td><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">{m.profile.full_name[0]}</div><div><p className="font-bold text-ink">{m.profile.full_name}</p><p className="text-xs text-slate-500">{m.profile.email}</p></div></div></td><td><StatusBadge status={m.role}/></td><td><StatusBadge status={m.contribution_status}/></td><td className="font-semibold text-ink">{currency(m.paid_amount)}</td><td className="font-semibold text-coral">{currency(m.remaining_amount)}</td></tr>)}</tbody></table></div>{show&&<Invite tripId={tripId} onClose={()=>setShow(false)} onSaved={()=>{setShow(false);reload()}}/>}{momo&&<Modal title="Đóng góp qua MoMo" onClose={()=>setMomo(false)}><MomoPaymentForm tripId={tripId} onSuccess={reload}/></Modal>}</>}
function Invite({tripId,onClose,onSaved}){const[email,setEmail]=useState('');const[error,setError]=useState('');return <Modal title="Mời thành viên" onClose={onClose}><form onSubmit={async e=>{e.preventDefault();try{await api(`/trips/${tripId}/members`,{method:'POST',body:{email}});onSaved()}catch(x){setError(x.message)}}}><ErrorBox message={error}/><label>Email tài khoản UsTrip</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/><button className="btn-primary mt-6 w-full"><UserPlus size={18}/>Thêm vào chuyến đi</button></form></Modal>}

export function FundPage(){const{tripId}=useParams();const[searchParams,setSearchParams]=useSearchParams();const fund=useRemote(`/trips/${tripId}/fund`);const cons=useRemote(`/trips/${tripId}/contributions`);const members=useRemote(`/trips/${tripId}/members`);const[show,setShow]=useState(false);const[momo,setMomo]=useState(false);const[redirectPayment,setRedirectPayment]=useState(null);useEffect(()=>{const paymentId=searchParams.get('paymentId');const status=searchParams.get('status');if(paymentId){api(`/payments/${paymentId}/status`).then(p=>{setRedirectPayment(p);if(status==='success'){toast.success('Thanh toán MoMo thành công! Đóng góp đã được ghi nhận.');fund.reload();cons.reload()}else if(status==='failed')toast.error('Thanh toán MoMo thất bại.');else toast('Đã quay lại từ MoMo. Kiểm tra trạng thái bên dưới.')}).catch(()=>toast.error('Không thể tải thông tin thanh toán.'));setSearchParams({},{replace:true})}},[]);const refreshRedirectPayment=async()=>{if(!redirectPayment)return;try{const p=await api(`/payments/${redirectPayment.id}/status`);setRedirectPayment(p);if(p.status==='success'){toast.success('Thanh toán thành công!');fund.reload();cons.reload()}else toast(`Trạng thái: ${p.status}`)}catch(e){toast.error(e.message)}};if(fund.loading||cons.loading)return <Loader/>;const f=fund.data||{};const percent=Math.min(100,(f.total_collected/Math.max(f.target_amount,1))*100);const reload=()=>{fund.reload();cons.reload();members.reload()};return <><Head eyebrow="Quỹ chung" title="Tiền nhóm đã góp và đã dùng" action={<div className="flex gap-2"><button onClick={()=>setMomo(true)} className="btn bg-[#a50064] text-white shadow-sm hover:bg-[#870052] hover:shadow-md">Thanh toán MoMo</button><button onClick={()=>setShow(true)} className="btn-primary"><Plus size={18}/>Đóng góp thủ công</button></div>}/>{redirectPayment&&<div className="mb-6"><PaymentStatusCard payment={redirectPayment} onRefresh={refreshRedirectPayment}/></div>}<section className="card mb-6 border border-amber-200"><div className="flex flex-wrap justify-between gap-5"><div><p className="text-sm text-slate-500">Số dư quỹ có thể sử dụng</p><p className="mt-1 text-3xl font-extrabold text-travel">{currency(f.current_balance)}</p></div><div className="grid grid-cols-2 gap-6 text-right text-sm md:grid-cols-4"><div><p className="text-slate-500">Mục tiêu góp</p><b>{currency(f.target_amount)}</b></div><div><p className="text-slate-500">Quỹ đã thu</p><b className="text-emerald-600">{currency(f.total_collected)}</b></div><div><p className="text-slate-500">Đã chi từ quỹ</p><b className="text-coral">{currency(f.fund_spent)}</b></div><div><p className="text-slate-500">Thành viên trả hộ</p><b className="text-blue-600">{currency(f.personal_spent)}</b></div></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{width:0}} animate={{width:`${percent}%`}} transition={{duration:1,ease:'easeOut'}} className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm"/></div><p className="mt-2 text-xs font-semibold text-slate-500">Đã đạt {percent.toFixed(0)}% mục tiêu góp. Khoản thành viên trả hộ không trừ số dư quỹ.</p></section><div className="table-wrap"><table className="table"><thead><tr><th>Người đóng</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Minh chứng</th></tr></thead><tbody>{cons.data?.map(c=><tr key={c.id}><td className="font-bold">{c.profile.full_name}</td><td className="font-bold text-emerald-600">{currency(c.amount)}</td><td>{c.payment_method==='momo'?'MoMo':'Thủ công'}</td><td><StatusBadge status={c.payment_status}/>{c.payment_method==='momo'&&c.payment_status==='pending'&&c.payment_id&&<Link to={`/trips/${tripId}/payments/${c.payment_id}`} className="ml-3 block text-xs font-bold text-travel underline hover:text-blue-700">Thanh toán tiếp</Link>}</td><td>{c.payment_proof_url?<a href={c.payment_proof_url} target="_blank" rel="noreferrer"><img src={c.payment_proof_url} alt="Minh chứng thanh toán" className="h-14 w-20 rounded-lg border border-slate-200 object-cover"/></a>:<span className="text-slate-400">—</span>}</td></tr>)}</tbody></table></div>{show&&<ContributionForm tripId={tripId} members={members.data||[]} onClose={()=>setShow(false)} onSaved={()=>{setShow(false);reload()}}/>}{momo&&<Modal title="Đóng góp qua MoMo" onClose={()=>setMomo(false)}><MomoPaymentForm tripId={tripId} onSuccess={reload}/></Modal>}</>}
function ContributionForm({tripId,members,onClose,onSaved}){const[f,setF]=useState({user_id:members[0]?.user_id||'',amount:'',note:'',payment_proof_url:''});const[e,setE]=useState('');return <Modal title="Thêm đóng góp" onClose={onClose}><form onSubmit={async x=>{x.preventDefault();try{await api(`/trips/${tripId}/contributions`,{method:'POST',body:f});onSaved()}catch(err){setE(err.message)}}}><ErrorBox message={e}/><div className="space-y-4"><div><label>Thành viên</label><select value={f.user_id} onChange={x=>setF({...f,user_id:x.target.value})}>{members.map(m=><option key={m.user_id} value={m.user_id}>{m.profile.full_name}</option>)}</select></div><div><label>Số tiền</label><input required min="1" type="number" value={f.amount} onChange={x=>setF({...f,amount:x.target.value})}/></div><ImageUpload type="payment-proof" value={f.payment_proof_url} onChange={url=>setF({...f,payment_proof_url:url})}/><div><label>Ghi chú</label><input value={f.note} onChange={x=>setF({...f,note:x.target.value})}/></div></div><button className="btn-primary mt-6 w-full">Xác nhận đóng góp</button></form></Modal>}

export function ExpensesPage(){const{tripId}=useParams();const{data,loading,error,reload}=useRemote(`/trips/${tripId}/expenses`);const members=useRemote(`/trips/${tripId}/members`);const[show,setShow]=useState(false);if(loading)return <Loader/>;return <><Head eyebrow="Chi tiêu" title="Chi từ quỹ và khoản thành viên trả hộ" action={<button onClick={()=>setShow(true)} className="btn-coral"><Plus size={18}/>Thêm chi tiêu</button>}/><ErrorBox message={error}/>{!data?.length?<Empty/>:<div className="table-wrap"><table className="table"><thead><tr><th>Khoản chi</th><th>Nguồn tiền</th><th>Người trả hộ</th><th>Ngày</th><th className="text-right">Số tiền</th></tr></thead><tbody>{data.map(e=><tr key={e.id}><td><Link className="font-bold hover:text-travel" to={`/trips/${tripId}/expenses/${e.id}`}>{e.title}</Link><p className="mt-1 text-xs text-slate-500">{categories[e.category]}</p></td><td><span className={`badge ${e.payment_source==='shared_fund'?'bg-emerald-50 text-emerald-700':'bg-blue-50 text-travel'}`}>{sourceLabels[e.payment_source]}</span></td><td>{e.payment_source==='shared_fund'?<span className="text-slate-400">Không áp dụng</span>:e.payer?.full_name}</td><td>{dateText(e.expense_date)}</td><td className="text-right font-extrabold">{currency(e.amount)}</td></tr>)}</tbody></table></div>}{show&&<ExpenseForm tripId={tripId} members={members.data||[]} onClose={()=>setShow(false)} onSaved={()=>{setShow(false);reload()}}/>}</>}
function ExpenseForm({tripId,members,onClose,onSaved}){const[f,setF]=useState({title:'',amount:'',category:'food',payment_source:'personal',paid_by:members[0]?.user_id||'',expense_date:new Date().toISOString().slice(0,10),participants:[],bill_image_url:'',note:''});const[e,setE]=useState('');const toggleParticipant=userId=>setF(value=>({...value,participants:value.participants.includes(userId)?value.participants.filter(id=>id!==userId):[...value.participants,userId]}));return <Modal title="Thêm chi tiêu" onClose={onClose}><form onSubmit={async x=>{x.preventDefault();try{await api(`/trips/${tripId}/expenses`,{method:'POST',body:f});toast.success(f.payment_source==='shared_fund'?'Đã ghi chi từ quỹ chung':'Đã ghi khoản thành viên trả hộ');onSaved()}catch(err){setE(err.message)}}}><ErrorBox message={e}/><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label>Nguồn thanh toán</label><select value={f.payment_source} onChange={x=>setF({...f,payment_source:x.target.value})}><option value="personal">Thành viên trả hộ · tạo công nợ cho người được chọn</option><option value="shared_fund">Quỹ chung · trừ trực tiếp số dư, không tạo công nợ</option></select><p className="mt-2 text-xs text-slate-500">{f.payment_source==='shared_fund'?'Chỉ chủ chuyến được ghi nhận và số tiền không được vượt số dư quỹ.':'Chọn chính xác những người mà thành viên này đã thanh toán cho.'}</p></div><div className="sm:col-span-2"><label>Tên khoản chi</label><input required value={f.title} onChange={x=>setF({...f,title:x.target.value})}/></div><div><label>Số tiền</label><input required min="1" type="number" value={f.amount} onChange={x=>setF({...f,amount:x.target.value})}/></div><div><label>Danh mục</label><select value={f.category} onChange={x=>setF({...f,category:x.target.value})}>{Object.entries(categories).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>{f.payment_source==='personal'&&<><div><label>Người trả hộ</label><select value={f.paid_by} onChange={x=>setF({...f,paid_by:x.target.value})}>{members.map(m=><option value={m.user_id} key={m.user_id}>{m.profile.full_name}</option>)}</select></div><div className="sm:col-span-2"><label>Người được trả hộ ({f.participants.length} đã chọn)</label><div className="mt-2 grid gap-2 sm:grid-cols-2">{members.map(m=><label key={m.user_id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${f.participants.includes(m.user_id)?'border-travel bg-blue-50':'border-slate-200'}`}><input className="h-4 w-4 shrink-0 p-0 accent-blue-600" type="checkbox" checked={f.participants.includes(m.user_id)} onChange={()=>toggleParticipant(m.user_id)}/><span className="font-semibold">{m.profile.full_name}</span></label>)}</div><p className="mt-2 text-xs text-slate-500">Khi chia tiền, số tiền chỉ được chia đều cho những người đã tick. Tick cả người trả hộ nếu họ cũng sử dụng khoản chi.</p></div></>}<div><label>Ngày chi</label><input type="date" value={f.expense_date} onChange={x=>setF({...f,expense_date:x.target.value})}/></div><div className="sm:col-span-2"><ImageUpload value={f.bill_image_url} onChange={url=>setF({...f,bill_image_url:url})}/></div></div><button className="btn-primary mt-5 w-full">{f.payment_source==='shared_fund'?'Ghi chi từ quỹ chung':`Lưu khoản trả hộ cho ${f.participants.length} người`}</button></form></Modal>}

export function SettlementsPage(){const{tripId}=useParams();const{data,loading,error,reload}=useRemote(`/trips/${tripId}/settlements`);if(loading)return <Loader/>;return <><Head eyebrow="Công nợ cá nhân" title="Hoàn tiền cho thành viên trả hộ"/><p className="mb-5 text-sm text-slate-500">Chỉ khoản chi do thành viên trả hộ mới xuất hiện ở đây. Chi từ quỹ chung không tạo công nợ.</p><ErrorBox message={error}/><div className="space-y-3">{data?.map(s=><div className="card flex flex-wrap items-center justify-between gap-4" key={s.id}><div className="flex items-center gap-4"><div className={`grid h-11 w-11 place-items-center rounded-xl ${s.is_settled?'bg-emerald-50 text-emerald-600':'bg-red-50 text-coral'}`}>{s.is_settled?<Check/>:<CircleDollarSign/>}</div><div><p className="font-bold">{s.profile.full_name} → {s.owed_to.full_name}</p><p className="mt-1 text-xs text-slate-500">{s.expense_title}</p></div></div><div className="flex items-center gap-4"><b>{currency(s.amount_owed)}</b><button disabled={s.is_settled} className="btn-secondary" onClick={async()=>{await api(`/splits/${s.id}/settled`,{method:'PATCH',body:{is_settled:true}});reload()}}>{s.is_settled?'Đã hoàn tiền':'Đánh dấu đã hoàn'}</button></div></div>)}</div></>}

export function FinancePage(){const{tripId}=useParams();const{data,loading,error}=useRemote(`/trips/${tripId}/financial-summary`);if(loading)return <Loader/>;const chart=Object.entries(data?.by_category||{}).map(([name,value])=>({name:categories[name],value}));return <><Head eyebrow="Thống kê tài chính" title="Tách rõ quỹ chung và tiền cá nhân"/><ErrorBox message={error}/><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">{[['Quỹ đã thu',data.total_collected],['Chi từ quỹ',data.fund_spent],['Số dư quỹ',data.remaining_fund],['Thành viên trả hộ',data.personal_spent],['Tổng chi chuyến đi',data.total_spent]].map(([l,v])=><div className="card" key={l}><p className="text-sm text-slate-500">{l}</p><p className="mt-2 text-2xl font-extrabold">{currency(v)}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div className="card h-96 border border-slate-100"><h2 className="font-bold">Tổng chi theo danh mục</h2><ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={chart} dataKey="value" nameKey="name" innerRadius={70} outerRadius={115}>{chart.map((_,i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip formatter={currency}/></PieChart></ResponsiveContainer></div><div className="card"><h2 className="mb-5 font-bold">Thành viên chưa hoàn tất đóng góp quỹ</h2><div className="space-y-4">{data.unpaid_members?.map(m=><div className="flex items-center justify-between border-b border-slate-100 pb-4" key={m.id}><div><p className="font-bold">{m.profile.full_name}</p><StatusBadge status={m.contribution_status}/></div><b className="text-coral">{currency(m.remaining_amount)}</b></div>)}</div></div></div></>}

export function RemindersPage(){const{tripId}=useParams();const members=useRemote(`/trips/${tripId}/members`);const reminders=useRemote(`/trips/${tripId}/reminders`);const send=async m=>{await api(`/trips/${tripId}/reminders`,{method:'POST',body:{recipient_id:m.user_id,message:`Nhắc ${m.profile.full_name} hoàn tất khoản đóng góp ${currency(m.remaining_amount)}.`}});reminders.reload()};if(members.loading)return <Loader/>;return <><Head eyebrow="Nhắc thanh toán" title="Nhắc nhẹ, không ngại tiền bạc"/><div className="grid gap-4 md:grid-cols-2">{members.data?.filter(m=>m.contribution_status!=='paid').map(m=><div className="card flex items-center justify-between gap-4" key={m.id}><div><p className="font-bold">{m.profile.full_name}</p><p className="mt-1 text-sm text-coral">Còn thiếu {currency(m.remaining_amount)}</p></div><button className="btn-primary" onClick={()=>send(m)}><Send size={16}/>Gửi nhắc</button></div>)}</div><h2 className="mb-4 mt-8 text-lg font-bold">Lịch sử nhắc</h2><div className="space-y-3">{reminders.data?.map(r=><div className="card" key={r.id}><p className="font-bold">{r.recipient.full_name}</p><p className="mt-1 text-sm text-slate-500">{r.message} · {dateText(r.sent_at)}</p></div>)}</div></>}

export function NotificationsPage(){const{data,loading,error,reload}=useRemote('/notifications');if(loading)return <Loader/>;return <><Head eyebrow="Thông báo" title="Cập nhật mới nhất"/><ErrorBox message={error}/><div className="space-y-3">{data?.map(n=><button onClick={async()=>{await api(`/notifications/${n.id}/read`,{method:'PATCH'});reload()}} key={n.id} className={`card flex w-full gap-4 text-left ${n.is_read?'opacity-60':'border-l-4 border-l-travel'}`}><div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-travel"><Bell/></div><div><p className="font-bold">{n.title}</p><p className="mt-1 text-sm text-slate-500">{n.message}</p></div></button>)}</div></>}

export function AiPage(){
  const {tripId}=useParams(); const {data:tripData}=useRemote(`/trips/${tripId}`);
  const navigate=useNavigate();
  const [f,setF]=useState({destination:'Đà Lạt',days:4,budget:'12.000.000đ',style:'Khám phá & ẩm thực',group:6});
  const [shown,setShown]=useState(false); const [busy,setBusy]=useState(false); const [result,setResult]=useState(null); const [error,setError]=useState('');
  
  const generate = async (e) => {
    e.preventDefault(); setShown(true); setBusy(true); setError(''); setResult(null);
    try {
      const res = await api(`/trips/${tripId}/ai/itinerary`, { method: 'POST', body: f });
      setResult(res.itinerary);
    } catch(err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addToItinerary = async () => {
    if (!result || !tripData?.start_date) return;
    setBusy(true);
    try {
      const startDate = new Date(tripData.start_date);
      for (const day of result) {
        const activityDate = new Date(startDate);
        activityDate.setDate(startDate.getDate() + (day.day - 1));
        const dateString = activityDate.toISOString().split('T')[0];
        
        for (const act of day.activities) {
          await api(`/trips/${tripId}/activities`, {
            method: 'POST',
            body: {
              title: act.title,
              activity_date: dateString,
              start_time: act.time || '09:00',
              end_time: '12:00',
              location: act.location,
              latitude: act.latitude,
              longitude: act.longitude,
              description: act.description
            }
          });
        }
      }
      toast.success('Đã thêm vào lịch trình!');
      navigate(`/trips/${tripId}/itinerary`);
    } catch(err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return <><Head eyebrow="AI itinerary" title="Gợi ý lịch trình thông minh"/><div className="grid gap-6 lg:grid-cols-2"><form className="card space-y-4" onSubmit={generate}><div><label>Điểm đến</label><input required value={f.destination} onChange={e=>setF({...f,destination:e.target.value})}/></div><div className="grid grid-cols-2 gap-4"><div><label>Số ngày</label><input required type="number" min="1" max="14" value={f.days} onChange={e=>setF({...f,days:e.target.value})}/></div><div><label>Quy mô nhóm</label><input required type="number" min="1" value={f.group} onChange={e=>setF({...f,group:e.target.value})}/></div></div><div><label>Ngân sách</label><input required value={f.budget} onChange={e=>setF({...f,budget:e.target.value})}/></div><div><label>Phong cách</label><input required value={f.style} onChange={e=>setF({...f,style:e.target.value})}/></div><button disabled={busy} className="btn-primary w-full"><Sparkles size={18}/>{busy ? 'Đang tạo gợi ý...' : 'Tạo gợi ý thông minh'}</button></form><div className="card border border-blue-100 bg-gradient-to-br from-white to-blue-50">
    {shown ? (
      busy && !result ? (
        <div className="grid h-full min-h-72 place-items-center text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            <Sparkles className="text-travel" size={40} />
          </motion.div>
          <p className="mt-4 font-bold text-ink animate-pulse">AI đang thiết kế lịch trình cho bạn...</p>
        </div>
      ) : error ? (
        <ErrorBox message={error} />
      ) : result ? (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>
          <span className="badge bg-blue-100 text-travel"><Bot size={14} className="mr-1"/>Đã tạo thành công</span>
          <h2 className="mt-5 text-xl font-extrabold">{f.days} ngày khám phá {f.destination}</h2>
          <div className="mt-5 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {result.map((d, i) => (
              <div className="rounded-xl bg-white p-4 shadow-card" key={i}>
                <p className="font-bold text-travel mb-2">Ngày {d.day}: {d.title}</p>
                <div className="space-y-3">
                  {d.activities.map((a, j) => (
                    <div key={j} className="text-sm border-l-2 border-blue-100 pl-3">
                      <p className="font-semibold text-ink">{a.time} - {a.title}</p>
                      {a.location && <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><MapPin size={12}/>{a.location}</p>}
                      {a.description && <p className="text-slate-500 text-xs mt-0.5">{a.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={addToItinerary} disabled={busy} className="btn-primary w-full mt-5"><Plus size={18}/>Thêm vào lịch trình</button>
        </motion.div>
      ) : null
    ) : (
      <div className="grid h-full min-h-72 place-items-center text-center text-slate-500"><div><Bot className="mx-auto mb-3 text-travel" size={44}/><p className="font-bold">Điền thông tin để xem gợi ý mẫu</p><p className="mt-1 text-sm">Hệ thống sử dụng AI Gemini 3.5 Flash</p></div></div>
    )}
  </div></div></>}

export function ActivityDetailPage(){const{tripId,activityId}=useParams();const navigate=useNavigate();const{data,loading,error,reload}=useRemote(`/activities/${activityId}`);if(loading)return <Loader/>;return <><Head eyebrow="Chi tiết hoạt động" title={data?.title} action={<button className="btn-coral" onClick={async()=>{if(confirm('Xóa hoạt động này?')){await api(`/activities/${activityId}`,{method:'DELETE'});navigate(`/trips/${tripId}/itinerary`)}}}><Trash2 size={17}/>Xóa</button>}/><ErrorBox message={error}/><div className="grid gap-6 lg:grid-cols-3"><section className="card lg:col-span-2"><h2 className="mb-4 text-lg font-bold">Thông tin hoạt động</h2><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase text-slate-400">Ngày & giờ</p><p className="mt-2 font-semibold">{dateText(data.activity_date)} · {data.start_time?.slice(0,5)} - {data.end_time?.slice(0,5)}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Địa điểm</p><p className="mt-2 font-semibold">{data.address||data.location||'Chưa cập nhật'}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Chi phí dự kiến</p><p className="mt-2 font-semibold text-travel">{currency(data.estimated_cost)}</p></div><div><p className="text-xs font-bold uppercase text-slate-400">Ghi chú</p><p className="mt-2 font-semibold">{data.notes||'Không có'}</p></div></div></section><section className="card"><h2 className="mb-4 font-bold">Người tham gia</h2>{data.participants?.map(p=><p className="mb-2 rounded-xl bg-slate-50 p-3 font-semibold" key={p.user_id}>{p.profile.full_name}</p>)}</section></div><div className="mt-6"><MapView activities={[data]} selected={data}/></div></>}

export function PaymentDetailPage(){const{paymentId}=useParams();const{data,loading,reload}=useRemote(`/payments/${paymentId}/status`);const mockSuccess=async()=>{if(!data)return;try{await markMockPaymentSuccess(data);await reload();toast.success('Đã đánh dấu thanh toán thành công!')}catch(e){toast.error(e.message||'Không thể đánh dấu thành công')}};if(loading)return <Loader/>;return <><Head eyebrow="Thanh toán MoMo" title="Chi tiết thanh toán"/><PaymentStatusCard payment={data} onRefresh={reload} onMockSuccess={mockSuccess}/></>}

export function ExpenseDetailPage(){const{tripId,expenseId}=useParams();const navigate=useNavigate();const{data,loading,error,reload}=useRemote(`/expenses/${expenseId}`);if(loading)return <Loader/>;const personal=data.payment_source==='personal';return <><Head eyebrow="Chi tiết chi tiêu" title={data?.title} action={<div className="flex gap-2">{personal&&<button className="btn-primary" onClick={async()=>{await api(`/expenses/${expenseId}/split`,{method:'POST',body:{}});reload()}}><Users size={17}/>Chia đều cho người đã chọn</button>}<button className="btn-coral" onClick={async()=>{if(confirm('Xóa khoản chi này?')){await api(`/expenses/${expenseId}`,{method:'DELETE'});navigate(`/trips/${tripId}/expenses`)}}}><Trash2 size={17}/>Xóa</button></div>}/><ErrorBox message={error}/><div className="grid gap-6 lg:grid-cols-3"><section className="card lg:col-span-2"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className={`badge ${personal?'bg-blue-50 text-travel':'bg-emerald-50 text-emerald-700'}`}>{sourceLabels[data.payment_source]}</span><p className="mt-4 text-sm text-slate-500">{personal?'Người trả hộ:':'Nguồn thanh toán:'} <b className="text-ink">{personal?data.payer?.full_name:'Quỹ chung của chuyến đi'}</b></p><p className="mt-1 text-sm text-slate-500">{dateText(data.expense_date)}</p></div><p className="text-3xl font-extrabold text-travel">{currency(data.amount)}</p></div>{personal&&<div className="mt-5"><p className="text-sm font-bold">Đã thanh toán cho:</p><div className="mt-2 flex flex-wrap gap-2">{data.participants?.map(p=><span className="badge bg-blue-50 text-travel" key={p.user_id}>{p.profile.full_name}</span>)}</div></div>}{data.note&&<p className="mt-5 rounded-xl bg-slate-50 p-4">{data.note}</p>}{data.bill_image_url&&<img src={data.bill_image_url} alt="Hóa đơn" className="mt-5 max-h-96 w-full rounded-xl object-contain bg-slate-50"/>}</section><section className="card"><h2 className="mb-4 font-bold">{personal?'Hoàn tiền cho người trả hộ':'Tác động đến quỹ'}</h2>{personal?(data.splits?.length?data.splits.map(s=><div className="mb-3 flex justify-between border-b border-slate-100 pb-3" key={s.id}><div><p className="font-semibold">{s.profile.full_name}</p><StatusBadge status={s.is_settled?'paid':'unpaid'}/></div><b>{currency(s.amount_owed)}</b></div>):<p className="text-sm text-slate-500">Bấm "Chia đều cho người đã chọn" để chia đúng danh sách người được trả hộ.</p>):<p className="text-sm text-slate-500">Khoản này đã trừ trực tiếp số dư quỹ chung và không tạo công nợ giữa các thành viên.</p>}</section></div></>}

export function ChatPage(){
  const {tripId}=useParams(); const {data:user}=useRemote('/auth/me');
  const [messages,setMessages]=useState([]); const [loading,setLoading]=useState(true); const [content,setContent]=useState('');
  const chatEndRef = useRef(null);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:'smooth'}); },[messages]);

  useEffect(()=>{
    api(`/trips/${tripId}/messages`).then(res=>{setMessages(res); setLoading(false);}).catch(()=>setLoading(false));
    const token = localStorage.getItem('ustrip_token');
    const socketUrl = (import.meta.env.VITE_API_URL||'http://localhost:5000').replace('/api','');
    const socket = io(socketUrl, { auth: { token } });

    socket.on('connect', () => {
      socket.emit('join_trip', tripId);
    });
    socket.on('new_message', (msg) => {
      setMessages(prev => prev.some(m=>m.id===msg.id) ? prev : [...prev, msg]);
    });

    return () => { socket.disconnect(); };
  },[tripId]);

  const send = async(e) => {
    e.preventDefault(); if(!content.trim())return;
    try {
      await api(`/trips/${tripId}/messages`, {method:'POST', body:{content}});
      setContent('');
    } catch(err) { toast.error(err.message); }
  };

  if(loading) return <Loader/>;
  return <><Head eyebrow="Trò chuyện" title="Thảo luận cùng nhóm"/><div className="card flex h-[70vh] flex-col overflow-hidden p-0"><div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">{messages.map(m=><div key={m.id} className={`flex max-w-[80%] flex-col ${m.user_id===user?.id?'self-end items-end ml-auto':'self-start items-start mr-auto'}`}><span className="text-xs text-slate-500 mb-1 mx-1">{m.sender?.full_name}</span><div className={`rounded-2xl px-4 py-2 shadow-sm ${m.user_id===user?.id?'bg-blue-600 text-white rounded-br-none':'bg-white border border-slate-100 text-ink rounded-bl-none'}`}><p>{m.content}</p></div></div>)}<div ref={chatEndRef}/></div><form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-4"><input required className="flex-1 rounded-xl border border-slate-200 px-4 focus:border-travel focus:outline-none focus:ring-2 focus:ring-travel/20" value={content} onChange={e=>setContent(e.target.value)} placeholder="Nhập tin nhắn..."/><button className="btn-primary rounded-xl px-5"><Send size={18}/></button></form></div></>;
}

export function AiPlacesPage(){
  const {tripId}=useParams(); const {data:tripData}=useRemote(`/trips/${tripId}`);
  const [category,setCategory]=useState('tổng hợp');
  const [busy,setBusy]=useState(false); const [result,setResult]=useState(null); const [error,setError]=useState('');
  
  const generate = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setResult(null);
    try {
      const res = await api(`/trips/${tripId}/ai/places`, { method: 'POST', body: { destination: tripData?.destination||'Đà Lạt', category } });
      setResult(res.places);
    } catch(err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return <><Head eyebrow="AI Places" title="Gợi ý địa điểm"/><div className="grid gap-6 lg:grid-cols-3"><form className="card space-y-4 h-fit" onSubmit={generate}><div><label>Điểm đến</label><input disabled value={tripData?.destination||''} className="bg-slate-50"/></div><div><label>Danh mục</label><select value={category} onChange={e=>setCategory(e.target.value)}><option value="tổng hợp">Tổng hợp</option><option value="ăn uống">Ăn uống</option><option value="vui chơi">Vui chơi</option><option value="khách sạn">Khách sạn</option></select></div><button disabled={busy} className="btn-primary w-full"><Sparkles size={18}/>{busy ? 'Đang tìm...' : 'Tìm địa điểm'}</button></form><div className="lg:col-span-2 space-y-4">
    {busy && <div className="card text-center py-12"><Sparkles className="mx-auto text-travel animate-spin-slow mb-4" size={40}/><p className="animate-pulse font-bold">Đang tìm địa điểm nổi bật...</p></div>}
    {error && <ErrorBox message={error} />}
    {result && <div className="space-y-4">{result.map((p,i)=><div className="card flex flex-col sm:flex-row gap-4 justify-between" key={i}><div><h3 className="font-bold text-lg text-travel">{p.title}</h3><p className="text-sm font-semibold flex items-center gap-1 mt-1"><MapPin size={14}/> {p.location}</p><p className="text-sm mt-2">{p.description}</p><p className="text-sm mt-1 text-slate-500">{p.estimated_cost}</p></div></div>)}<div className="card p-0 overflow-hidden mt-6"><MapView activities={result} selected={null} height={400}/></div></div>}
  </div></div></>;
}
