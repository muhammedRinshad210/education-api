import { FiBell, FiRefreshCw } from "react-icons/fi";
import { Badge } from "./Badge";

export function Topbar({ title, subtitle, role, onRefresh }) {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="blue">{role || "guest"}</Badge>
        <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
          <FiBell />
          Alerts
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>
    </header>
  );
}
