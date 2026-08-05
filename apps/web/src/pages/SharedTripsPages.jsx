import {
  ArrowRight, CalendarDays, Copy, Globe, Link2, Lock, MapPin, MessageCircle,
  Send, Star, Users, X, Check, Trash2, ChevronRight, Sparkles, Share2, Pencil
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api, dateText } from '../lib/api';
import { useRemote } from '../hooks/useRemote';
import { useAuth } from '../context/AuthContext';
import { ErrorBox, Loader, Modal } from '../components/ui';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const defaultCovers = [
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?q=80&w=1200&auto=format&fit=crop',
];
const getCover = (trip, i) => {
  if (trip?.cover_image_url) return trip.cover_image_url;
  const h = trip?.id ? String(trip.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) : (i || 0);
  return defaultCovers[h % defaultCovers.length];
};

const durationDays = (start, end) => {
  if (!start || !end) return 0;
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
};

// ─────────────────────────────────────────────────────────────
// StarRating — interactive or display-only
// ─────────────────────────────────────────────────────────────
function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={`transition-colors ${n <= display ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TripCommunityCard — card shown in the Explore feed
// ─────────────────────────────────────────────────────────────
function TripCommunityCard({ trip, index }) {
  const days = durationDays(trip.start_date, trip.end_date);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/shared-trips/${trip.id}`}
        className="group block overflow-hidden rounded-2xl bg-white border border-slate-100/80 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-blue-100/60"
      >
        {/* Cover */}
        <div
          className="relative h-44 bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `linear-gradient(0deg,rgba(0,0,0,.3),rgba(0,0,0,.02)),url(${getCover(trip, index)})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {/* Days badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm">
            <CalendarDays size={11} /> {days} ngày
          </div>
          {/* Author avatar */}
          {trip.author && (
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 grid place-items-center text-xs font-bold text-white ring-2 ring-white shadow">
                {trip.author.avatar_url
                  ? <img src={trip.author.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  : trip.author.full_name?.[0]}
              </div>
              <span className="text-xs font-semibold text-white/90 drop-shadow">{trip.author.full_name}</span>
            </div>
          )}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight size={18} className="text-white/80" />
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-bold text-ink text-base leading-snug group-hover:text-travel transition-colors">{trip.name}</h3>
          <p className="mt-1.5 flex items-center gap-1 text-sm text-slate-500"><MapPin size={13} />{trip.destination}</p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <StarRating value={Math.round(trip.avg_rating || 0)} readonly size={14} />
              <span className="text-xs font-semibold text-slate-500 ml-1">
                {trip.avg_rating ? trip.avg_rating.toFixed(1) : '—'}
                {trip.rating_count > 0 && <span className="text-slate-400 font-normal"> ({trip.rating_count})</span>}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Copy size={12} /> {trip.clone_count} lượt sao chép
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// ExplorePage — Community feed
// ─────────────────────────────────────────────────────────────
export function ExplorePage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const endpoint = query
    ? `/shared-trips?destination=${encodeURIComponent(query)}`
    : '/shared-trips';
  const { data, loading, error, reload } = useRemote(endpoint, [query]);
  const trips = Array.isArray(data) ? data : [];

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <p className="page-eyebrow">Cộng đồng</p>
        <h1 className="page-title mt-1">Khám phá hành trình</h1>
        <p className="mt-2 text-slate-500 text-sm max-w-lg">
          Khám phá lịch trình từ cộng đồng UsTrip. Sao chép, đánh giá và chia sẻ hành trình của bạn.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8 flex gap-2 max-w-md">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="explore-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo điểm đến..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-travel/30 focus:border-travel transition"
          />
        </div>
        <button type="submit" className="btn-primary px-4 py-2.5 text-sm">Tìm</button>
        {query && (
          <button type="button" onClick={() => { setSearch(''); setQuery(''); }} className="rounded-xl px-3 text-slate-400 hover:text-slate-600 border border-slate-200 transition">
            <X size={16} />
          </button>
        )}
      </form>

      <ErrorBox message={error} />

      {loading ? (
        <Loader />
      ) : trips.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card py-20 text-center">
          <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-violet-50 to-blue-50 text-violet-400 shadow-sm">
            <Globe size={36} />
          </div>
          <h3 className="text-xl font-bold text-ink">
            {query ? `Không tìm thấy chuyến đi tại "${query}"` : 'Chưa có chuyến đi nào được chia sẻ'}
          </h3>
          <p className="mt-2 text-slate-500 text-sm max-w-xs mx-auto">
            {query ? 'Thử tìm kiếm với từ khóa khác.' : 'Hãy là người đầu tiên chia sẻ hành trình của bạn với cộng đồng!'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip, i) => <TripCommunityCard key={trip.id} trip={trip} index={i} />)}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// CommentItem — single comment with optional thread indicator
