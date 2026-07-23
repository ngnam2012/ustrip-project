import { MapPin, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Empty, ErrorBox, Loader, Modal } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
import { LocationSearchInput, MapView } from "../components/MapView";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { Head } from "./shared";

export function ItineraryPage() {
  const { tripId } = useParams();
  const { data, loading, error, reload } = useRemote(
    `/trips/${tripId}/activities`,
  );
  const [showForm, setShowForm] = useState(false);
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
            />
          ))}
        </div>
      )}
      {showForm && (
        <ActivityForm
          tripId={tripId}
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

function ItineraryDay({ date, items, tripId }) {
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
              <Link
                to={`/trips/${tripId}/activities/${item.id}`}
                key={item.id}
                className="card relative block border-l-4 border-l-travel/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-l-travel"
              >
                <span className="absolute -left-[32px] top-6 h-3 w-3 rounded-full bg-travel ring-4 ring-blue-50 shadow-sm" />
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-ink">{item.title}</h3>
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
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ActivityForm({ tripId, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: "",
    activity_date: "",
    start_time: "",
    end_time: "",
    location: "",
    location_name: "",
    address: "",
    latitude: null,
    longitude: null,
    map_provider: "openstreetmap",
    estimated_cost: 0,
    notes: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    try {
      await api(`/trips/${tripId}/activities`, { method: "POST", body: formData });
      toast.success("Đã thêm hoạt động");
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
            <label>Ngày</label>
            <input
              required
              type="date"
              value={formData.activity_date}
              onChange={(event) => setFormData({ ...formData, activity_date: event.target.value })}
            />
          </div>
          <div>
            <label>Bắt đầu</label>
            <input
              type="time"
              value={formData.start_time}
              onChange={(event) => setFormData({ ...formData, start_time: event.target.value })}
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
          <div>
            <label>Kết thúc</label>
            <input
              type="time"
              value={formData.end_time}
              onChange={(event) => setFormData({ ...formData, end_time: event.target.value })}
            />
          </div>
          <div>
            <label>Chi phí dự kiến</label>
            <input
              type="number"
              min="0"
              value={formData.estimated_cost}
              onChange={(event) => setFormData({ ...formData, estimated_cost: event.target.value })}
            />
          </div>
        </div>
        <button className="btn-primary mt-6 w-full">Lưu hoạt động</button>
      </form>
    </Modal>
  );
}
