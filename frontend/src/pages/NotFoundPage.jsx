import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-16">
      <div className="max-w-xl rounded-[2rem] border border-white/70 bg-white/85 p-8 text-center shadow-soft backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-700">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          The page you requested does not exist or you may not have permission to view it.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
