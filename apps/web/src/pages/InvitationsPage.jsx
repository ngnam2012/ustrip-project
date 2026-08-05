import { CalendarDays, MapPin, Mail, Check, X, Inbox } from 'lucide-react';
import { useState } from 'react';
import { ErrorBox, Loader } from '../components/ui';
import { useRemote } from '../hooks/useRemote';
import { api, dateText } from '../lib/api';
import { Head } from './shared';

export function InvitationsPage() {
  const { data, loading, error, reload } = useRemote('/trips');
  const [respondingId, setRespondingId] = useState(null);

  const pendingInvitations = Array.isArray(data) ? [] : (data?.pending_invitations || []);

  const respondInvitation = async (tripId, action) => {
    if (respondingId) return;
    setRespondingId(tripId + action);
    try {
      await api(`/trips/${tripId}/members/respond`, {
        method: 'POST',
        body: { action }
      });
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
      <Head eyebrow="Lời mời tham gia" title="Chờ bạn phản hồi" />
      <ErrorBox message={error} />

      {!pendingInvitations.length ? (
        <div className="card py-16 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-50 text-slate-400">
            <Inbox size={32} />
          </div>
          <h3 className="text-lg font-bold text-ink">Không có lời mời nào</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Khi ai đó thêm bạn vào một chuyến đi, lời mời sẽ xuất hiện ở đây để bạn chấp nhận hoặc từ chối.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pendingInvitations.map((trip) => (
            <div
              key={trip.id}
              className="rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50/60 to-white p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 mb-2">
                <Mail size={14} />
                <span>Lời mời chuyến đi mới</span>
              </div>
              <h3 className="text-lg font-bold text-ink">{trip.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                <MapPin size={14} className="text-slate-400" />
                {trip.destination}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <CalendarDays size={13} className="text-slate-400" />
                {dateText(trip.start_date)} → {dateText(trip.end_date)}
              </p>
              <div className="mt-5 flex gap-2 border-t border-amber-200/60 pt-4">
                <button
                  disabled={!!respondingId}
                  onClick={() => respondInvitation(trip.id, 'accept')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                  <Check size={16} />
                  {respondingId === trip.id + 'accept' ? 'Đang xử lý...' : 'Chấp nhận'}
                </button>
                <button
                  disabled={!!respondingId}
                  onClick={() => respondInvitation(trip.id, 'decline')}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <X size={16} />
                  {respondingId === trip.id + 'decline' ? 'Đang xử lý...' : 'Từ chối'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
