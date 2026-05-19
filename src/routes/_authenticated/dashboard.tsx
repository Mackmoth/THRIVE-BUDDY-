import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getProfileBundle, completeMission, pingStreak } from "@/lib/profile.functions";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Flame } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/lib/use-notifications";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ThriveBuddy" }] }),
  component: Dashboard,
});

function Dashboard() {
  const fetchBundle = useServerFn(getProfileBundle);
  const completeFn = useServerFn(completeMission);
  const pingFn = useServerFn(pingStreak);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["bundle"], queryFn: () => fetchBundle() });
  const notif = useNotifications();

  // Ping streak once when dashboard mounts
  useEffect(() => {
    pingFn({})
      .then((r) => {
        if (r.updated) {
          toast.success(`🔥 Day ${r.streak} streak!`);
          qc.invalidateQueries({ queryKey: ["bundle"] });
        }
      })
      .catch(() => {});
  }, [pingFn, qc]);

  const complete = useMutation({
    mutationFn: (id: string) => completeFn({ data: { mission_id: id } }),
    onSuccess: (r) => {
      if (r.xp) {
        toast.success(`+${r.xp} XP ⚡`);
        notif.notify("Mission complete! ⚡", `+${r.xp} XP earned. Keep your streak alive!`);
      }
      qc.invalidateQueries({ queryKey: ["bundle"] });
    },
  });

  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const p = data.profile;
  const sc = data.progress;
  const activeMissions = data.missions.filter((m) => !m.completed).slice(0, 5);
  const xpInLevel = (p?.xp ?? 0) % 200;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            {p?.avatar_emoji ?? "🚀"} {p?.display_name ?? "Hero"}
          </h1>
        </div>
        <div className="rounded-2xl bg-gradient-buddy text-primary-foreground px-5 py-3 shadow-glow">
          <div className="text-xs uppercase tracking-wider opacity-80">Level</div>
          <div className="font-display text-2xl font-bold">{p?.level ?? 1}</div>
        </div>
      </header>

      <section className="rounded-3xl bg-card p-6 border shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">XP toward next level</span>
          <span className="text-sm text-muted-foreground">{xpInLevel} / 200</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-xp transition-all" style={{ width: `${(xpInLevel / 200) * 100}%` }} />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-card p-6 border shadow-card">
          <h2 className="font-display text-xl font-bold mb-4">🎯 Today's missions</h2>
          {activeMissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No missions yet. Head to Goals to set your first one!</p>
          ) : (
            <ul className="space-y-3">
              {activeMissions.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-muted/40">
                  <div className="min-w-0">
                    <div className="font-medium">{m.title}</div>
                    {m.description && <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>}
                    <div className="text-xs text-warning-foreground bg-warning/40 inline-block px-2 py-0.5 rounded-full mt-1.5">+{m.xp_reward} XP</div>
                  </div>
                  <Button size="sm" variant="success" onClick={() => complete.mutate(m.id)} disabled={complete.isPending}>Done</Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-card p-6 border shadow-card">
          <h2 className="font-display text-xl font-bold mb-4">📊 Your stats</h2>
          {(["health", "learning", "confidence", "community"] as const).map((k) => {
            const v = (sc?.[k] as number) ?? 0;
            const labels: Record<string, string> = { health: "💚 Health", learning: "📚 Learning", confidence: "🌟 Confidence", community: "🤝 Community" };
            return (
              <div key={k} className="mb-3">
                <div className="flex justify-between text-sm mb-1"><span>{labels[k]}</span><span className="text-muted-foreground">{v}</span></div>
                <Progress value={v} />
              </div>
            );
          })}
        </div>
      </section>

      <div className="rounded-3xl bg-gradient-hero text-primary-foreground p-6 shadow-glow">
        <div className="font-display text-lg font-bold">Your buddy says:</div>
        <p className="mt-1 opacity-95">"Every quest you crush today is a future-you upgrade. Let's go! ⚡"</p>
      </div>
    </div>
  );
}