// ─────────────────────────────────────────────────────────────
function CommentItem({ comment, currentUserId, onDelete, onReply }) {
  const [confirming, setConfirming] = useState(false);
  const isOwn = comment.author?.id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${comment.parent_id ? 'ml-10 mt-2' : 'mt-4'}`}
    >
      <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 grid place-items-center text-xs font-bold text-white ring-2 ring-white shadow-sm">
        {comment.author?.avatar_url
          ? <img src={comment.author.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          : comment.author?.full_name?.[0] || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-ink">{comment.author?.full_name || 'Unknown'}</span>
            <span className="text-[10px] text-slate-400">{dateText(comment.created_at)}</span>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
        <div className="flex gap-3 mt-1.5 px-1">
          <button onClick={() => onReply(comment)} className="text-[11px] font-semibold text-slate-400 hover:text-travel transition">
            Trả lời
          </button>
          {isOwn && (
            confirming ? (
              <span className="flex items-center gap-2">
                <button onClick={() => onDelete(comment.id)} className="text-[11px] font-semibold text-red-500 hover:text-red-700 transition">Xác nhận xóa</button>
                <button onClick={() => setConfirming(false)} className="text-[11px] text-slate-400 hover:text-slate-600 transition">Hủy</button>
              </span>
            ) : (
              <button onClick={() => setConfirming(true)} className="text-[11px] font-semibold text-slate-400 hover:text-red-400 transition flex items-center gap-1">
                <Trash2 size={10} /> Xóa
              </button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// SharedTripDetailPage — full shared trip view
// ─────────────────────────────────────────────────────────────
export function SharedTripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: trip, loading, error, reload } = useRemote(`/shared-trips/${tripId}`);
  const { data: commentsData, reload: reloadComments } = useRemote(`/shared-trips/${tripId}/comments`);
  const comments = Array.isArray(commentsData) ? commentsData : [];

  const [cloning, setCloning] = useState(false);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [localRating, setLocalRating] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isOwner = trip?.created_by === user?.id;

  const handleClone = async () => {
    if (cloning) return;
    setCloning(true);
    try {
      const newTrip = await api(`/shared-trips/${tripId}/clone`, { method: 'POST' });
      setCloneSuccess(true);
      setTimeout(() => navigate(`/trips/${newTrip.id}`), 1500);
    } catch (e) {
      alert(e.message);
      setCloning(false);
    }
  };

  const handleRate = async (value) => {
    setLocalRating(value);
    setRatingSubmitting(true);
    try {
      await api(`/shared-trips/${tripId}/ratings`, { method: 'POST', body: { rating: value } });
      reload();
    } catch (e) {
      alert(e.message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await api(`/shared-trips/${tripId}/comments`, {
        method: 'POST',
        body: { content: commentText.trim(), parent_id: replyTo?.id || null }
      });
      setCommentText('');
      setReplyTo(null);
      reloadComments();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api(`/shared-trips/${tripId}/comments/${commentId}`, { method: 'DELETE' });
      reloadComments();
    } catch (e) {
      alert(e.message);
    }
  };

  // Group comments: top-level + replies
  const topLevel = comments.filter(c => !c.parent_id);
  const getReplies = (parentId) => comments.filter(c => c.parent_id === parentId);

  if (loading) return <Loader />;
  if (error) return <ErrorBox message={error} />;
  if (!trip) return null;

  const currentRating = localRating ?? trip.own_rating;
  const days = durationDays(trip.start_date, trip.end_date);

  // Group activities by day
  const actsByDate = (trip.activities || []).reduce((acc, act) => {
    const d = act.activity_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(act);
    return acc;
  }, {});

  return (
    <>
      {/* Hero */}
      <section
        className="relative mb-6 sm:mb-8 min-h-64 sm:min-h-72 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-violet-700 bg-cover bg-center p-5 sm:p-8 text-white shadow-lift"
        style={{ backgroundImage: `linear-gradient(90deg,rgba(0,20,80,.85),rgba(80,40,180,.4)),url(${getCover(trip)})` }}
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {/* Attribution banner */}
          {trip.cloned_from?.original_trip_id && (
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white/80">
              <Copy size={12} />
              Sao chép từ hành trình của {trip.cloned_from?.original?.author?.full_name || 'Unknown'}: "{trip.cloned_from?.original?.name}"
            </div>
          )}

          {/* Top row: Badges & Owner Action */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="badge bg-white/15 text-white border border-white/10 backdrop-blur-sm text-xs">
              <Globe size={12} /> Chia sẻ cộng đồng
            </span>
            {isOwner && (
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white text-travel px-3 py-1.5 text-xs font-bold shadow-sm hover:bg-blue-50 transition"
              >
                <Pencil size={13} /> Chỉnh sửa thông tin chia sẻ
              </button>
            )}
          </div>

          {/* Main Title & Trip Info */}
          <h1 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">{trip.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm text-blue-100/80"><MapPin size={15} />{trip.destination}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 sm:gap-5 text-xs sm:text-sm font-semibold text-blue-100/70">
            <span className="flex items-center gap-1.5"><CalendarDays size={14} />{dateText(trip.start_date)} – {dateText(trip.end_date)}</span>
            <span className="flex items-center gap-1.5"><CalendarDays size={14} />{days} ngày</span>
          </div>

          {/* Author Badge */}
          {trip.author && (
            <div className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/15 backdrop-blur-md px-3 py-1">
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 grid place-items-center text-[10px] font-bold text-white ring-1 ring-white/40 overflow-hidden">
                {trip.author.avatar_url
                  ? <img src={trip.author.avatar_url} alt="" className="h-full w-full object-cover" />
                  : trip.author.full_name?.[0]}
              </div>
              <span className="text-xs font-medium text-white/80">Tác giả: <strong className="text-white font-bold">{trip.author.full_name}</strong></span>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-5 sm:mt-6 flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(trip.avg_rating || 0)} readonly size={16} />
              <span className="font-bold text-white">
                {trip.avg_rating ? trip.avg_rating.toFixed(1) : '—'}
                <span className="text-white/50 font-normal ml-1">({trip.rating_count} đánh giá)</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/70 font-medium">
              <Copy size={14} /> {trip.clone_count} lượt sao chép
            </div>
            <div className="flex items-center gap-1.5 text-white/70 font-medium">
              <MessageCircle size={14} /> {comments.length} bình luận
            </div>
          </div>
        </motion.div>
      </section>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left column: Itinerary + Comments */}
        <div className="xl:col-span-2 space-y-8">

          {/* Itinerary preview */}
          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink mb-5">
              <CalendarDays size={20} className="text-travel" /> Lịch trình hành trình
            </h2>
            {Object.keys(actsByDate).length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-400">Hành trình này chưa có hoạt động nào.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(actsByDate).map(([date, acts], di) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-travel to-violet-600 text-xs font-bold text-white shadow-sm">
                        {di + 1}
                      </div>
                      <span className="text-sm font-bold text-ink">{dateText(date)}</span>
                    </div>
                    <div className="space-y-2 pl-10">
                      {acts.map(act => (
                        <div key={act.id} className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-100">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm text-ink">{act.title}</p>
                              {act.location && (
                                <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin size={11} />{act.location_name || act.location}
                                </p>
                              )}
                              {act.notes && <p className="mt-1 text-xs text-slate-400 italic">{act.notes}</p>}
                            </div>
                            {act.start_time && (
                              <span className="shrink-0 text-xs font-semibold text-travel bg-blue-50 rounded-lg px-2 py-1">
                                {act.start_time?.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink mb-2">
              <MessageCircle size={20} className="text-violet-500" /> Bình luận
            </h2>

            {/* Reply indicator */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-100 px-3 py-2 mb-3">
                  <span className="text-xs text-blue-600 font-semibold">
                    Đang trả lời <strong>{replyTo.author?.full_name}</strong>: "{replyTo.content.slice(0, 40)}..."
                  </span>
                  <button onClick={() => setReplyTo(null)} className="text-blue-400 hover:text-blue-600 transition">
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment input */}
            <form onSubmit={handleComment} className="flex gap-2 mb-4">
              <input
                id="comment-input"
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder={replyTo ? 'Viết trả lời...' : 'Viết bình luận...'}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-travel/30 focus:border-travel transition"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </form>

            {/* Comment list */}
            <div className="space-y-1">
              {topLevel.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              ) : (
                topLevel.map(c => (
                  <div key={c.id}>
                    <CommentItem
                      comment={c}
                      currentUserId={user?.id}
                      onDelete={handleDeleteComment}
                      onReply={setReplyTo}
                    />
                    {getReplies(c.id).map(r => (
                      <CommentItem
                        key={r.id}
                        comment={r}
                        currentUserId={user?.id}
                        onDelete={handleDeleteComment}
                        onReply={setReplyTo}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Actions */}
        <div className="space-y-5">

          {/* Owner options */}
          {isOwner && (
            <div className="card border-2 border-violet-200 bg-gradient-to-br from-violet-50/60 to-blue-50/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-travel text-white shadow-md">
                  <Pencil size={20} />
                </div>
                <div>
                  <p className="font-bold text-ink">Chuyến đi của bạn</p>
                  <p className="text-xs text-slate-500">Bạn là người sở hữu hành trình này</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Tùy chỉnh tên, mô tả, ảnh bìa và quyền chia sẻ hiển thị trên trang Khám phá.
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="w-full rounded-xl bg-gradient-to-r from-travel to-violet-600 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2"
                >
                  <Pencil size={15} /> Chỉnh sửa tên, mô tả & ảnh bìa
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full rounded-xl border border-violet-200 bg-white py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-50 transition flex items-center justify-center gap-2"
                >
                  <Share2 size={15} /> Cài đặt quyền riêng tư & Link chia sẻ
                </button>
              </div>
            </div>
          )}

          {/* Clone CTA */}
          {!isOwner && (
            <div className="card border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50/60 to-violet-50/40">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-travel to-violet-600 text-white shadow-md">
                  <Copy size={20} />
                </div>
                <div>
                  <p className="font-bold text-ink">Sao chép hành trình</p>
                  <p className="text-xs text-slate-500">Thêm vào chuyến đi của bạn</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Sao chép toàn bộ lịch trình này vào tài khoản của bạn và tùy chỉnh theo ý muốn.
              </p>
              <AnimatePresence mode="wait">
                {cloneSuccess ? (
                  <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 justify-center rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white">
                    <Check size={16} /> Đã sao chép! Đang chuyển hướng...
                  </motion.div>
                ) : (
                  <motion.button
                    key="cta"
                    id="clone-trip-btn"
                    onClick={handleClone}
                    disabled={cloning}
                    whileTap={{ scale: 0.97 }}
                    className="w-full rounded-xl bg-gradient-to-r from-travel to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {cloning ? 'Đang sao chép...' : <><Copy size={15} /> Sao chép vào chuyến đi của tôi</>}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Rate this trip */}
          {!isOwner && (
            <div className="card">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Star size={18} className="text-amber-400 fill-amber-400" /> Đánh giá hành trình
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                {currentRating ? `Bạn đã đánh giá ${currentRating} sao. Bấm để thay đổi.` : 'Hành trình này như thế nào?'}
              </p>
              <StarRating value={currentRating || 0} onChange={handleRate} size={28} />
              {ratingSubmitting && <p className="mt-2 text-xs text-slate-400 animate-pulse">Đang lưu...</p>}
            </div>
          )}

          {/* Trip description */}
          {trip.description && (
            <div className="card">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-violet-400" /> Mô tả
              </h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{trip.description}</p>
            </div>
          )}

          {/* Quick stats */}
          <div className="card bg-gradient-to-br from-slate-50 to-white">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Thời gian', `${days} ngày`],
                ['Điểm đến', trip.destination],
                ['Hoạt động', `${(trip.activities || []).length} mục`],
                ['Lượt sao chép', trip.clone_count],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                  <p className="text-sm font-bold text-ink mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showShareModal && (
        <ShareTripModal
          tripId={tripId}
          currentVisibility={trip.visibility}
          tripData={trip}
          onClose={() => setShowShareModal(false)}
          onSaved={() => reload()}
        />
      )}

      {showEditModal && (
        <EditSharedTripModal
          trip={trip}
          onClose={() => setShowEditModal(false)}
          onSaved={() => reload()}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// ShareTripModal — owner sets visibility + copies link
// When public is chosen, an edit panel expands so they can
// curate the trip's public presentation (title, description, cover).
// ─────────────────────────────────────────────────────────────
export function ShareTripModal({ tripId, currentVisibility = 'private', tripData = {}, onClose, onSaved }) {
  const [visibility, setVisibility] = useState(currentVisibility);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable public fields — pre-filled from current trip data
  const [publicForm, setPublicForm] = useState({
    name: tripData.name || '',
    description: tripData.description || '',
    cover_image_url: tripData.cover_image_url || '',
  });

  const shareUrl = `${window.location.origin}/shared-trips/${tripId}`;

  const options = [
    {
      value: 'private',
      icon: Lock,
      label: 'Riêng tư',
      desc: 'Chỉ các thành viên trong chuyến đi có thể xem.',
      color: 'text-slate-500',
      bg: 'bg-slate-50 border-slate-200',
      active: 'bg-slate-100 border-slate-400',
    },
    {
      value: 'link',
      icon: Link2,
      label: 'Chia sẻ qua link',
      desc: 'Bất kỳ ai có đường link đều có thể xem.',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
      active: 'bg-blue-100 border-blue-500',
    },
    {
      value: 'public',
      icon: Globe,
      label: 'Công khai',
      desc: 'Xuất hiện trong trang Khám phá cộng đồng.',
      color: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-200',
      active: 'bg-violet-100 border-violet-500',
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // If going public, also update the trip's public-facing fields
      if (visibility === 'public') {
        const updates = {};
        if (publicForm.name.trim()) updates.name = publicForm.name.trim();
        if (publicForm.description.trim() !== (tripData.description || '').trim())
          updates.description = publicForm.description.trim();
        if (publicForm.cover_image_url.trim() !== (tripData.cover_image_url || '').trim())
          updates.cover_image_url = publicForm.cover_image_url.trim() || null;
        if (Object.keys(updates).length > 0) {
          await api(`/trips/${tripId}`, { method: 'PATCH', body: updates });
        }
      }
      await api(`/trips/${tripId}/share`, { method: 'POST', body: { visibility } });
      onSaved?.(visibility);
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal title="Chia sẻ hành trình" onClose={onClose}>
      <div className="space-y-3 mb-5">
        {options.map(opt => {
          const Icon = opt.icon;
          const isSelected = visibility === opt.value;
          return (
            <button
              key={opt.value}
              id={`visibility-${opt.value}`}
              onClick={() => setVisibility(opt.value)}
              className={`w-full text-left flex items-start gap-4 rounded-2xl border-2 p-4 transition-all ${isSelected ? opt.active : opt.bg} hover:brightness-95`}
            >
              <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${isSelected ? 'bg-white shadow-sm' : 'bg-white/60'}`}>
                <Icon size={18} className={opt.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-bold text-sm ${isSelected ? 'text-ink' : 'text-slate-600'}`}>{opt.label}</p>
                  {isSelected && <Check size={16} className={opt.color} />}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Shareable link — for link or public modes */}
      <AnimatePresence>
        {(visibility === 'link' || visibility === 'public') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="text-xs font-semibold text-blue-600 mb-2">Link chia sẻ</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-600 focus:outline-none"
                />
                <button
                  id="copy-link-btn"
                  onClick={handleCopy}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center gap-1"
                >
                  {copied ? <><Check size={12} /> Đã chép!</> : <><Copy size={12} /> Sao chép</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Public profile editor — only shown when "public" is selected */}
      <AnimatePresence>
        {visibility === 'public' && (
          <motion.div
            key="public-editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-br from-violet-50/60 to-white p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 text-violet-600">
                  <Sparkles size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">Hồ sơ công khai</p>
                  <p className="text-[11px] text-slate-500">Tùy chỉnh thông tin hiển thị trên trang Khám phá</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Tên hành trình</label>
                <input
                  id="public-trip-name"
                  type="text"
                  value={publicForm.name}
                  onChange={e => setPublicForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Tên hiển thị trên trang cộng đồng..."
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Mô tả</label>
                <textarea
                  id="public-trip-desc"
                  rows={3}
                  value={publicForm.description}
                  onChange={e => setPublicForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Chia sẻ điểm nổi bật của chuyến đi để thu hút cộng đồng..."
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                />
              </div>

              {/* Cover image URL */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Ảnh bìa (URL)</label>
                <input
                  id="public-cover-url"
                  type="url"
                  value={publicForm.cover_image_url}
                  onChange={e => setPublicForm(f => ({ ...f, cover_image_url: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                />
                {publicForm.cover_image_url && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 overflow-hidden rounded-xl border border-violet-100"
                  >
                    <img
                      src={publicForm.cover_image_url}
                      alt="Cover preview"
                      className="h-28 w-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Hủy</button>
        <button
          id="save-visibility-btn"
          onClick={handleSave}
          disabled={saving || (
            visibility === currentVisibility &&
            !(visibility === 'public' && (
              publicForm.name.trim() !== (tripData.name || '').trim() ||
              publicForm.description.trim() !== (tripData.description || '').trim() ||
              publicForm.cover_image_url.trim() !== (tripData.cover_image_url || '').trim()
            ))
          )}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// EditSharedTripModal — Owner inline editor for shared trip content
// Allows modifying Title, Description, Cover Image, & Privacy
// without navigating away to the dashboard.
// ─────────────────────────────────────────────────────────────
export function EditSharedTripModal({ trip, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: trip?.name || '',
    description: trip?.description || '',
    cover_image_url: trip?.cover_image_url || '',
    visibility: trip?.visibility || 'public',
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/shared-trips/${trip?.id}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update trip name, description, cover_image_url
      await api(`/trips/${trip.id}`, {
        method: 'PATCH',
        body: {
          name: form.name.trim(),
          description: form.description.trim(),
          cover_image_url: form.cover_image_url.trim() || null,
        }
      });

      // 2. Update visibility if changed
      if (form.visibility !== trip.visibility) {
        await api(`/trips/${trip.id}/share`, {
          method: 'POST',
          body: { visibility: form.visibility }
        });
      }

      onSaved?.();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal title="Chỉnh sửa thông tin chia sẻ" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Tên hành trình chia sẻ</label>
          <input
            required
            id="edit-shared-name"
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Tên chuyến đi..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-travel/30 focus:border-travel transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Mô tả chuyến đi</label>
          <textarea
            id="edit-shared-desc"
            rows={4}
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Chia sẻ thêm thông tin hoặc lời khuyên cho hành trình này..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-travel/30 focus:border-travel transition"
          />
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Link ảnh bìa (Cover Image URL)</label>
          <input
            id="edit-shared-cover"
            type="url"
            value={form.cover_image_url}
            onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-travel/30 focus:border-travel transition"
          />
          {form.cover_image_url && (
            <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
              <img
                src={form.cover_image_url}
                alt="Preview"
                className="h-32 w-full object-cover"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        {/* Visibility */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-slate-600">Quyền riêng tư / Chia sẻ</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'private', label: 'Riêng tư', icon: Lock },
              { id: 'link', label: 'Qua Link', icon: Link2 },
              { id: 'public', label: 'Công khai', icon: Globe },
            ].map(opt => {
              const Icon = opt.icon;
              const active = form.visibility === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setForm({ ...form, visibility: opt.id })}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                    active
                      ? 'border-travel bg-blue-50/70 text-travel'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} className="mb-1" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Shareable Link Box */}
        {(form.visibility === 'link' || form.visibility === 'public') && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
            <p className="text-xs font-semibold text-blue-600 mb-1.5">Link chia sẻ trực tiếp</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition flex items-center gap-1 shrink-0"
              >
                {copied ? <><Check size={12} /> Đã chép!</> : <><Copy size={12} /> Sao chép</>}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

