export function FormInput({ label, error, leftIcon, className = "", ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      <div className="relative">
        {leftIcon ? <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">{leftIcon}</span> : null}
        <input
          {...props}
          className={`w-full rounded-2xl border border-slate-200 bg-white py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${
            leftIcon ? "pl-11 pr-4" : "px-4"
          }`}
        />
      </div>
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

export function FormTextarea({ label, error, className = "", ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      <textarea
        {...props}
        className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      />
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}

export function FormSelect({ label, error, children, className = "", ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      <select
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
      >
        {children}
      </select>
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
