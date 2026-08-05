import { Check, CircleDollarSign, Sparkles } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorBox, Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency } from "../lib/api";
import toast from "react-hot-toast";
import { Head } from "./shared";

export function SettlementsPage() {
  const { tripId } = useParams();
  const [tab, setTab] = useState("detailed");
  const reports = useRemote(`/trips/${tripId}/member-reports`);
  const detailed = useRemote(`/trips/${tripId}/settlements`);
  const optimized = useRemote(`/trips/${tripId}/optimized-settlements`);

  const handleOptimizedPayment = async (settlement) => {
    if (
      !confirm(
        `Xác nhận ${settlement.debtor_profile?.full_name} đã chuyển ${currency(settlement.amount)} cho ${settlement.creditor_profile?.full_name}?`,
      )
    )
      return;
    try {
      await api(`/trips/${tripId}/expenses`, {
        method: "POST",
        body: {
          title: `Thanh toán nợ tối ưu`,
          amount: settlement.amount,
          category: "other",
          payment_source: "personal",
          paid_by: settlement.debtor_id,
          participants: [settlement.creditor_id],
          expense_date: new Date().toISOString().slice(0, 10),
        },
      });
      toast.success("Đã ghi nhận thanh toán");
      reports.reload();
      detailed.reload();
      optimized.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (detailed.loading || optimized.loading) return <Loader />;
  return (
    <>
      <Head eyebrow="Tài chính" title="Tổng kết & Chia tiền" />
      
      {/* SUMMARY BOARD */}
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-bold text-slate-800">Tổng kết cá nhân (Bao gồm Quỹ chung & Trả hộ)</h3>
        <ErrorBox message={reports.error} />
        {reports.loading ? <Loader /> : (
          <div className="space-y-4">
            {reports.data?.map((rep) => (
              <div key={rep.user_id} className="card bg-white border border-slate-200 p-0 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
                  <img src={rep.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.profile?.full_name || 'User')}&background=random`} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                  <span className="font-bold text-ink">{rep.profile?.full_name}</span>
                </div>
                
                {/* Split layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  {/* QUỸ CHUNG */}
                  <div className="p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-sm text-blue-700 mb-1">Quỹ chung</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Đã góp:</span>
                      <span className="font-bold">{currency(rep.fund_contributed)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Đã dùng:</span>
                      <span className="font-bold">{currency(rep.fund_consumed)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 mt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Dư / Thiếu:</span>
                      <span className={`font-extrabold ${rep.fund_balance > 0.01 ? 'text-emerald-600' : rep.fund_balance < -0.01 ? 'text-coral' : 'text-slate-400'}`}>
                        {rep.fund_balance > 0.01 ? `+ ${currency(rep.fund_balance)} (Thừa)` : rep.fund_balance < -0.01 ? `- ${currency(-rep.fund_balance)} (Thiếu)` : 'Khớp'}
                      </span>
                    </div>
                  </div>

                  {/* TRẢ HỘ */}
                  <div className="p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-sm text-amber-700 mb-1">Trả hộ (Công nợ)</h4>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Đã trả hộ:</span>
                      <span className="font-bold">{currency(rep.personal_paid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Đã dùng:</span>
                      <span className="font-bold">{currency(rep.personal_consumed)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 mt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Dư / Thiếu:</span>
                      <span className={`font-extrabold ${rep.personal_balance > 0.01 ? 'text-emerald-600' : rep.personal_balance < -0.01 ? 'text-coral' : 'text-slate-400'}`}>
                        {rep.personal_balance > 0.01 ? `+ ${currency(rep.personal_balance)} (Thu lại)` : rep.personal_balance < -0.01 ? `- ${currency(-rep.personal_balance)} (Cần trả)` : 'Khớp'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mb-5 flex gap-2 border-b border-slate-200 pb-2">
        <button
          className={`px-4 py-2 font-bold ${tab === "detailed" ? "text-travel border-b-2 border-travel" : "text-slate-500 hover:text-slate-700"}`}
          onClick={() => setTab("detailed")}
        >
          Sao kê nợ
        </button>
        <button
          className={`px-4 py-2 font-bold ${tab === "optimized" ? "text-travel border-b-2 border-travel" : "text-slate-500 hover:text-slate-700"}`}
          onClick={() => setTab("optimized")}
        >
          Gợi ý chuyển khoản (Tối ưu)
        </button>
      </div>

      {tab === "detailed" ? (
        <>
          <p className="mb-5 text-sm text-slate-500">
            Đây là danh sách sao kê chi tiết từng khoản nợ cá nhân phát sinh từ các giao dịch trả hộ. Vui lòng sử dụng mục <strong>Gợi ý chuyển khoản (Tối ưu)</strong> để thực hiện thanh toán.
          </p>
          <ErrorBox message={detailed.error} />
          <div className="space-y-3">
            {detailed.data?.map((split) => (
              <div
                className="card flex flex-wrap items-center justify-between gap-4"
                key={split.id}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`grid h-11 w-11 place-items-center rounded-xl ${split.is_settled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-coral"}`}
                  >
                    {split.is_settled ? <Check /> : <CircleDollarSign />}
                  </div>
                  <div>
                    <p className="font-bold">
                      {split.profile.full_name} → {split.owed_to.full_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {split.expense_title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <b>{currency(split.amount_owed)}</b>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <p>
              <strong>Tính năng Tối ưu hoá (Simplify Debts)</strong>
            </p>
            <p className="mt-1">
              Hệ thống đã gộp các khoản nợ chéo. Nhấn "Ghi nhận" để tạo một
              khoản cấn trừ tự động, giúp triệt tiêu nợ mà không cần đánh dấu
              từng khoản chi tiết.
            </p>
          </div>
          <ErrorBox message={optimized.error} />
          {!optimized.data?.length ? (
            <p className="text-center text-slate-500">
              Tuyệt vời! Không còn khoản nợ nào cần thanh toán.
            </p>
          ) : (
            <div className="space-y-3">
              {optimized.data.map((settlement, index) => (
                <div
                  className="card flex flex-wrap items-center justify-between gap-4"
                  key={index}
                >
                  <div className="flex items-center gap-4">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="font-bold">
                        {settlement.debtor_profile?.full_name} →{" "}
                        {settlement.creditor_profile?.full_name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Chuyển khoản gộp tối ưu
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <b className="text-travel">{currency(settlement.amount)}</b>
                    <button
                      className="btn-primary"
                      onClick={() => handleOptimizedPayment(settlement)}
                    >
                      Ghi nhận
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
