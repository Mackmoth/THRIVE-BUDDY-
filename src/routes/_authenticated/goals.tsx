import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getProfileBundle, createGoalWithMissions } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — ThriveBuddy" }] }),
  component: GoalsPage,
});

const CATS = [
  { id: "health", label: "💚 Health" },
  { id: "education", label: "📚 Education" },
  { id: "career", label: "🚀 Career" },
  { id: "personal", label: "🌟 Personal" },
] as const;

function GoalsPage() {
  const fetchBundle = useServerFn(getProfileBundle);
  const createGoal = useServerFn(createGoalWithMissions);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ["bundle"], queryFn: () => fetchBundle() });
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"health" | "education" | "career" | "personal">("personal");

  const mutate = useMutation({
    mutationFn: () => createGoal({ data: { title, category } }),
    onSuccess: () => {
      toast.success("Goal locked in! AI cooked up some missions for you ✨");
      setTitle("");
      qc.invalidateQueries({ queryKey: ["bundle"] });
      navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <h1 className="font-display text-3xl font-bold">🎯 Your Goals</h1>

      <form onSubmit={(e) => { e.preventDefault(); if (title.trim()) mutate.mutate(); }}
        className="rounded-3xl bg-card border shadow-card p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Add a new goal</h2>
        <div>
          <Label htmlFor="goal">What do you want to level up?</Label>
          <Input id="goal" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Run my first 5K" maxLength={120} />
        </div>
        <div>
          <Label>Category</Label>
          <div className="flex gap-2 flex-wrap mt-1">
            {CATS.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  category === c.id ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                }`}>{c.label}</button>
            ))}
          </div>
        </div>
        <Button type="submit" variant="hero" disabled={mutate.isPending || !title.trim()}>
          {mutate.isPending ? "Cooking missions…" : "Create goal ⚡"}
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-xl font-bold">Active goals</h2>
        {(data?.goals ?? []).length === 0 && <p className="text-muted-foreground text-sm">No goals yet.</p>}
        {(data?.goals ?? []).map((g) => (
          <div key={g.id} className="rounded-2xl bg-card border p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{g.title}</div>
              <div className="text-xs text-muted-foreground capitalize">{g.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
