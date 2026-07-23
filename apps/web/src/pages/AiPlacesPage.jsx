import { MapPin, Sparkles } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorBox } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency } from "../lib/api";
import { MapView } from "../components/MapView";
import { Head } from "./shared";

export function AiPlacesPage() {
  const { tripId } = useParams();
  const { data: tripData } = useRemote(`/trips/${tripId}`);
  const [category, setCategory] = useState("tổng hợp");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const generate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setResult(null);
    try {
      const res = await api(`/trips/${tripId}/ai/places`, {
        method: "POST",
        body: { destination: tripData?.destination || "Đà Lạt", category },
      });
      setResult(res.places);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head eyebrow="AI Places" title="Gợi ý địa điểm" />
      <div className="grid gap-6 lg:grid-cols-3">
        <form className="card space-y-4 h-fit" onSubmit={generate}>
          <div>
            <label>Điểm đến</label>
            <input
              disabled
              value={tripData?.destination || ""}
              className="bg-slate-50"
            />
          </div>
          <div>
            <label>Danh mục</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="tổng hợp">Tổng hợp</option>
              <option value="ăn uống">Ăn uống</option>
              <option value="vui chơi">Vui chơi</option>
              <option value="khách sạn">Khách sạn</option>
            </select>
          </div>
          <button disabled={busy} className="btn-primary w-full">
            <Sparkles size={18} />
            {busy ? "Đang tìm..." : "Tìm địa điểm"}
          </button>
        </form>
        <div className="lg:col-span-2 space-y-4">
          {busy && (
            <div className="card text-center py-12">
              <Sparkles
                className="mx-auto text-travel animate-spin-slow mb-4"
                size={40}
              />
              <p className="animate-pulse font-bold">
                Đang tìm địa điểm nổi bật...
              </p>
            </div>
          )}
          {errorMessage && <ErrorBox message={errorMessage} />}
          {result && (
            <div className="space-y-4">
              {result.map((place, index) => (
                <div
                  className="card flex flex-col sm:flex-row gap-4 justify-between"
                  key={index}
                >
                  <div>
                    <h3 className="font-bold text-lg text-travel">{place.title}</h3>
                    <p className="text-sm font-semibold flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {place.location}
                    </p>
                    <p className="text-sm mt-2">{place.description}</p>
                    {place.estimated_cost > 0 && (
                      <p className="text-sm mt-1 font-semibold text-travel">
                        ~{currency(place.estimated_cost)}
                      </p>
                    )}
                    {place.estimated_cost === 0 && (
                      <p className="text-sm mt-1 text-emerald-600 font-semibold">
                        Miễn phí
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <div className="card p-0 overflow-hidden mt-6">
                <MapView activities={result} selected={null} height={400} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
