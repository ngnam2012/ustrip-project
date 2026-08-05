import { Trash2, Users, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorBox, Loader, StatusBadge } from "../components/ui";
import { ExpenseForm } from "../components/ExpenseForm";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
import { Head, sourceLabels } from "./shared";

export function ExpenseDetailPage() {
  const { tripId, expenseId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRemote(`/expenses/${expenseId}`);
  const members = useRemote(`/trips/${tripId}/members`);
  const [showEditForm, setShowEditForm] = useState(false);
  
  if (loading || members.loading) return <Loader />;
  const personal = data.payment_source === "personal";
  return (
    <>
      <Head
        eyebrow="Chi tiết chi tiêu"
        title={data?.title}
        action={
          <div className="flex gap-2">
            <button
              className="btn-coral text-slate-700 bg-slate-100 hover:bg-slate-200 border-none"
              onClick={() => setShowEditForm(true)}
            >
              <Pencil size={17} />
              Chỉnh sửa
            </button>
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
          <div className="mt-5">
            <p className="text-sm font-bold">{personal ? "Đã thanh toán cho:" : "Sử dụng bởi:"}</p>
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
            {personal ? "Hoàn tiền cho người trả hộ" : "Mức tiêu thụ từ quỹ chung"}
          </h2>
          {data.splits?.length ? (
            data.splits.map((split) => (
              <div
                className="mb-3 flex justify-between border-b border-slate-100 pb-3"
                key={split.id}
              >
                <div>
                  <p className="font-semibold">{split.profile.full_name}</p>
                  {personal && <StatusBadge status={split.is_settled ? "paid" : "unpaid"} />}
                </div>
                <b>{currency(split.amount_owed)}</b>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              {personal 
                ? "Bấm 'Chia đều cho người đã chọn' để chia đúng danh sách người được trả hộ."
                : "Khoản này không ghi nhận chi tiết mức tiêu thụ của từng người."
              }
            </p>
          )}
        </section>
      </div>
      {showEditForm && (
        <ExpenseForm
          tripId={tripId}
          expenseId={expenseId}
          members={members.data || []}
          initialData={{
            title: data.title,
            amount: data.amount,
            category: data.category,
            payment_source: data.payment_source,
            paid_by: data.paid_by || "",
            expense_date: data.expense_date?.slice(0, 10),
            participants: data.participants?.map(p => p.user_id) || [],
            split_method: data.split_method || 'equal',
            exact_splits: data.split_method === 'exact' ? (data.splits || []).reduce((acc, split) => {
              acc[split.user_id] = split.amount_owed;
              return acc;
            }, {}) : {},
            bill_image_url: data.bill_image_url || "",
            note: data.note || "",
          }}
          onClose={() => setShowEditForm(false)}
          onSaved={() => {
            setShowEditForm(false);
            reload();
          }}
        />
      )}
    </>
  );
}
