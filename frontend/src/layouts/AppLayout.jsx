import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export function AppLayout({ onRefresh }) {
  const { session, role, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32rem),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28rem),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-4 text-slate-900 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1600px] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <Sidebar session={session} role={role} onLogout={logout} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="grid min-h-0 gap-4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
