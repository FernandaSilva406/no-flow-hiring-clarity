import { Link, useRouterState } from "@tanstack/react-router";

export function NoFlowNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
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
          {item("/admin", "Dashboard TA")}
          <div className="grid size-8 place-items-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground">
            TA
          </div>
        </div>
      </div>
    </nav>
  );
}
