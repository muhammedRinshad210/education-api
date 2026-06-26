import { FiLoader } from "react-icons/fi";

export function Loader({ label = "Loading" }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl border border-white/60 bg-white/80 px-5 py-6 text-slate-600 shadow-soft backdrop-blur">
      <FiLoader className="animate-spin text-brand-600" />
      <span>{label}</span>
    </div>
  );
}
