export function StatCard({ label, value, hint, icon }) {
  return (
    <article className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
        </div>
        {icon ? <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">{icon}</div> : null}
      </div>
    </article>
  );
}
