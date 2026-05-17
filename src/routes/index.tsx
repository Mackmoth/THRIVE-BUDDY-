import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/buddy-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ThriveBuddy AI — Your gamified growth companion" },
      { name: "description", content: "An AI buddy that turns your goals into daily quests. Level up your health, learning, and confidence." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ThriveBuddy" width={36} height={36} />
          <span className="font-display text-xl font-bold text-gradient-buddy">ThriveBuddy</span>
        </div>
        <div className="flex gap-2">
          <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/login"><Button variant="hero">Start free</Button></Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-magic/10 px-4 py-1.5 text-sm font-medium text-magic mb-6">
          <span>🎮</span> Level up your real life
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
          Turn your goals into <span className="text-gradient-buddy">epic quests</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          ThriveBuddy is your AI sidekick that turns big dreams into tiny daily missions.
          Earn XP, unlock badges, and grow with friends — no boring lectures, ever.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/login"><Button variant="hero">Get your buddy ⚡</Button></Link>
          <Button variant="outline" size="lg" className="rounded-full">See how it works</Button>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-5 text-left">
          {[
            { emoji: "🎯", title: "Daily Quests", body: "Your AI buddy turns goals into bite-sized missions you can crush today." },
            { emoji: "⚡", title: "XP & Levels", body: "Stack streaks, unlock badges, and watch your character grow stronger." },
            { emoji: "🤝", title: "Squad Up", body: "Match with peers chasing similar goals. Team challenges = double XP." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl bg-card p-6 shadow-card border">
              <div className="text-3xl mb-3">{c.emoji}</div>
              <h3 className="font-display text-lg font-semibold">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{c.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
