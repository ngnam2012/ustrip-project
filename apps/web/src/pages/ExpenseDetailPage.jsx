import { Trash2, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorBox, Loader, StatusBadge } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
import { Head, sourceLabels } from "./shared";

export function ExpenseDetailPage() {
  const { tripId, expenseId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRemote(`/expenses/${expenseId}`);
  if (loading) return <Loader />;
  const personal = data.payment_source === "personal";
  return (
    <>
      <Head
        eyebrow="Chi tiết chi tiêu"
        title={data?.title}
        action={
          <div className="flex gap-2">
            {personal && (
              <button
                className="btn-primary"
                onClick={async () => {
                  await api(`/expenses/${expenseId}/split`, {
                    method: "POST",
                    body: {},
                  });
                  reload();
                }}
              >
                <Users size={17} />
                Chia đều cho người đã chọn
              </button>
            )}
            <button
              className="btn-coral"
              onClick={async () => {
                if (confirm("Xóa khoản chi này?")) {
                  await api(`/expenses/${expenseId}`, { method: "DELETE" });
                  navigate(`/trips/${tripId}/expenses`);
                }
              }}
            >
              <Trash2 size={17} />
              Xóa
            </button>
          </div>
        }
      />
      <ErrorBox message={error} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span
                className={`badge ${personal ? "bg-blue-50 text-travel" : "bg-emerald-50 text-emerald-700"}`}
              >
                {sourceLabels[data.payment_source]}
              </span>
              <p className="mt-4 text-sm text-slate-500">
                {personal ? "Người trả hộ:" : "Nguồn thanh toán:"}{" "}
                <b className="text-ink">
                  {personal ? data.payer?.full_name : "Quỹ chung của chuyến đi"}
                </b>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {dateText(data.expense_date)}
              </p>
            </div>
            <p className="text-3xl font-extrabold text-travel">
              {currency(data.amount)}
            </p>
          </div>
          {personal && (
            <div className="mt-5">
              <p className="text-sm font-bold">Đã thanh toán cho:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.participants?.map((participant) => (
                  <span
                    className="badge bg-blue-50 text-travel"
                    key={participant.user_id}
                  >
                    {participant.profile.full_name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.note && (
            <p className="mt-5 rounded-xl bg-slate-50 p-4">{data.note}</p>
          )}
          {data.bill_image_url && (
            <img
              src={data.bill_image_url}
              alt="Hóa đơn"
              className="mt-5 max-h-96 w-full rounded-xl object-contain bg-slate-50"
            />
          )}
        </section>
        <section className="card">
          <h2 className="mb-4 font-bold">
            {personal ? "Hoàn tiền cho người trả hộ" : "Tác động đến quỹ"}
          </h2>
          {personal ? (
            data.splits?.length ? (
              data.splits.map((split) => (
                <div
                  className="mb-3 flex justify-between border-b border-slate-100 pb-3"
                  key={split.id}
                >
                  <div>
                    <p className="font-semibold">{split.profile.full_name}</p>
                    <StatusBadge status={split.is_settled ? "paid" : "unpaid"} />
                  </div>
                  <b>{currency(split.amount_owed)}</b>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Bấm "Chia đều cho người đã chọn" để chia đúng danh sách người
                được trả hộ.
              </p>
            )
          ) : (
            <p className="text-sm text-slate-500">
              Khoản này đã trừ trực tiếp số dư quỹ chung và không tạo công nợ
              giữa các thành viên.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
