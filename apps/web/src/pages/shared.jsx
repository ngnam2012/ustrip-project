import { motion } from "framer-motion";

export const categories = {
  food: "Ăn uống",
  transport: "Di chuyển",
  hotel: "Khách sạn",
  ticket: "Vé",
  shopping: "Mua sắm",
  other: "Khác",
};

export const sourceLabels = {
  shared_fund: "Quỹ chung",
  personal: "Thành viên trả hộ",
};

export const colors = [
  "#2563EB",
  "#10B981",
  "#F43F5E",
  "#F59E0B",
  "#8B5CF6",
  "#94A3B8",
];

export const Head = ({ eyebrow, title, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8 flex flex-wrap items-end justify-between gap-4"
  >
    <div>
      <p className="page-eyebrow">{eyebrow}</p>
      <h1 className="page-title mt-1.5">{title}</h1>
    </div>
    {action}
  </motion.div>
);
