import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const styles = {
  success: [CheckCircle2, "border-[#cce8d2] bg-[#eff9f1] text-[#246b35]"],
  error: [AlertCircle, "border-[#f1c3bb] bg-[#fff0ed] text-[#a42f21]"],
  info: [Info, "border-[#f0d5bd] bg-[#fff6ec] text-[#7a4526]"],
};

export default function StatusBanner({ type = "info", children }) {
  const [Icon, classes] = styles[type] || styles.info;
  return (
    <div role={type === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${classes}`}>
      <Icon className="mt-0.5 shrink-0" size={18} />
      <div>{children}</div>
    </div>
  );
}
