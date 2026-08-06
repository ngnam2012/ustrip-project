import { CalendarDays, GripVertical, MapPin, MoveRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Empty, ErrorBox, Loader, Modal } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
import { LocationSearchInput, MapView } from "../components/MapView";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Head } from "./shared";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

const isoDate = (value) => new Date(`${value}T00:00:00`);
const toIsoDate = (value) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

const tripDays = (trip) => {
  if (!trip?.start_date || !trip?.end_date) return [];
  const days = [];
  for (let cursor = isoDate(trip.start_date); cursor <= isoDate(trip.end_date); cursor.setDate(cursor.getDate() + 1)) {
    days.push(toIsoDate(new Date(cursor)));
  }
  return days;
};

const hasValidDuration = (activity) => {
  if (!activity?.activity_date || !activity?.start_time || !activity?.end_time) return false;
  const start = new Date(`${activity.activity_date}T${activity.start_time}`);
  const end = new Date(`${activity.end_date || activity.activity_date}T${activity.end_time}`);
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end > start;
};

export function ItineraryPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useRemote(
    `/trips/${tripId}/activities`,
  );
  const { data: trip, loading: tripLoading } = useRemote(`/trips/${tripId}`);
  const { data: members, loading: membersLoading } = useRemote(
    `/trips/${tripId}/members`,
  );
  const [showForm, setShowForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null);
  const [movePicker, setMovePicker] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [moving, setMoving] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    try {
      await api(`/activities/${activityToDelete.original_id || activityToDelete.id}`, { method: "DELETE" });
      toast.success("Đã xóa hoạt động");
      setActivityToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const editActivity = (activity) => {
    // If this is an expanded occurrence, load the original full activity
    (async () => {
      try {
        if (activity?.original_id && data) {
          const orig = data.find((a) => a.id === activity.original_id);
          if (orig) return setEditingActivity(orig);
          // fallback: fetch from API
          const fetched = await api(`/activities/${activity.original_id}`);
          return setEditingActivity(fetched);
        }
      } catch (e) {
        // ignore and fall through
      }
      setEditingActivity(activity);
    })();
  };
  const occurrences = useMemo(() => {
    if (!data) return [];
    const out = [];
    for (const act of data) {
      const start = new Date(act.activity_date);
      const end = act.end_date ? new Date(act.end_date) : new Date(act.activity_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = new Date(d).toISOString().split("T")[0];
        const isFirst = dateStr === (act.activity_date || dateStr);
        const isLast = dateStr === (act.end_date || act.activity_date || dateStr);
        let occStart = null;
        let occEnd = null;
        if (isFirst) {
          occStart = act.start_time ? act.start_time.slice(0, 5) : null;
          occEnd = isLast ? (act.end_time ? act.end_time.slice(0, 5) : null) : "23:59";
        } else if (isLast) {
          occStart = "00:00";
          occEnd = act.end_time ? act.end_time.slice(0, 5) : null;
        } else {
          occStart = "00:00";
          occEnd = "23:59";
        }
        out.push({
          ...act,
          original_id: act.id,
          activity_date: dateStr,
          start_time: occStart,
          end_time: occEnd,
          is_continuation: !isFirst,
        });
      }
    }
    return out;
  }, [data]);

  const groups = useMemo(() => {
    const items = occurrences || [];
    const grouped = Object.groupBy
      ? Object.groupBy(items, (x) => x.activity_date)
      : items.reduce((r, x) => ({ ...r, [x.activity_date]: [...(r[x.activity_date] || []), x] }), {});
    // sort each day's items by start_time (nulls at end)
    Object.keys(grouped).forEach((k) => {
      grouped[k].sort((a, b) => {
        const ta = a.start_time || "";
        const tb = b.start_time || "";
        return ta < tb ? -1 : ta > tb ? 1 : 0;
      });
    });
    return grouped;
  }, [occurrences]);
  const days = useMemo(() => tripDays(trip), [trip]);

  const moveActivity = async (activity, sourceDate, targetDate, startTimeOverride = null) => {
    if (!hasValidDuration(activity)) {
      toast.error("Hãy chỉnh giờ kết thúc sau giờ bắt đầu trước khi di chuyển");
      editActivity(activity);
      return;
    }
    setMoving(true);
    try {
      await api(`/activities/${activity.original_id || activity.id}/move`, {
        method: "POST",
        body: {
          source_occurrence_date: sourceDate,
          target_occurrence_date: targetDate,
          ...(startTimeOverride ? { start_time_override: startTimeOverride } : {}),
        },
      });
      setConflict(null);
      setMovePicker(null);
      toast.success(`Đã chuyển hoạt động sang ${dateText(targetDate)}`);
      await reload();
    } catch (err) {
      if (err.code === "schedule_conflict") {
        setConflict({ activity, sourceDate, targetDate, ...err.data });
      } else if (err.code === "invalid_duration") {
        toast.error(err.message);
        editActivity(activity);
      } else {
        toast.error(err.message);
      }
    } finally {
      setMoving(false);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveDrag(null);
    if (!over || !String(over.id).startsWith("day:")) return;
    const dragData = active.data.current;
    const targetDate = String(over.id).slice(4);
    if (!dragData?.activity || targetDate === dragData.sourceDate) return;
    moveActivity(dragData.activity, dragData.sourceDate, targetDate);
  };

  if (loading || tripLoading) return <Loader />;
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
      {!days.length ? (
        <Empty
          title="Chưa xác định thời gian chuyến đi"
          detail="Cập nhật ngày bắt đầu và kết thúc để sắp xếp lịch trình."
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setActiveDrag(active.data.current || null)}
          onDragCancel={() => setActiveDrag(null)}
          onDragEnd={handleDragEnd}
        >
          <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
            <b>Kéo activity sang tiêu đề ngày khác để đổi lịch.</b> Giờ và thời lượng được giữ nguyên. Hoạt động có thời gian chưa hợp lệ phải chỉnh sửa trước.
          </div>
          <div className="space-y-6">
            {days.map((date) => (
              <ItineraryDay
                key={date}
                date={date}
                items={groups[date] || []}
                tripId={tripId}
                onEdit={editActivity}
                onDelete={setActivityToDelete}
                onMove={(activity) => setMovePicker({ activity, sourceDate: date })}
                moving={moving}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDrag?.activity ? <div className="w-80 rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl"><p className="font-bold text-ink">{activeDrag.activity.title}</p><p className="mt-1 text-sm text-travel">{activeDrag.activity.start_time?.slice(0, 5)} – {activeDrag.activity.end_time?.slice(0, 5)}</p></div> : null}
          </DragOverlay>
        </DndContext>
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
      {movePicker && (
        <Modal title="Di chuyển hoạt động" onClose={() => setMovePicker(null)}>
          <p className="mb-4 text-sm text-slate-500">Chọn ngày mới cho <b className="text-ink">{movePicker.activity.title}</b>. Toàn bộ activity nhiều ngày sẽ được dịch chuyển tương ứng.</p>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto sm:grid-cols-2">
            {days.map((date) => <button
              key={date}
              type="button"
              disabled={moving || date === movePicker.sourceDate}
              onClick={() => moveActivity(movePicker.activity, movePicker.sourceDate, date)}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold transition hover:border-travel hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            ><span className="flex items-center gap-2"><CalendarDays size={16} />{dateText(date)}</span><MoveRight size={15} /></button>)}
          </div>
        </Modal>
      )}
      {conflict && (
        <ConflictModal
          conflict={conflict}
          moving={moving}
          onClose={() => setConflict(null)}
          onSuggestion={(suggestion) => moveActivity(
            conflict.activity,
            conflict.sourceDate,
            conflict.targetDate,
            suggestion.start_time?.slice(0, 5),
          )}
        />
      )}
      {activityToDelete && (
        <Modal title="Xác nhận xóa" onClose={() => setActivityToDelete(null)}>
          <p className="mb-6 text-sm text-slate-600">Bạn có chắc chắn muốn xóa hoạt động <b className="text-ink">{activityToDelete.title}</b> không?</p>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setActivityToDelete(null)}>Hủy</button>
            <button className="btn-coral" onClick={confirmDelete}>Xóa hoạt động</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function ItineraryDay({ date, items, tripId, onEdit, onDelete, onMove, moving }) {
  const [open, setOpen] = useState(true);
  const { isOver, setNodeRef } = useDroppable({ id: `day:${date}` });
  return (
    <section ref={setNodeRef} className={`rounded-2xl border-2 p-2 transition-colors ${isOver ? "border-travel bg-blue-50/80" : "border-transparent"}`}>
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
            className="relative space-y-3 overflow-hidden pl-8"
          >
            <div className="absolute bottom-0 left-4 top-0 border-l-2 border-dashed border-blue-200/60" />
            {!items.length && <div className={`relative rounded-xl border border-dashed px-4 py-6 text-center text-sm ${isOver ? "border-travel bg-white text-travel" : "border-slate-200 text-slate-400"}`}>Thả hoạt động vào ngày này</div>}
            {items.map((item) => <DraggableActivity
              key={`${item.original_id || item.id}-${item.activity_date}`}
              item={item}
              tripId={tripId}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              moving={moving}
            />)}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

<<<<<<< HEAD
function DraggableActivity({ item, tripId, onEdit, onDelete, onMove, moving }) {
  const draggable = hasValidDuration(item) && !moving;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `activity:${item.original_id || item.id}:${item.activity_date}`,
    disabled: !draggable,
    data: { activity: item, sourceDate: item.activity_date },
  });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return <div
    ref={setNodeRef}
    style={style}
    className={`card relative block border-l-4 border-l-travel/80 transition-shadow duration-200 hover:shadow-lift ${isDragging ? "z-50 opacity-30" : ""}`}
  >
    <span className="absolute -left-[25px] top-6 h-3 w-3 rounded-full bg-travel ring-4 ring-blue-50 shadow-sm" />
    <div className="flex flex-wrap justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={!draggable}
          title={draggable ? "Kéo sang ngày khác" : "Cần sửa thời gian trước khi kéo"}
          aria-label={draggable ? `Kéo ${item.title} sang ngày khác` : `${item.title} có thời gian chưa hợp lệ`}
          className="mt-0.5 grid h-9 w-9 shrink-0 touch-none place-items-center rounded-xl bg-blue-50 text-travel transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-red-50 disabled:text-red-400"
        ><GripVertical size={18} /></button>
        <div className="min-w-0">
          <Link to={`/trips/${tripId}/activities/${item.original_id || item.id}`} className="font-bold text-ink hover:text-travel">
            {item.title}
            {item.is_continuation && <span className="ml-2 text-xs text-slate-400">(Tiếp tục)</span>}
          </Link>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} />{item.location || "Chưa đặt địa điểm"}</p>
          {!draggable && <button type="button" onClick={() => onEdit(item)} className="mt-2 text-xs font-bold text-red-600 hover:text-red-700">Cần sửa thời gian trước khi di chuyển</button>}
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${draggable ? "text-travel" : "text-red-500"}`}>{item.start_time?.slice(0, 5) || "--:--"} - {item.end_time?.slice(0, 5) || "--:--"}</p>
        <p className="mt-1 text-xs text-slate-400">{currency(item.estimated_cost)}</p>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap justify-end gap-3">
      <button type="button" disabled={!draggable} className="flex items-center gap-1 text-sm font-semibold text-violet-600 transition hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => onMove(item)}><MoveRight size={15} />Di chuyển</button>
      <button type="button" className="text-sm font-semibold text-blue-600 transition hover:text-blue-800" onClick={() => onEdit(item)}>Chỉnh sửa</button>
      <button type="button" className="text-sm font-semibold text-red-500 transition hover:text-red-700" onClick={() => onDelete(item)}>Xóa</button>
    </div>
  </div>;
}

function ConflictModal({ conflict, moving, onClose, onSuggestion }) {
  return <Modal title="Xung đột thời gian" onClose={onClose}>
    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
      Không thể chuyển <b>{conflict.activity.title}</b> sang {dateText(conflict.targetDate)} vì đang trùng lịch.
    </div>
    <div className="mt-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Hoạt động đang trùng</p>
      <div className="mt-2 space-y-2">{conflict.conflicts?.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><b>{item.title}</b><span className="text-slate-500">{dateText(item.activity_date)} · {item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}</span></div>)}</div>
    </div>
    <div className="mt-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Khung giờ trống gần nhất</p>
      {!conflict.suggestions?.length ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Không còn khung giờ phù hợp trong ngày này. Hãy chọn ngày khác.</p> : <div className="mt-2 grid gap-2">{conflict.suggestions.map((suggestion) => <button
        key={`${suggestion.activity_date}-${suggestion.start_time}`}
        type="button"
        disabled={moving}
        onClick={() => onSuggestion(suggestion)}
        className="flex items-center justify-between rounded-xl border border-blue-200 px-4 py-3 text-sm font-bold text-travel transition hover:bg-blue-50 disabled:opacity-50"
      ><span>{dateText(suggestion.activity_date)}</span><span>{suggestion.start_time?.slice(0, 5)} – {suggestion.end_time?.slice(0, 5)}</span></button>)}</div>}
    </div>
    <button type="button" onClick={onClose} className="btn-secondary mt-5 w-full">Hủy di chuyển</button>
  </Modal>;
}

export function ActivityForm({ tripId, members = [], activity, onClose, onSaved }) {
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
        end_datetime: `${activity.end_date || activity.activity_date || ""}T${activity.end_time?.slice(0, 5) || "00:00"}`,
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
      const startValue = new Date(formData.start_datetime);
      const endValue = new Date(formData.end_datetime);
      if (!formData.start_datetime || !formData.end_datetime || endValue <= startValue) {
        throw new Error("Giờ kết thúc phải sau giờ bắt đầu");
      }
      const startDate = formData.start_datetime.split("T");
      const endDate = formData.end_datetime.split("T");
      await api(activity ? `/activities/${activity.id}` : `/trips/${tripId}/activities`, {
        method: activity ? "PATCH" : "POST",
        body: {
          title: formData.title,
          activity_date: startDate[0] || "",
          end_date: endDate[0] || startDate[0] || "",
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
    <Modal title={activity ? "Chỉnh sửa hoạt động" : "Thêm hoạt động"} onClose={onClose}>
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
              required
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
