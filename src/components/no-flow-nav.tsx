import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { NotificationsBell } from "@/components/notifications-bell";


export function NoFlowNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useAuth();

  const item = (to: string, label: string) => {
    const active = pathname === to || (to !== "/" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`text-sm font-medium transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      >
        {label}
      </Link>
    );
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-brand shadow-brand-glow">
            <div className="size-3 rounded-full bg-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient-brand">No Flow</span>
        </Link>
        <div className="flex items-center gap-6">
          {item("/", "Busca")}
          {user && item("/admin", "Dashboard TA")}
          {user && <NotificationsBell />}
          {user ? (

            <button
              onClick={handleLogout}
              title="Sair"
              className="flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="size-3" />
              Sair
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-gradient-brand px-4 py-1.5 text-xs font-semibold text-white shadow-brand-glow"
            >
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
