import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCommunityPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: posts } = await supabase
      .from("community_posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (!posts || posts.length === 0) return [];
    const ids = Array.from(new Set(posts.map((p) => p.user_id)));
    const { data: profiles } = await supabase
      .from("profiles").select("id, display_name, avatar_emoji, level").in("id", ids);
    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return posts.map((p) => ({
      ...p,
      author: map.get(p.user_id) ?? { display_name: "Buddy", avatar_emoji: "🌟", level: 1 },
    }));
  });

export const createCommunityPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { content: string }) =>
    z.object({ content: z.string().min(1).max(280) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("community_posts").insert({ user_id: userId, content: data.content });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPeerMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("profiles").select("interests").eq("id", userId).maybeSingle();
    const interests = me?.interests ?? [];
    const { data: peers } = await supabase
      .from("profiles").select("id, display_name, avatar_emoji, level, interests, xp")
      .neq("id", userId).limit(30);
    const scored = (peers ?? []).map((p) => {
      const overlap = (p.interests ?? []).filter((i: string) => interests.includes(i)).length;
      return { ...p, score: overlap };
    }).sort((a, b) => b.score - a.score).slice(0, 6);
    return scored;
  });
