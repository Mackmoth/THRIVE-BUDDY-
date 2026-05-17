import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { recordQuizAttempt } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prevention")({
  head: () => ({ meta: [{ title: "Quests — ThriveBuddy" }] }),
  component: PreventionPage,
});

type Q = { q: string; options: string[]; correct: number; explain: string };
const QUIZ: Q[] = [
  { q: "A friend hands you a vape at a party. What's the power move?", options: ["Take it to fit in", "Say 'nah, I'm good' and change the topic", "Pretend to puff"], correct: 1, explain: "Confidence is contagious. Real friends respect a 'no'." },
  { q: "Myth or fact: 'Energy drinks + alcohol cancel each other out.'", options: ["Fact", "Myth"], correct: 1, explain: "Myth! Caffeine masks the effects but doesn't reduce them — dangerous combo." },
  { q: "Stress level: 10/10. Best XP-earning move?", options: ["Doomscroll for an hour", "10-min walk + text a friend", "Skip sleep to grind"], correct: 1, explain: "Movement + connection > everything else for resetting your brain." },
  { q: "Someone online pressures you to send a photo you're not comfy with. You…", options: ["Send it to keep them happy", "Block, screenshot, tell a trusted adult", "Argue with them"], correct: 1, explain: "You owe no one access to your body or images. Block + tell someone you trust." },
  { q: "Myth or fact: 'Everyone my age is doing it.'", options: ["Fact", "Myth"], correct: 1, explain: "Myth. Most teens overestimate how many peers actually use substances." },
];

function PreventionPage() {
  const recordFn = useServerFn(recordQuizAttempt);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const submit = useMutation({
    mutationFn: (s: number) => recordFn({ data: { quiz_id: "decisions-v1", score: s, total: QUIZ.length } }),
    onSuccess: (r) => toast.success(`+${r.xp} XP earned!`),
  });

  function answer(idx: number) {
    setPicked(idx);
    if (idx === QUIZ[i].correct) setScore(score + 1);
  }
  function next() {
    if (i + 1 >= QUIZ.length) {
      const finalScore = score + (picked === QUIZ[i].correct ? 0 : 0); // score already updated
      setDone(true);
      submit.mutate(finalScore);
    } else {
      setI(i + 1);
      setPicked(null);
    }
  }
  function restart() { setI(0); setScore(0); setPicked(null); setDone(false); }

  if (done) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center space-y-4">
        <div className="text-6xl">🏆</div>
        <h1 className="font-display text-3xl font-bold">Quest complete!</h1>
        <p className="text-muted-foreground">You scored {score} / {QUIZ.length} and earned <span className="text-warning-foreground font-bold">+{score * 10} XP</span>.</p>
        <Button variant="hero" onClick={restart}>Play again</Button>
      </div>
    );
  }

  const cur = QUIZ[i];
  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Decision Quest</span>
        <span>{i + 1} / {QUIZ.length}</span>
      </div>
      <div className="rounded-3xl bg-card border shadow-card p-6 space-y-4">
        <h2 className="font-display text-2xl font-bold">{cur.q}</h2>
        <div className="space-y-2">
          {cur.options.map((o, idx) => {
            const isPicked = picked === idx;
            const isCorrect = idx === cur.correct;
            const reveal = picked !== null;
            return (
              <button key={idx} disabled={reveal} onClick={() => answer(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  reveal && isCorrect ? "bg-success/15 border-success" :
                  reveal && isPicked ? "bg-destructive/10 border-destructive" :
                  "hover:bg-muted border-border"
                }`}>{o}</button>
            );
          })}
        </div>
        {picked !== null && (
          <div className="rounded-xl bg-muted p-3 text-sm">{cur.explain}</div>
        )}
        {picked !== null && (
          <Button onClick={next} variant="hero" className="w-full">{i + 1 >= QUIZ.length ? "Finish quest" : "Next →"}</Button>
        )}
      </div>
    </div>
  );
}
