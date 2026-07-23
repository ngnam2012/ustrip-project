import { Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorBox, Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, dateText, currency } from "../lib/api";
import { MapView } from "../components/MapView";
import { Head } from "./shared";

export function ActivityDetailPage() {
  const { tripId, activityId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useRemote(`/activities/${activityId}`);
  if (loading) return <Loader />;
  return (
    <>
      <Head
        eyebrow="Chi tiết hoạt động"
        title={data?.title}
        action={
          <button
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
        }
      />
      <ErrorBox message={error} />
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
