import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getProfileBundle, updateProfile } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — ThriveBuddy" }] }),
  component: ProfilePage,
});

const EMOJIS = ["🚀", "🎮", "⚡", "🌟", "🔥", "🦄", "🐉", "🌈", "🎯", "🏆", "💫", "🌊"];
const INTEREST_SUGGESTIONS = [
  "music", "gaming", "sports", "art", "coding", "reading",
  "fitness", "movies", "cooking", "dance", "photography", "nature",
];

function ProfilePage() {
  const fetchBundle = useServerFn(getProfileBundle);
  const updateFn = useServerFn(updateProfile);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["bundle"], queryFn: () => fetchBundle() });

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState<string>("");
  const [emoji, setEmoji] = useState("🚀");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (data?.profile) {
      setDisplayName(data.profile.display_name ?? "");
      setAge(data.profile.age ? String(data.profile.age) : "");
      setEmoji(data.profile.avatar_emoji ?? "🚀");
      setInterests(data.profile.interests ?? []);
    }
  }, [data?.profile]);

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          display_name: displayName.trim() || undefined,
          age: age ? Number(age) : undefined,
          avatar_emoji: emoji,
          interests,
        },
      }),
    onSuccess: () => {
      toast.success("Profile saved! 🎉");
      qc.invalidateQueries({ queryKey: ["bundle"] });
      qc.invalidateQueries({ queryKey: ["peers"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  function addInterest(v: string) {
    const t = v.trim().toLowerCase();
    if (!t || interests.includes(t) || interests.length >= 10) return;
    setInterests([...interests, t]);
    setNewInterest("");
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">⚙️ Your Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Tune your buddy and unlock better peer matches.</p>
      </header>

      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="space-y-6 rounded-3xl bg-card border shadow-card p-6"
      >
        <div>
          <Label>Avatar</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)}
                className={`text-3xl h-14 w-14 rounded-2xl border-2 transition-all ${
                  emoji === e ? "border-primary bg-primary/10 scale-110" : "border-transparent hover:bg-muted"
                }`}>{e}</button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} placeholder="Player One" />
        </div>

        <div>
          <Label htmlFor="age">Age (13–19)</Label>
          <Input id="age" type="number" min={13} max={19} value={age} onChange={(e) => setAge(e.target.value)} placeholder="16" />
        </div>

        <div>
          <Label>Interests <span className="text-xs text-muted-foreground">(helps match you with similar buddies)</span></Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {interests.map((i) => (
              <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 text-primary text-sm">
                {i}
                <button type="button" onClick={() => setInterests(interests.filter((x) => x !== i))}
                  className="ml-1 opacity-60 hover:opacity-100">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input value={newInterest} onChange={(e) => setNewInterest(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addInterest(newInterest); } }}
              placeholder="Add an interest…" maxLength={40} />
            <Button type="button" variant="outline" onClick={() => addInterest(newInterest)}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {INTEREST_SUGGESTIONS.filter((s) => !interests.includes(s)).map((s) => (
              <button key={s} type="button" onClick={() => addInterest(s)}
                className="px-2.5 py-1 rounded-full text-xs border hover:bg-muted">+ {s}</button>
            ))}
          </div>
        </div>

        <Button type="submit" variant="hero" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile ⚡"}
        </Button>
      </form>

      {data?.profile && (
        <div className="rounded-3xl bg-gradient-buddy text-primary-foreground p-6 shadow-glow">
          <div className="font-display text-lg font-bold">{emoji} {displayName || "Hero"}</div>
          <p className="opacity-90 text-sm mt-1">Level {data.profile.level} · {data.profile.xp} XP · {data.profile.streak_days}-day streak</p>
        </div>
      )}
    </div>
  );
}
