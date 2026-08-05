import { Trash2, Edit3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorBox, Loader, Modal } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, dateText, currency } from "../lib/api";
import { MapView } from "../components/MapView";
import toast from "react-hot-toast";
import { Head } from "./shared";

export function ActivityDetailPage() {
  const { tripId, activityId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRemote(`/activities/${activityId}`);
  const { data: members, loading: membersLoading } = useRemote(
    `/trips/${tripId}/members`,
  );
  const [showEdit, setShowEdit] = useState(false);

  if (loading || membersLoading) return <Loader />;
  return (
    <>
      <Head
        eyebrow="Chi tiết hoạt động"
        title={data?.title}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowEdit(true)}
            >
              <Edit3 size={17} />
              Chỉnh sửa
            </button>
            <button
              type="button"
              className="btn-coral"
              onClick={async () => {
                if (confirm("Xóa hoạt động này?")) {
                  await api(`/activities/${activityId}`, { method: "DELETE" });
                  navigate(`/trips/${tripId}/itinerary`);
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
      {showEdit && (
        <EditActivityForm
          activity={data}
          members={members || []}
          onClose={() => setShowEdit(false)}
          onSaved={async () => {
            await reload();
            setShowEdit(false);
            toast.success("Cập nhật hoạt động thành công");
          }}
        />
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Thông tin hoạt động</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Ngày & giờ
              </p>
              <p className="mt-2 font-semibold">
                {dateText(data.activity_date)} · {data.start_time?.slice(0, 5)}{" "}
                - {data.end_time?.slice(0, 5)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Địa điểm
              </p>
              <p className="mt-2 font-semibold">
                {data.address || data.location || "Chưa cập nhật"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Chi phí dự kiến
              </p>
              <p className="mt-2 font-semibold text-travel">
                {currency(data.estimated_cost)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Ghi chú
              </p>
              <p className="mt-2 font-semibold">{data.notes || "Không có"}</p>
            </div>
          </div>
        </section>
        <section className="card">
          <h2 className="mb-4 font-bold">Người tham gia</h2>
          {data.participants?.map((participant) => (
            <p
              className="mb-2 rounded-xl bg-slate-50 p-3 font-semibold"
              key={participant.user_id}
            >
              {participant.profile.full_name}
            </p>
          ))}
        </section>
      </div>
      <div className="mt-6">
        <MapView activities={[data]} selected={data} />
      </div>
    </>
  );
}

function EditActivityForm({ activity, members, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    location_name: "",
    address: "",
    latitude: null,
    longitude: null,
    map_provider: "openstreetmap",
    estimated_cost: "",
    participants: [],
    notes: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!activity) return;
    setFormData({
      title: activity.title || "",
      start_datetime: `${activity.activity_date || ""}T${activity.start_time?.slice(0, 5) || "00:00"}`,
      end_datetime: `${activity.activity_date || ""}T${activity.end_time?.slice(0, 5) || "00:00"}`,
      location: activity.location || "",
      location_name: activity.location_name || activity.location || "",
      address: activity.address || "",
      latitude: activity.latitude || null,
      longitude: activity.longitude || null,
      map_provider: activity.map_provider || "openstreetmap",
      estimated_cost: activity.estimated_cost
        ? String(activity.estimated_cost).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        : "",
      participants: activity.participants?.map((p) => p.user_id) || [],
      notes: activity.notes || "",
    });
  }, [activity]);

  const formatMoney = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const startDate = formData.start_datetime.split("T");
      const endDate = formData.end_datetime.split("T");
      await api(`/activities/${activity.id}`, {
        method: "PATCH",
        body: {
          title: formData.title,
          activity_date: startDate[0] || "",
          start_time: startDate[1] || "",
          end_time: endDate[1] || "",
          location: formData.location,
          location_name: formData.location_name,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          map_provider: formData.map_provider,
          estimated_cost: Number(String(formData.estimated_cost).replace(/\D/g, "")) || 0,
          notes: formData.notes,
          participants: formData.participants,
        },
      });
      onSaved();
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  return (
    <Modal title="Chỉnh sửa hoạt động" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorBox message={errorMessage} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label>Tên hoạt động</label>
            <input
              required
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            />
          </div>
          <div>
            <label>Bắt đầu</label>
            <input
              required
              type="datetime-local"
              value={formData.start_datetime}
              onChange={(event) => setFormData({ ...formData, start_datetime: event.target.value })}
            />
          </div>
          <div>
            <label>Kết thúc</label>
            <input
              type="datetime-local"
              value={formData.end_datetime}
              onChange={(event) => setFormData({ ...formData, end_datetime: event.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label>Địa điểm</label>
            <input
              value={formData.location}
              onChange={(event) => setFormData({ ...formData, location: event.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label>Thành viên tham gia</label>
            <div className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {members.map((member) => (
                <label
                  key={member.user_id}
                  className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition hover:border-travel"
                >
                  <span className="font-semibold text-slate-700">
                    {member.profile.full_name}
                  </span>
                  <input
                    className="h-4 w-4 accent-blue-600"
                    type="checkbox"
                    checked={formData.participants.includes(member.user_id)}
                    onChange={() =>
                      setFormData((prev) => {
                        const checked = prev.participants.includes(member.user_id);
                        return {
                          ...prev,
                          participants: checked
                            ? prev.participants.filter((id) => id !== member.user_id)
                            : [...prev.participants, member.user_id],
                        };
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <label>Chi phí dự kiến</label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.estimated_cost}
              onChange={(event) =>
                setFormData({ ...formData, estimated_cost: formatMoney(event.target.value) })
              }
            />
          </div>
          <div className="sm:col-span-2">
            <label>Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              className="min-h-[120px] w-full rounded-xl border p-3"
            />
          </div>
        </div>
        <button className="btn-primary mt-6 w-full">Lưu thay đổi</button>
      </form>
    </Modal>
  );
}
