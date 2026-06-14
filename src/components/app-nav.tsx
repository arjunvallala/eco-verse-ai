import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, PlusCircle, Trophy, MessageSquareHeart, Trees } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/log", label: "Log", icon: PlusCircle },
  { to: "/challenges", label: "Quests", icon: Trophy },
  { to: "/coach", label: "EcoAI", icon: MessageSquareHeart },
  { to: "/island", label: "Island", icon: Trees },
] as const;

export function AppNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-6 pb-2">
      {items.map((it) => {
        const active = pathname === it.to;
        const Icon = it.icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow"
                : "glass text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
