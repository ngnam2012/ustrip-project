import { CircleDollarSign, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Empty, ErrorBox, ImageUpload, Loader, Modal } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
import toast from "react-hot-toast";
import { Head, categories, sourceLabels } from "./shared";

export function ExpensesPage() {
  const { tripId } = useParams();
  const { data, loading, error, reload } = useRemote(
    `/trips/${tripId}/expenses`,
  );
  const members = useRemote(`/trips/${tripId}/members`);
  const [showForm, setShowForm] = useState(false);
  if (loading) return <Loader />;
  return (
    <>
      <Head
        eyebrow="Chi tiêu"
        title="Chi từ quỹ và khoản thành viên trả hộ"
        action={
          <button onClick={() => setShowForm(true)} className="btn-coral">
            <Plus size={18} />
            Thêm chi tiêu
          </button>
        }
      />
      <ErrorBox message={error} />
      {!data?.length ? (
        <Empty />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Khoản chi</th>
                <th>Nguồn tiền</th>
                <th>Người trả hộ</th>
                <th>Ngày</th>
                <th className="text-right">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {data.map((expense) => (
                <tr key={expense.id}>
                  <td>
                    <Link
                      className="font-bold hover:text-travel"
                      to={`/trips/${tripId}/expenses/${expense.id}`}
                    >
                      {expense.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {categories[expense.category]}
                    </p>
                  </td>
                  <td>
                    <span
                      className={`badge ${expense.payment_source === "shared_fund" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-travel"}`}
                    >
                      {sourceLabels[expense.payment_source]}
                    </span>
                  </td>
                  <td>
                    {expense.payment_source === "shared_fund" ? (
                      <span className="text-slate-400">Không áp dụng</span>
                    ) : (
                      expense.payer?.full_name
                    )}
                  </td>
                  <td>{dateText(expense.expense_date)}</td>
                  <td className="text-right font-extrabold">
                    {currency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showForm && (
        <ExpenseForm
          tripId={tripId}
          members={members.data || []}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}
    </>
  );
}

function ExpenseForm({ tripId, members, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "food",
    payment_source: "personal",
    paid_by: members[0]?.user_id || "",
    expense_date: new Date().toISOString().slice(0, 10),
    participants: [],
    bill_image_url: "",
    note: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const toggleParticipant = (userId) =>
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.includes(userId)
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId],
    }));

  return (
    <Modal title="Thêm chi tiêu" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await api(`/trips/${tripId}/expenses`, {
              method: "POST",
              body: formData,
            });
            toast.success(
              formData.payment_source === "shared_fund"
                ? "Đã ghi chi từ quỹ chung"
                : "Đã ghi khoản thành viên trả hộ",
            );
            onSaved();
          } catch (err) {
            setErrorMessage(err.message);
          }
        }}
      >
        <ErrorBox message={errorMessage} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label>Nguồn thanh toán</label>
            <select
              value={formData.payment_source}
              onChange={(event) =>
                setFormData({
                  ...formData,
                  payment_source: event.target.value,
                })
              }
            >
              <option value="personal">
                Thành viên trả hộ · tạo công nợ cho người được chọn
              </option>
              <option value="shared_fund">
                Quỹ chung · trừ trực tiếp số dư, không tạo công nợ
              </option>
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {formData.payment_source === "shared_fund"
                ? "Chỉ chủ chuyến được ghi nhận và số tiền không được vượt số dư quỹ."
                : "Chọn chính xác những người mà thành viên này đã thanh toán cho."}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label>Tên khoản chi</label>
            <input
              required
              value={formData.title}
              onChange={(event) =>
                setFormData({ ...formData, title: event.target.value })
              }
            />
          </div>
          <div>
            <label>Số tiền</label>
            <input
              required
              min="1"
              type="number"
              value={formData.amount}
              onChange={(event) =>
                setFormData({ ...formData, amount: event.target.value })
              }
            />
          </div>
          <div>
            <label>Danh mục</label>
            <select
              value={formData.category}
              onChange={(event) =>
                setFormData({ ...formData, category: event.target.value })
              }
            >
              {Object.entries(categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {formData.payment_source === "personal" && (
            <>
              <div>
                <label>Người trả hộ</label>
                <select
                  value={formData.paid_by}
                  onChange={(event) =>
                    setFormData({ ...formData, paid_by: event.target.value })
                  }
                >
                  {members.map((member) => (
                    <option value={member.user_id} key={member.user_id}>
                      {member.profile.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label>
                  Người được trả hộ ({formData.participants.length} đã chọn)
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {members.map((member) => (
                    <label
                      key={member.user_id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${formData.participants.includes(member.user_id) ? "border-travel bg-blue-50" : "border-slate-200"}`}
                    >
                      <input
                        className="h-4 w-4 shrink-0 p-0 accent-blue-600"
                        type="checkbox"
                        checked={formData.participants.includes(
                          member.user_id,
                        )}
                        onChange={() => toggleParticipant(member.user_id)}
                      />
                      <span className="font-semibold">
                        {member.profile.full_name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Khi chia tiền, số tiền chỉ được chia đều cho những người đã
                  tick. Tick cả người trả hộ nếu họ cũng sử dụng khoản chi.
                </p>
              </div>
            </>
          )}
          <div>
            <label>Ngày chi</label>
            <input
              type="date"
              value={formData.expense_date}
              onChange={(event) =>
                setFormData({ ...formData, expense_date: event.target.value })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <ImageUpload
              value={formData.bill_image_url}
              onChange={(url) =>
                setFormData({ ...formData, bill_image_url: url })
              }
            />
          </div>
        </div>
        <button className="btn-primary mt-5 w-full">
          {formData.payment_source === "shared_fund"
            ? "Ghi chi từ quỹ chung"
            : `Lưu khoản trả hộ cho ${formData.participants.length} người`}
        </button>
      </form>
    </Modal>
  );
}
