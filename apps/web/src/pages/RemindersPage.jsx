import { Send } from "lucide-react";
import { useParams } from "react-router-dom";
import { Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency, dateText } from "../lib/api";
import { Head } from "./shared";

export function RemindersPage() {
  const { tripId } = useParams();
  const members = useRemote(`/trips/${tripId}/members`);
  const reminders = useRemote(`/trips/${tripId}/reminders`);

  const sendReminder = async (member) => {
    await api(`/trips/${tripId}/reminders`, {
      method: "POST",
      body: {
        recipient_id: member.user_id,
        message: `Nhắc ${member.profile.full_name} hoàn tất khoản đóng góp ${currency(member.remaining_amount)}.`,
      },
    });
    reminders.reload();
  };

  if (members.loading) return <Loader />;
  return (
    <>
      <Head eyebrow="Nhắc thanh toán" title="Nhắc nhẹ, không ngại tiền bạc" />
      <div className="grid gap-4 md:grid-cols-2">
        {members.data
          ?.filter((member) => member.contribution_status !== "paid")
          .map((member) => (
            <div
              className="card flex items-center justify-between gap-4"
              key={member.id}
            >
              <div>
                <p className="font-bold">{member.profile.full_name}</p>
                <p className="mt-1 text-sm text-coral">
                  Còn thiếu {currency(member.remaining_amount)}
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => sendReminder(member)}
              >
                <Send size={16} />
                Gửi nhắc
              </button>
            </div>
          ))}
      </div>
      <h2 className="mb-4 mt-8 text-lg font-bold">Lịch sử nhắc</h2>
      <div className="space-y-3">
        {reminders.data?.map((reminder) => (
          <div className="card" key={reminder.id}>
            <p className="font-bold">{reminder.recipient.full_name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {reminder.message} · {dateText(reminder.sent_at)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
