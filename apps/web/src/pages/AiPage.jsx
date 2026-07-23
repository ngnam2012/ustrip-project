import { Bot, MapPin, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorBox } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency } from "../lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Head } from "./shared";

export function AiPage() {
  const { tripId } = useParams();
  const { data: tripData } = useRemote(`/trips/${tripId}`);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: "Đà Lạt",
    days: 4,
    budget: "12.000.000đ",
    style: "Khám phá & ẩm thực",
    group: 6,
  });
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const generate = async (event) => {
    event.preventDefault();
    setShown(true);
    setBusy(true);
    setErrorMessage("");
    setResult(null);
    try {
      const res = await api(`/trips/${tripId}/ai/itinerary`, {
        method: "POST",
        body: formData,
      });
      setResult(res.itinerary);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addToItinerary = async () => {
    if (!result || !tripData?.start_date) return;
    setBusy(true);
    try {
      const startDate = new Date(tripData.start_date);
      for (const dayData of result) {
        const activityDate = new Date(startDate);
        activityDate.setDate(startDate.getDate() + (dayData.day - 1));
        const dateString = activityDate.toISOString().split("T")[0];

        for (const activity of dayData.activities) {
          await api(`/trips/${tripId}/activities`, {
            method: "POST",
            body: {
              title: activity.title,
              activity_date: dateString,
              start_time: activity.time || "09:00",
              end_time: "12:00",
              location: activity.location,
              latitude: activity.latitude,
              longitude: activity.longitude,
              description: activity.description,
              estimated_cost: activity.estimated_cost || 0,
            },
          });
        }
      }
      toast.success("Đã thêm vào lịch trình!");
      navigate(`/trips/${tripId}/itinerary`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head eyebrow="AI itinerary" title="Gợi ý lịch trình thông minh" />
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card space-y-4" onSubmit={generate}>
          <div>
            <label>Điểm đến</label>
            <input
              required
              value={formData.destination}
              onChange={(event) =>
                setFormData({ ...formData, destination: event.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Số ngày</label>
              <input
                required
                type="number"
                min="1"
                max="14"
                value={formData.days}
                onChange={(event) =>
                  setFormData({ ...formData, days: event.target.value })
                }
              />
            </div>
            <div>
              <label>Quy mô nhóm</label>
              <input
                required
                type="number"
                min="1"
                value={formData.group}
                onChange={(event) =>
                  setFormData({ ...formData, group: event.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label>Ngân sách</label>
            <input
              required
              value={formData.budget}
              onChange={(event) =>
                setFormData({ ...formData, budget: event.target.value })
              }
            />
          </div>
          <div>
            <label>Phong cách</label>
            <input
              required
              value={formData.style}
              onChange={(event) =>
                setFormData({ ...formData, style: event.target.value })
              }
            />
          </div>
          <button disabled={busy} className="btn-primary w-full">
            <Sparkles size={18} />
            {busy ? "Đang tạo gợi ý..." : "Tạo gợi ý thông minh"}
          </button>
        </form>
        <div className="card border border-blue-100 bg-gradient-to-br from-white to-blue-50">
          {shown ? (
            busy && !result ? (
              <div className="grid h-full min-h-72 place-items-center text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <Sparkles className="text-travel" size={40} />
                </motion.div>
                <p className="mt-4 font-bold text-ink animate-pulse">
                  AI đang thiết kế lịch trình cho bạn...
                </p>
              </div>
            ) : errorMessage ? (
              <ErrorBox message={errorMessage} />
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="badge bg-blue-100 text-travel">
                  <Bot size={14} className="mr-1" />
                  Đã tạo thành công
                </span>
                <h2 className="mt-5 text-xl font-extrabold">
                  {formData.days} ngày khám phá {formData.destination}
                </h2>
                <div className="mt-5 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {result.map((dayData, index) => (
                    <div
                      className="rounded-xl bg-white p-4 shadow-card"
                      key={index}
                    >
                      <p className="font-bold text-travel mb-2">
                        Ngày {dayData.day}: {dayData.title}
                      </p>
                      <div className="space-y-3">
                        {dayData.activities.map((activity, j) => (
                          <div
                            key={j}
                            className="text-sm border-l-2 border-blue-100 pl-3"
                          >
                            <p className="font-semibold text-ink">
                              {activity.time} - {activity.title}
                            </p>
                            {activity.location && (
                              <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                                <MapPin size={12} />
                                {activity.location}
                              </p>
                            )}
                            {activity.description && (
                              <p className="text-slate-500 text-xs mt-0.5">
                                {activity.description}
                              </p>
                            )}
                            {activity.estimated_cost > 0 && (
                              <p className="text-xs mt-0.5 font-semibold text-travel">
                                ~{currency(activity.estimated_cost)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addToItinerary}
                  disabled={busy}
                  className="btn-primary w-full mt-5"
                >
                  <Plus size={18} />
                  Thêm vào lịch trình
                </button>
              </motion.div>
            ) : null
          ) : (
            <div className="grid h-full min-h-72 place-items-center text-center text-slate-500">
              <div>
                <Bot className="mx-auto mb-3 text-travel" size={44} />
                <p className="font-bold">Điền thông tin để xem gợi ý mẫu</p>
                <p className="mt-1 text-sm">
                  Hệ thống sử dụng AI Gemini 3.5 Flash
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
