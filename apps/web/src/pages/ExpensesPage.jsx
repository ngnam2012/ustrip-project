import { CircleDollarSign, Plus, FileText } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Empty, ErrorBox, Loader } from "../components/ui";
import { ExpenseForm } from "../components/ExpenseForm";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
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
          <div className="flex gap-2">
            <Link to={`/trips/${tripId}/audit`} className="btn-secondary hidden sm:flex">
              <FileText size={18} />
              Nhật ký
            </Link>
            <Link to={`/trips/${tripId}/audit`} className="btn-secondary sm:hidden px-2">
              <FileText size={18} />
            </Link>
            <button onClick={() => setShowForm(true)} className="btn-coral">
              <Plus size={18} />
              Thêm chi tiêu
            </button>
          </div>
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


