import { FileText, PlusCircle, Pencil, Trash2, Wallet, Users, Activity, Bell } from "lucide-react";
import { useParams } from "react-router-dom";
import { ErrorBox, Loader, Empty } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { Head } from "./shared";
import { dateText } from "../lib/api";

const getIcon = (type) => {
  switch (type) {
    case "new_expense": return <PlusCircle size={20} className="text-blue-600" />;
    case "edit_expense": return <Pencil size={18} className="text-amber-600" />;
    case "delete_expense": return <Trash2 size={18} className="text-red-600" />;
    case "fund_update": return <Wallet size={18} className="text-emerald-600" />;
    case "member_added": return <Users size={18} className="text-travel" />;
    case "itinerary_update": return <Activity size={18} className="text-indigo-600" />;
    default: return <Bell size={18} className="text-slate-600" />;
  }
}

const getBgColor = (type) => {
  switch (type) {
    case "new_expense": return "bg-blue-50";
    case "edit_expense": return "bg-amber-50";
    case "delete_expense": return "bg-red-50";
    case "fund_update": return "bg-emerald-50";
    case "member_added": return "bg-blue-50";
    case "itinerary_update": return "bg-indigo-50";
    default: return "bg-slate-100";
  }
}

export function AuditLogPage() {
  const { tripId } = useParams();
  const { data, loading, error } = useRemote(`/trips/${tripId}/audit-logs`);
  if (loading) return <Loader />;
  
  return (
    <>
      <Head eyebrow="Nhật ký" title="Lịch sử hoạt động" />
      <ErrorBox message={error} />
      
      {!data?.length ? (
        <Empty />
      ) : (
        <div className="relative pl-6 sm:pl-8 py-4 border-l-2 border-slate-100 ml-4 sm:ml-6 space-y-8">
          {data.map((log, index) => (
            <div key={index} className="relative">
              <div className={`absolute -left-[45px] sm:-left-[53px] top-0 grid h-10 w-10 place-items-center rounded-full border-4 border-white shadow-sm ${getBgColor(log.type)}`}>
                {getIcon(log.type)}
              </div>
              <div className="card w-full text-left bg-white rounded-xl p-4 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800">{log.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {log.message}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md">
                    {new Date(log.created_at).toLocaleString('vi-VN', {
                      hour: '2-digit', minute: '2-digit',
                      day: '2-digit', month: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
