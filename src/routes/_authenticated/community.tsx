import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listCommunityPosts, createCommunityPost, listPeerMatches } from "@/lib/community.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Squad — ThriveBuddy" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  const listFn = useServerFn(listCommunityPosts);
  const peersFn = useServerFn(listPeerMatches);
  const createFn = useServerFn(createCommunityPost);
  const qc = useQueryClient();
  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: () => listFn() });
  const { data: peers } = useQuery({ queryKey: ["peers"], queryFn: () => peersFn() });
  const [text, setText] = useState("");

  const post = useMutation({
    mutationFn: () => createFn({ data: { content: text } }),
    onSuccess: () => { setText(""); toast.success("Posted! 🎉"); qc.invalidateQueries({ queryKey: ["posts"] }); },
  });

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <h1 className="font-display text-3xl font-bold">🤝 Your Squad</h1>
        <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) post.mutate(); }}
          className="rounded-3xl bg-card border shadow-card p-4 space-y-3">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Share a win, a struggle, or a hype…" maxLength={280} />
          <div className="flex justify-end"><Button type="submit" variant="hero" disabled={!text.trim() || post.isPending}>Post</Button></div>
        </form>
        <div className="space-y-3">
          {(posts ?? []).map((p) => (
            <div key={p.id} className="rounded-2xl bg-card border p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{p.author.avatar_emoji}</span>
                <span className="font-medium text-sm">{p.author.display_name}</span>
                <span className="text-xs text-muted-foreground">· Lvl {p.author.level}</span>
              </div>
              <p className="text-sm">{p.content}</p>
            </div>
          ))}
          {(posts ?? []).length === 0 && <p className="text-muted-foreground text-sm">No posts yet — be the first!</p>}
        </div>
      </div>

      <aside className="space-y-3">
        <h2 className="font-display text-lg font-bold">Peer matches</h2>
        {(peers ?? []).map((p) => (
          <div key={p.id} className="rounded-2xl bg-card border p-3 flex items-center gap-3">
            <span className="text-2xl">{p.avatar_emoji}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{p.display_name ?? "Buddy"}</div>
              <div className="text-xs text-muted-foreground">Lvl {p.level} · {p.score} shared interest{p.score === 1 ? "" : "s"}</div>
            </div>
          </div>
        ))}
        {(peers ?? []).length === 0 && <p className="text-muted-foreground text-sm">Add interests in your profile to match.</p>}
      </aside>
    </div>
  );
}
