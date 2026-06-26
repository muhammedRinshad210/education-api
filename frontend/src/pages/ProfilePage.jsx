import { FiMail, FiShield, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { PageHeader } from "../components/PageHeader";

export function ProfilePage() {
  const { session, role } = useAuth();
  const user = session?.user || {};

  return (
    <div className="grid gap-4">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Review the current JWT session and user details available from the backend."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
          <div className="flex flex-col items-start gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-3xl bg-slate-950 text-xl font-semibold text-white">
              {String(user.name || user.username || "U").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                {user.name || user.username || "User"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{user.email || "No email available"}</p>
            </div>
            <Badge tone="blue">{role || "guest"}</Badge>
          </div>

          <div className="mt-6 grid gap-3 text-sm text-slate-600">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <FiUser className="text-brand-700" />
              <span>Username: {user.username || "—"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <FiMail className="text-brand-700" />
              <span>Email: {user.email || "—"}</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <FiShield className="text-brand-700" />
              <span>Role: {role || "guest"}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
          <h3 className="text-lg font-semibold text-slate-950">Session details</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Access token</p>
              <p className="mt-2 break-all text-sm text-slate-700">
                {session?.access ? `${session.access.slice(0, 20)}...` : "No access token"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Refresh token</p>
              <p className="mt-2 break-all text-sm text-slate-700">
                {session?.refresh ? `${session.refresh.slice(0, 20)}...` : "No refresh token"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">JWT auth</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">
                Tokens are persisted in local storage for this frontend session and automatically attached to protected API requests via Axios interceptors.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
