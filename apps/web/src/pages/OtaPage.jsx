import { useState } from "react";
import { useParams } from "react-router-dom";
import { ErrorBox, Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { api, currency } from "../lib/api";
import toast from "react-hot-toast";
import { Head, categories } from "./shared";

export function OtaPage() {
  const { tripId } = useParams();
  const { data, loading, error } = useRemote(
    `/trips/${tripId}/mock-ota/services`,
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [quantities, setQuantities] = useState({});

  if (loading) return <Loader />;

  const book = async (serviceId, quantity) => {
    try {
      const res = await api(`/trips/${tripId}/mock-ota/book`, {
        method: "POST",
        body: { service_id: serviceId, quantity },
      });
      if (res.expense?.payment_source === "shared_fund") {
        toast.success("Đặt dịch vụ thành công! Đã thanh toán từ quỹ chung.");
      } else {
        toast.success(
          "Quỹ chung không đủ! Đã ghi nhận bạn ứng trước tiền và tự động chia đều công nợ cho nhóm.",
        );
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredData =
    activeCategory === "all"
      ? data
      : data?.filter((service) => service.category === activeCategory);

  const TABS = [
    { id: "all", label: "Tất cả" },
    { id: "food", label: "Ăn uống" },
    { id: "accommodation", label: "Lưu trú" },
    { id: "transport", label: "Di chuyển" },
    { id: "activity", label: "Vui chơi" },
  ];

  return (
    <>
      <Head eyebrow="Dịch vụ OTA" title="Khám phá và Đặt trước" />
      <ErrorBox message={error} />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all border ${activeCategory === tab.id ? "bg-travel border-travel text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-ink"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredData?.map((service) => {
          const qty = quantities[service.id] || 1;
          return (
            <div key={service.id} className="card overflow-hidden !p-0 group">
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-travel capitalize shadow-sm">
                  {categories[service.category] || service.category}
                </div>
              </div>
              <div className="p-5 flex flex-col h-[calc(100%-12rem)]">
                <h3 className="font-bold text-ink line-clamp-2">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-2 flex-1">
                  {service.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div>
                    <span className="font-extrabold text-travel block">
                      {currency(service.price * qty)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {currency(service.price)}/vé
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                        onClick={() =>
                          setQuantities({
                            ...quantities,
                            [service.id]: Math.max(1, qty - 1),
                          })
                        }
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold">
                        {qty}
                      </span>
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                        onClick={() =>
                          setQuantities({ ...quantities, [service.id]: qty + 1 })
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="btn-primary py-1.5 px-4 text-sm shadow-sm"
                      onClick={() => book(service.id, qty)}
                    >
                      Đặt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
