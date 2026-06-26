import { NavLink } from "react-router-dom";
import { FiGrid, FiLogOut, FiUser } from "react-icons/fi";
import { Badge } from "./Badge";

const navLinkClass = ({ isActive }) =>
  [
    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

export function Sidebar({ session, role, onLogout }) {
  const items = [
    { to: "/dashboard", label: "Dashboard", icon: FiGrid },
    { to: "/profile", label: "Profile", icon: FiUser },
  ];

  return (
    <aside className="flex h-full flex-col rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-soft backdrop-blur">
      <div className="rounded-[1.5rem] bg-slate-950 px-4 py-5 text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Education App</p>
        <h2 className="mt-2 text-xl font-semibold">Operations Hub</h2>
        <p className="mt-2 text-sm text-slate-300">Admin, instructor, and student workspaces in one place.</p>
      </div>

      <nav className="mt-5 grid gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Signed in as</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{session?.user?.name || session?.user?.username || "User"}</p>
            <p className="text-xs text-slate-500">{session?.user?.email || "JWT authenticated"}</p>
          </div>
          <Badge tone="blue">{role || "guest"}</Badge>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        <FiLogOut />
        Logout
      </button>
    </aside>
  );
}
