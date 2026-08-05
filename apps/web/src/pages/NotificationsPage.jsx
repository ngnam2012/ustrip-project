import { useState } from "react";
import { Bell } from "lucide-react";
import { ErrorBox, Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api } from "../lib/api";
import { Head } from "./shared";

export function NotificationsPage() {
  const { data, loading, error, reload } = useRemote("/notifications");
  const [respondingId, setRespondingId] = useState(null);

  const respondInvitation = async (notification, action) => {
    if (respondingId) return;
    setRespondingId(notification.id + action);
    try {
      await api(`/trips/${notification.trip_id}/members/respond`, {
        method: "POST",
        body: { action },
      });
      await api(`/notifications/${notification.id}/read`, { method: "PATCH" });
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) return <Loader />;
  return (
    <>
      <Head eyebrow="Thông báo" title="Cập nhật mới nhất" />
      <ErrorBox message={error} />
      <div className="space-y-3">
        {data?.map((notification) => {
          const isInvite = notification.type === "member_added" && notification.trip_id && !notification.is_read;
          return (
            <div
              key={notification.id}
              className={`card flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left ${notification.is_read ? "opacity-60" : "border-l-4 border-l-travel"}`}
            >
              <div
                onClick={async () => {
                  if (!notification.is_read) {
                    await api(`/notifications/${notification.id}/read`, {
                      method: "PATCH",
                    });
                    reload();
                  }
                }}
                className="flex items-center gap-4 cursor-pointer flex-1"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-travel shrink-0">
                  <Bell />
                </div>
                <div>
                  <p className="font-bold">{notification.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {notification.message}
                  </p>
                </div>
              </div>
              {isInvite && (
                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={!!respondingId}
                    onClick={() => respondInvitation(notification, "accept")}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {respondingId === notification.id + "accept" ? "..." : "✓ Chấp nhận"}
                  </button>
                  <button
                    disabled={!!respondingId}
                    onClick={() => respondInvitation(notification, "decline")}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {respondingId === notification.id + "decline" ? "..." : "✕ Từ chối"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
