import { MapPin, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Empty, ErrorBox, Loader, Modal } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
import { LocationSearchInput, MapView } from "../components/MapView";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Head } from "./shared";

export function ItineraryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRemote(
    `/trips/${tripId}/activities`,
  );
  const { data: members, loading: membersLoading } = useRemote(
    `/trips/${tripId}/members`,
  );
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  const deleteActivity = async (activityId) => {
    if (!confirm("Xóa hoạt động này?")) return;
    await api(`/activities/${activityId}`, { method: "DELETE" });
    toast.success("Đã xóa hoạt động");
    reload();
  };

  const editActivity = (activity) => {
    setEditingActivity(activity);
  };
  const groups = useMemo(
    () =>
      Object.groupBy
        ? Object.groupBy(data || [], (x) => x.activity_date)
        : (data || []).reduce(
            (r, x) => ({
              ...r,
              [x.activity_date]: [...(r[x.activity_date] || []), x],
            }),
            {},
          ),
    [data],
  );
  if (loading) return <Loader />;
  return (
    <>
      <Head
        eyebrow="Lịch trình"
        title="Kế hoạch theo ngày"
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Thêm hoạt động
          </button>
        }
      />
      <ErrorBox message={error} />
      {!data?.length ? (
        <Empty
          title="Chưa có hoạt động"
          detail="Thêm hoạt động đầu tiên để bắt đầu lên kế hoạch."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([date, items]) => (
            <ItineraryDay
              key={date}
              date={date}
              items={items}
              tripId={tripId}
              onEdit={editActivity}
              onDelete={deleteActivity}
            />
          ))}
        </div>
      )}
      {(showForm || editingActivity) && (
        <ActivityForm
          tripId={tripId}
          members={members || []}
          activity={editingActivity}
          onClose={() => {
            setShowForm(false);
            setEditingActivity(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingActivity(null);
            reload();
          }}
        />
      )}
    </>
  );
}

function ItineraryDay({ date, items, tripId, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button
        onClick={() => setOpen((value) => !value)}
        className="mb-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left font-bold text-slate-600 transition-all duration-200 hover:bg-blue-50/60 hover:text-travel"
      >
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-xs font-extrabold text-travel">
            {items.length}
          </span>
          {dateText(date)}
        </span>
        <span
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative space-y-3 overflow-hidden border-l-2 border-dashed border-blue-200/60 pl-6"
          >
            {items.map((item) => (
              <div
                key={item.id}
                className="card relative block border-l-4 border-l-travel/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-l-travel"
              >
                <span className="absolute -left-[32px] top-6 h-3 w-3 rounded-full bg-travel ring-4 ring-blue-50 shadow-sm" />
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <Link
                      to={`/trips/${tripId}/activities/${item.id}`}
                      className="font-bold text-ink hover:text-travel"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={14} />
                      {item.location || "Chưa đặt địa điểm"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-travel">
                      {item.start_time?.slice(0, 5)} -{" "}
                      {item.end_time?.slice(0, 5)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {currency(item.estimated_cost)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    className="text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    onClick={() => onEdit(item)}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-500 transition hover:text-red-700"
                    onClick={() => onDelete(item.id)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ActivityForm({ tripId, members = [], activity, onClose, onSaved }) {
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
    if (activity) {
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
        participants: activity.participants?.map((p) => p.user_id) || members.map((member) => member.user_id),
        notes: activity.notes || "",
      });
      return;
    }
    if (members?.length && !formData.participants.length) {
      setFormData((prev) => ({
        ...prev,
        participants: members.map((member) => member.user_id),
      }));
    }
  }, [activity, members]);

  const formatMoney = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      const startDate = formData.start_datetime.split("T");
      const endDate = formData.end_datetime.split("T");
      await api(activity ? `/activities/${activity.id}` : `/trips/${tripId}/activities`, {
        method: activity ? "PATCH" : "POST",
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
      toast.success(activity ? "Đã cập nhật hoạt động" : "Đã thêm hoạt động");
      onSaved();
    } catch (err) {
      setErrorMessage(err.message);
      toast.error(err.message);
    }
  };

  return (
    <Modal title="Thêm hoạt động" onClose={onClose}>
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
            <label>Tìm địa điểm</label>
            <LocationSearchInput
              value={formData.location}
              onChange={(value) => setFormData({ ...formData, location: value })}
              onSelect={(place) => setFormData({ ...formData, ...place })}
            />
          </div>
          <div className="sm:col-span-2">
            <MapView
              activities={
                formData.latitude
                  ? [
                      {
                        ...formData,
                        id: "selected",
                        title: formData.title || "Địa điểm đã chọn",
                      },
                    ]
                  : []
              }
              selected={formData}
              onPick={(point) =>
                setFormData({ ...formData, ...point, map_provider: "openstreetmap" })
              }
              height={240}
            />
            <p className="mt-2 text-xs text-slate-500">
              Có thể tìm kiếm hoặc bấm trực tiếp lên bản đồ để chọn tọa độ.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label>Thành viên tham gia</label>
            <div className="mt-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {members?.map((member) => (
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
                    onChange={() => {
                      setFormData((prev) => {
                        const checked = prev.participants.includes(member.user_id);
                        return {
                          ...prev,
                          participants: checked
                            ? prev.participants.filter((id) => id !== member.user_id)
                            : [...prev.participants, member.user_id],
                        };
                      });
                    }}
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
        </div>
        <button className="btn-primary mt-6 w-full">Lưu hoạt động</button>
      </form>
    </Modal>
  );
}
