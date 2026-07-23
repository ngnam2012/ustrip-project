import { useParams } from "react-router-dom";
import { Loader } from "../components/ui";
import { useRemote } from "../hooks/useRemote";
import { PaymentStatusCard, markMockPaymentSuccess } from "../components/MomoPayment";
import toast from "react-hot-toast";
import { Head } from "./shared";

export function PaymentDetailPage() {
  const { paymentId } = useParams();
  const { data, loading, reload } = useRemote(`/payments/${paymentId}/status`);
  const mockSuccess = async () => {
    if (!data) return;
    try {
      await markMockPaymentSuccess(data);
      await reload();
      toast.success("Đã đánh dấu thanh toán thành công!");
    } catch (err) {
      toast.error(err.message || "Không thể đánh dấu thành công");
    }
  };
  if (loading) return <Loader />;
  return (
    <>
      <Head eyebrow="Thanh toán MoMo" title="Chi tiết thanh toán" />
      <PaymentStatusCard
        payment={data}
        onRefresh={reload}
        onMockSuccess={mockSuccess}
      />
    </>
  );
}
