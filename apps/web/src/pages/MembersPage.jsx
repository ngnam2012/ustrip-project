import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorBox, Loader, Modal, StatusBadge } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency } from "../lib/api";
import { MomoPaymentForm } from "../components/MomoPayment";
import { Head } from "./shared";

export function MembersPage() {
  const { tripId } = useParams();
  const { data, loading, error, reload } = useRemote(
    `/trips/${tripId}/members`,
  );
  const [showInvite, setShowInvite] = useState(false);
  const [showMomo, setShowMomo] = useState(false);
  if (loading) return <Loader />;
  return (
    <>
      <Head
        eyebrow="Nhóm đồng hành"
        title={`${data?.length || 0} thành viên`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowMomo(true)}
              className="btn bg-[#a50064] text-white shadow-sm hover:bg-[#870052] hover:shadow-md"
            >
              Đóng góp MoMo
            </button>
            <button onClick={() => setShowInvite(true)} className="btn-primary">
              <UserPlus size={18} />
              Mời thành viên
            </button>
          </div>
        }
      />
      <ErrorBox message={error} />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Thành viên</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Đã đóng</th>
              <th>Còn thiếu</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((member) => (
              <tr key={member.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white shadow-sm">
                      {member.profile.full_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-ink">
                        {member.profile.full_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {member.profile.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <StatusBadge status={member.role} />
                </td>
                <td>
                  <StatusBadge status={member.contribution_status} />
                </td>
                <td className="font-semibold text-ink">
                  {currency(member.paid_amount)}
                </td>
                <td className="font-semibold text-coral">
                  {currency(member.remaining_amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showInvite && (
        <InviteForm
          tripId={tripId}
          onClose={() => setShowInvite(false)}
          onSaved={() => {
            setShowInvite(false);
            reload();
          }}
        />
      )}
      {showMomo && (
        <Modal title="Đóng góp qua MoMo" onClose={() => setShowMomo(false)}>
          <MomoPaymentForm tripId={tripId} onSuccess={reload} />
        </Modal>
      )}
    </>
  );
}

function InviteForm({ tripId, onClose, onSaved }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal title="Mời thành viên" onClose={onClose}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            await api(`/trips/${tripId}/members`, {
              method: "POST",
              body: { email },
            });
            onSaved();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <ErrorBox message={error} />
        <label>Email tài khoản UsTrip</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button className="btn-primary mt-6 w-full">
          <UserPlus size={18} />
          Thêm vào chuyến đi
        </button>
      </form>
    </Modal>
  );
}
