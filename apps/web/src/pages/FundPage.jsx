import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Empty,
  ErrorBox,
  ImageUpload,
  Loader,
  Modal,
  StatusBadge,
} from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency } from "../lib/api";
import { MomoPaymentForm, PaymentStatusCard } from "../components/MomoPayment";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Head } from "./shared";

export function FundPage() {
  const { tripId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const fund = useRemote(`/trips/${tripId}/fund`);
  const contributions = useRemote(`/trips/${tripId}/contributions`);
  const members = useRemote(`/trips/${tripId}/members`);
  const [showForm, setShowForm] = useState(false);
  const [showMomo, setShowMomo] = useState(false);
  const [redirectPayment, setRedirectPayment] = useState(null);

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    const status = searchParams.get("status");
    if (paymentId) {
      api(`/payments/${paymentId}/status`)
        .then((payment) => {
          setRedirectPayment(payment);
          if (status === "success") {
            toast.success(
              "Thanh toán MoMo thành công! Đóng góp đã được ghi nhận.",
            );
            fund.reload();
            contributions.reload();
          } else if (status === "failed")
            toast.error("Thanh toán MoMo thất bại.");
          else toast("Đã quay lại từ MoMo. Kiểm tra trạng thái bên dưới.");
        })
        .catch(() => toast.error("Không thể tải thông tin thanh toán."));
      setSearchParams({}, { replace: true });
    }
  }, []);

  const refreshRedirectPayment = async () => {
    if (!redirectPayment) return;
    try {
      const payment = await api(`/payments/${redirectPayment.id}/status`);
      setRedirectPayment(payment);
      if (payment.status === "success") {
        toast.success("Thanh toán thành công!");
        fund.reload();
        contributions.reload();
      } else toast(`Trạng thái: ${payment.status}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (fund.loading || contributions.loading) return <Loader />;

  const fundData = fund.data || {};
  const percent = Math.min(
    100,
    (fundData.total_collected / Math.max(fundData.target_amount, 1)) * 100,
  );
  const reloadAll = () => {
    fund.reload();
    contributions.reload();
    members.reload();
  };

  return (
    <>
      <Head
        eyebrow="Quỹ chung"
        title="Tiền nhóm đã góp và đã dùng"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowMomo(true)}
              className="btn bg-[#a50064] text-white shadow-sm hover:bg-[#870052] hover:shadow-md"
            >
              Thanh toán MoMo
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={18} />
              Đóng góp thủ công
            </button>
          </div>
        }
      />
      {redirectPayment && (
        <div className="mb-6">
          <PaymentStatusCard
            payment={redirectPayment}
            onRefresh={refreshRedirectPayment}
          />
        </div>
      )}
      <section className="card mb-6 border border-amber-200">
        <div className="flex flex-wrap justify-between gap-5">
          <div>
            <p className="text-sm text-slate-500">Số dư quỹ có thể sử dụng</p>
            <p className="mt-1 text-3xl font-extrabold text-travel">
              {currency(fundData.current_balance)}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 text-right text-sm md:grid-cols-4">
            <div>
              <p className="text-slate-500">Mục tiêu góp</p>
              <b>{currency(fundData.target_amount)}</b>
            </div>
            <div>
              <p className="text-slate-500">Quỹ đã thu</p>
              <b className="text-emerald-600">
                {currency(fundData.total_collected)}
              </b>
            </div>
            <div>
              <p className="text-slate-500">Đã chi từ quỹ</p>
              <b className="text-coral">{currency(fundData.fund_spent)}</b>
            </div>
            <div>
              <p className="text-slate-500">Thành viên trả hộ</p>
              <b className="text-blue-600">
                {currency(fundData.personal_spent)}
              </b>
            </div>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm"
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Đã đạt {percent.toFixed(0)}% mục tiêu góp. Khoản thành viên trả hộ
          không trừ số dư quỹ.
        </p>
      </section>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Người đóng</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Trạng thái</th>
              <th>Minh chứng</th>
            </tr>
          </thead>
          <tbody>
            {contributions.data?.map((contribution) => (
              <tr key={contribution.id}>
                <td className="font-bold">
                  {contribution.profile.full_name}
                </td>
                <td className="font-bold text-emerald-600">
                  {currency(contribution.amount)}
                </td>
                <td>
                  {contribution.payment_method === "momo"
                    ? "MoMo"
                    : "Thủ công"}
                </td>
                <td>
                  <StatusBadge status={contribution.payment_status} />
                  {contribution.payment_method === "momo" &&
                    contribution.payment_status === "pending" &&
                    contribution.payment_id && (
                      <Link
                        to={`/trips/${tripId}/payments/${contribution.payment_id}`}
                        className="ml-3 block text-xs font-bold text-travel underline hover:text-blue-700"
                      >
                        Thanh toán tiếp
                      </Link>
                    )}
                </td>
                <td>
                  {contribution.payment_proof_url ? (
                    <a
                      href={contribution.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={contribution.payment_proof_url}
                        alt="Minh chứng thanh toán"
                        className="h-14 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && (
        <ContributionForm
          tripId={tripId}
          members={members.data || []}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            reloadAll();
          }}
        />
      )}
      {showMomo && (
        <Modal title="Đóng góp qua MoMo" onClose={() => setShowMomo(false)}>
          <MomoPaymentForm tripId={tripId} onSuccess={reloadAll} />
        </Modal>
      )}
    </>
  );
}

function ContributionForm({ tripId, members, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    user_id: members[0]?.user_id || "",
    amount: "",
    note: "",
    payment_proof_url: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  return (
    <Modal title="Thêm đóng góp" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await api(`/trips/${tripId}/contributions`, {
              method: "POST",
              body: formData,
            });
            onSaved();
          } catch (err) {
            setErrorMessage(err.message);
          }
        }}
      >
        <ErrorBox message={errorMessage} />
        <div className="space-y-4">
          <div>
            <label>Thành viên</label>
            <select
              value={formData.user_id}
              onChange={(event) =>
                setFormData({ ...formData, user_id: event.target.value })
              }
            >
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profile.full_name}
                </option>
              ))}
            </select>
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
          <ImageUpload
            type="payment-proof"
            value={formData.payment_proof_url}
            onChange={(url) =>
              setFormData({ ...formData, payment_proof_url: url })
            }
          />
          <div>
            <label>Ghi chú</label>
            <input
              value={formData.note}
              onChange={(event) =>
                setFormData({ ...formData, note: event.target.value })
              }
            />
          </div>
        </div>
        <button className="btn-primary mt-6 w-full">Xác nhận đóng góp</button>
      </form>
    </Modal>
  );
}
