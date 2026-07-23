import { Bell } from "lucide-react";
import { ErrorBox, Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api } from "../lib/api";
import { Head } from "./shared";

export function NotificationsPage() {
  const { data, loading, error, reload } = useRemote("/notifications");
  if (loading) return <Loader />;
  return (
    <>
      <Head eyebrow="Thông báo" title="Cập nhật mới nhất" />
      <ErrorBox message={error} />
      <div className="space-y-3">
        {data?.map((notification) => (
          <button
            onClick={async () => {
              await api(`/notifications/${notification.id}/read`, {
                method: "PATCH",
              });
              reload();
            }}
            key={notification.id}
            className={`card flex w-full gap-4 text-left ${notification.is_read ? "opacity-60" : "border-l-4 border-l-travel"}`}
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-travel">
              <Bell />
            </div>
            <div>
              <p className="font-bold">{notification.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {notification.message}
              </p>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
