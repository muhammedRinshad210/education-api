export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-5 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">{eyebrow}</p> : null}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
