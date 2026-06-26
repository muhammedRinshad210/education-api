import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32rem),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_28rem),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1400px] overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/70 shadow-soft backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden flex-col justify-between gap-6 bg-slate-950 p-8 text-white lg:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Education App</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight">A polished backend-connected portal for learning operations.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Built for admins, instructors, and students with JWT auth, responsive layouts, CRUD workflows, loading states, and clean API integration.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-medium text-slate-300">What is included</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">
                React 19, Vite, React Router, Axios interceptors, React Hook Form, Toast notifications, and Tailwind CSS.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Auth", "Dashboard", "Profile"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-lg">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
