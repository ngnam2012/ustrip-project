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
      detailed.reload();
      optimized.reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (detailed.loading || optimized.loading) return <Loader />;
  return (
    <>
      <Head eyebrow="Công nợ cá nhân" title="Hoàn tiền cho thành viên trả hộ" />
      <div className="mb-5 flex gap-2 border-b border-slate-200 pb-2">
        <button
          className={`px-4 py-2 font-bold ${tab === "detailed" ? "text-travel border-b-2 border-travel" : "text-slate-500"}`}
          onClick={() => setTab("detailed")}
        >
          Chi tiết từng khoản
        </button>
        <button
          className={`px-4 py-2 font-bold ${tab === "optimized" ? "text-travel border-b-2 border-travel" : "text-slate-500"}`}
          onClick={() => setTab("optimized")}
        >
          Gợi ý chuyển khoản (Tối ưu)
        </button>
      </div>
      {tab === "detailed" ? (
        <>
          <p className="mb-5 text-sm text-slate-500">
            Chỉ khoản chi do thành viên trả hộ mới xuất hiện ở đây. Chi từ quỹ
            chung không tạo công nợ.
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
                  <button
                    disabled={split.is_settled}
                    className="btn-secondary"
                    onClick={async () => {
                      await api(`/splits/${split.id}/settled`, {
                        method: "PATCH",
                        body: { is_settled: true },
                      });
                      detailed.reload();
                      optimized.reload();
                    }}
                  >
                    {split.is_settled ? "Đã hoàn tiền" : "Đánh dấu đã hoàn"}
                  </button>
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
