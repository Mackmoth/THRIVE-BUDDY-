import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/buddy-logo.png";
import { Home, MessageCircle, Target, Users, Shield, LogOut, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

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
        <div className="mt-auto">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
