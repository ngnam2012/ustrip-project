import { useParams } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ErrorBox, Loader, StatusBadge } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { currency } from "../lib/api";
import { Head, categories, colors } from "./shared";

export function FinancePage() {
  const { tripId } = useParams();
  const { data, loading, error } = useRemote(
    `/trips/${tripId}/financial-summary`,
  );
  if (loading) return <Loader />;
  const chart = Object.entries(data?.by_category || {}).map(
    ([name, value]) => ({ name: categories[name], value }),
  );
  return (
    <>
      <Head
        eyebrow="Thống kê tài chính"
        title="Tách rõ quỹ chung và tiền cá nhân"
      />
      <ErrorBox message={error} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Quỹ đã thu", data.total_collected],
          ["Chi từ quỹ", data.fund_spent],
          ["Số dư quỹ", data.remaining_fund],
          ["Thành viên trả hộ", data.personal_spent],
          ["Tổng chi chuyến đi", data.total_spent],
        ].map(([label, value]) => (
          <div className="card" key={label}>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-extrabold">{currency(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card h-96 border border-slate-100">
          <h2 className="font-bold">Tổng chi theo danh mục</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie
                data={chart}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={115}
              >
                {chart.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={currency} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="mb-5 font-bold">
            Thành viên chưa hoàn tất đóng góp quỹ
          </h2>
          <div className="space-y-4">
            {data.unpaid_members?.map((member) => (
              <div
                className="flex items-center justify-between border-b border-slate-100 pb-4"
                key={member.id}
              >
                <div>
                  <p className="font-bold">{member.profile.full_name}</p>
                  <StatusBadge status={member.contribution_status} />
                </div>
                <b className="text-coral">
                  {currency(member.remaining_amount)}
                </b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
