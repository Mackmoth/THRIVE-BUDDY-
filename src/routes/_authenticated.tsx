import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/buddy-logo.png";
import { Home, MessageCircle, Target, Users, Shield, LogOut, User, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/use-theme";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading your buddy…</div>;
  }

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: Home },
    { to: "/chat", label: "AI Buddy", icon: MessageCircle },
    { to: "/goals", label: "Goals", icon: Target },
    { to: "/community", label: "Squad", icon: Users },
    { to: "/prevention", label: "Quests", icon: Shield },
    { to: "/profile", label: "Profile", icon: User },
  ];
  // Mobile bottom bar shows only the first 5; Profile lives in the top header.
  const mobileNav = nav.slice(0, 5);
  const profileActive = path === "/profile";

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar p-4 gap-1">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3 mb-4">
          <img src={logo} alt="" width={32} height={32} />
          <span className="font-display font-bold text-lg text-gradient-buddy">ThriveBuddy</span>
        </Link>
        {nav.map((n) => {
          const Icon = n.icon;
          const active = path === n.to;
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-primary text-primary-foreground shadow-card" : "hover:bg-sidebar-accent text-sidebar-foreground"
              }`}
            >
              <Icon className="size-4" /> {n.label}
            </Link>
          );
        })}
        <div className="mt-auto space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggle}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top header */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 px-3 h-14 bg-sidebar/95 backdrop-blur border-b">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="" width={28} height={28} />
            <span className="font-display font-bold text-base text-gradient-buddy">ThriveBuddy</span>
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Link
              to="/profile"
              aria-label="Profile"
              className={`grid place-items-center size-9 rounded-full ${profileActive ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent text-sidebar-foreground"}`}
            >
              <User className="size-5" />
            </Link>
            <Button variant="ghost" size="icon" aria-label="Sign out"
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 min-w-0 pb-20 md:pb-0"><Outlet /></main>
      </div>

      {/* Mobile bottom nav — 5 items only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar border-t flex justify-around px-1 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {mobileNav.map((n) => {
          const Icon = n.icon;
          const active = path === n.to;
          return (
            <Link key={n.to} to={n.to}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium flex-1 min-w-0 ${
                active ? "text-primary" : "text-muted-foreground"
              }`}>
              <Icon className="size-5" />
              <span className="truncate">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
