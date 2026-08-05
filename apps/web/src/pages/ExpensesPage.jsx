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
    split_method: "equal",
    exact_splits: {},
    bill_image_url: "",
    note: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const toggleParticipant = (userId) =>
    setFormData((prev) => {
      const isSelected = prev.participants.includes(userId);
      const newParticipants = isSelected
        ? prev.participants.filter((id) => id !== userId)
        : [...prev.participants, userId];
      
      const newExactSplits = { ...prev.exact_splits };
      if (!isSelected && !newExactSplits[userId]) {
        newExactSplits[userId] = "";
      } else if (isSelected) {
        delete newExactSplits[userId];
      }
      
      return { ...prev, participants: newParticipants, exact_splits: newExactSplits };
    });

  const handleExactSplitChange = (userId, value) => {
    setFormData(prev => ({
      ...prev,
      exact_splits: {
        ...prev.exact_splits,
        [userId]: value
      }
    }));
  };

  const getExactSplitsTotal = () => {
    return Object.values(formData.exact_splits).reduce((sum, val) => sum + (Number(val) || 0), 0);
  };

  return (
    <Modal title="Thêm chi tiêu" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setErrorMessage("");
          
          if (formData.split_method === "exact") {
            const total = getExactSplitsTotal();
            if (total !== Number(formData.amount)) {
              setErrorMessage(`Tổng số tiền chia (${currency(total)}) phải bằng với tổng số tiền chi (${currency(formData.amount)})`);
              return;
            }
            const activeSplits = Object.values(formData.exact_splits).filter(val => Number(val) > 0);
            if (activeSplits.length === 0) {
              setErrorMessage("Vui lòng nhập số tiền cho ít nhất một người");
              return;
            }
          } else {
            if (formData.participants.length === 0) {
              setErrorMessage("Vui lòng chọn ít nhất một người tham gia");
              return;
            }
          }
          
          try {
            const payload = { ...formData };
            if (payload.split_method === "exact") {
              payload.exact_splits = Object.entries(payload.exact_splits)
                .filter(([userId, amount]) => Number(amount) > 0)
                .map(([userId, amount]) => ({ user_id: userId, amount_owed: Number(amount) }));
              payload.participants = payload.exact_splits.map(s => s.user_id);
            } else {
              delete payload.exact_splits;
            }
            
            await api(`/trips/${tripId}/expenses`, {
              method: "POST",
              body: payload,
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
              onChange={(event) => {
                const source = event.target.value;
                setFormData({
                  ...formData,
                  payment_source: source,
                  participants: source === "shared_fund" ? members.map(m => m.user_id) : formData.participants
                });
              }}
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
          )}
          
          <div className="sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label>
                Người tiêu thụ ({formData.participants.length} đã chọn)
              </label>
              <select
                className="w-auto py-1 text-sm bg-blue-50 border-blue-200 text-travel"
                value={formData.split_method}
                onChange={(event) => setFormData({ ...formData, split_method: event.target.value })}
              >
                <option value="equal">Chia đều</option>
                <option value="exact">Nhập số tiền</option>
              </select>
            </div>
            
            <div className={`mt-2 grid gap-2 ${formData.split_method === 'exact' ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
              {members.map((member) => {
                if (formData.split_method === "exact") {
                  const amount = formData.exact_splits[member.user_id] || "";
                  return (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${Number(amount) > 0 ? "border-travel bg-blue-50" : "border-slate-200 bg-white"}`}
                    >
                      <label className="flex items-center gap-3 flex-1 font-semibold">
                        {member.profile.full_name}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium text-sm">đ</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-32 h-10 py-1 px-3 text-right text-sm font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-travel focus:border-travel transition-all"
                          value={amount}
                          onChange={(e) => handleExactSplitChange(member.user_id, e.target.value)}
                        />
                      </div>
                    </div>
                  );
                }

                const isSelected = formData.participants.includes(member.user_id);
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center gap-3 rounded-xl border p-3 ${isSelected ? "border-travel bg-blue-50" : "border-slate-200 bg-white"}`}
                  >
                    <label className="flex cursor-pointer items-center gap-3 flex-1">
                      <input
                        className="h-4 w-4 shrink-0 p-0 accent-blue-600"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleParticipant(member.user_id)}
                      />
                      <span className="font-semibold">
                        {member.profile.full_name}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
            {formData.split_method === "exact" && (
              <div className="mt-3 p-4 rounded-xl bg-slate-50 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 font-bold border border-slate-200">
                <span className="text-slate-600">Tổng cộng đã chia:</span>
                <div className="flex flex-col items-end">
                  <span className={getExactSplitsTotal() === Number(formData.amount) ? 'text-emerald-600 text-lg' : 'text-slate-800 text-lg'}>
                    {currency(getExactSplitsTotal())} / {currency(Number(formData.amount) || 0)}
                  </span>
                  {getExactSplitsTotal() < Number(formData.amount) && (
                    <span className="text-red-500 text-sm mt-1">Còn thiếu: {currency(Number(formData.amount) - getExactSplitsTotal())}</span>
                  )}
                  {getExactSplitsTotal() > Number(formData.amount) && (
                    <span className="text-red-500 text-sm mt-1">Bị vượt quá: {currency(getExactSplitsTotal() - Number(formData.amount))}</span>
                  )}
                  {getExactSplitsTotal() === Number(formData.amount) && Number(formData.amount) > 0 && (
                    <span className="text-emerald-600 text-sm mt-1">Đã khớp số tiền!</span>
                  )}
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {formData.split_method === 'equal' ? 'Số tiền sẽ được chia đều cho những người đã tick.' : 'Nhập chính xác số tiền mỗi người phải chịu.'} 
              {formData.payment_source === "personal" && ' Tick cả người trả hộ nếu họ cũng sử dụng khoản chi.'}
            </p>
          </div>
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
