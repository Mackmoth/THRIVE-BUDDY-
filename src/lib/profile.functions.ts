import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway";
import { generateText, Output } from "ai";

export const getProfileBundle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, progressRes, missionsRes, goalsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("progress_scores").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("missions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    return {
      profile: profileRes.data,
      progress: progressRes.data,
      missions: missionsRes.data ?? [],
      goals: goalsRes.data ?? [],
    };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { display_name?: string; age?: number; interests?: string[]; avatar_emoji?: string }) =>
    z.object({
      display_name: z.string().min(1).max(50).optional(),
      age: z.number().int().min(13).max(19).optional(),
      interests: z.array(z.string().max(40)).max(10).optional(),
      avatar_emoji: z.string().max(8).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const MissionList = z.object({
  missions: z.array(z.object({
    title: z.string().min(3).max(100),
    description: z.string().min(3).max(200),
    xp_reward: z.number().int().min(10).max(100),
  })).min(2).max(5),
});

export const createGoalWithMissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { title: string; category: string }) =>
    z.object({
      title: z.string().min(3).max(120),
      category: z.enum(["health", "education", "career", "personal"]),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: goal, error } = await supabase
      .from("goals").insert({ user_id: userId, title: data.title, category: data.category })
      .select().single();
    if (error || !goal) throw new Error(error?.message ?? "Failed to create goal");

    // Use AI to break down into 3 starter missions
    const key = process.env.LOVABLE_API_KEY;
    if (key) {
      try {
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const { output } = await generateText({
          model,
          output: Output.object({ schema: MissionList }),
          prompt: `Break this teen goal into 3 small, playful starter missions. Goal: "${data.title}" (category: ${data.category}). Tone: gamified, friendly, NO medical or therapy language. Each title should sound like a game quest. Keep them tiny and doable today.`,
        });
        const rows = output.missions.map((m) => ({
          user_id: userId,
          goal_id: goal.id,
          title: m.title,
          description: m.description,
          xp_reward: m.xp_reward,
        }));
        await supabase.from("missions").insert(rows);
      } catch (e) {
        console.error("AI mission gen failed", e);
      }
    }
    return { goal };
  });

export const completeMission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { mission_id: string }) =>
    z.object({ mission_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: mission } = await supabase
      .from("missions").select("*").eq("id", data.mission_id).eq("user_id", userId).maybeSingle();
    if (!mission || mission.completed) return { ok: true, xp: 0 };

    await supabase.from("missions").update({ completed: true, completed_at: new Date().toISOString() }).eq("id", data.mission_id);

    // Award XP & maybe level
    const { data: profile } = await supabase.from("profiles").select("xp, level").eq("id", userId).single();
    const newXp = (profile?.xp ?? 0) + mission.xp_reward;
    const newLevel = Math.max(1, Math.floor(newXp / 200) + 1);
    await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("id", userId);

    // Bump a progress score depending on goal category
    const { data: goal } = mission.goal_id
      ? await supabase.from("goals").select("category").eq("id", mission.goal_id).maybeSingle()
      : { data: null };
    const cat = goal?.category ?? "personal";
    const scoreCol: "health" | "learning" | "confidence" | "community" =
      cat === "health" ? "health" :
      cat === "education" || cat === "career" ? "learning" :
      "confidence";
    const { data: scores } = await supabase.from("progress_scores").select("*").eq("user_id", userId).maybeSingle();
    if (scores) {
      const next = Math.min(100, (scores[scoreCol] ?? 0) + 5);
      await supabase.from("progress_scores").update({ [scoreCol]: next, updated_at: new Date().toISOString() }).eq("user_id", userId);
    }
    return { ok: true, xp: mission.xp_reward, newLevel };
  });

export const recordQuizAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quiz_id: string; score: number; total: number }) =>
    z.object({ quiz_id: z.string().max(50), score: z.number().int().min(0).max(50), total: z.number().int().min(1).max(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const xp = data.score * 10;
    await supabase.from("quiz_attempts").insert({ user_id: userId, quiz_id: data.quiz_id, score: data.score, xp_earned: xp });
    const { data: profile } = await supabase.from("profiles").select("xp, level").eq("id", userId).single();
    const newXp = (profile?.xp ?? 0) + xp;
    const newLevel = Math.max(1, Math.floor(newXp / 200) + 1);
    await supabase.from("profiles").update({ xp: newXp, level: newLevel }).eq("id", userId);
    const { data: scores } = await supabase.from("progress_scores").select("confidence").eq("user_id", userId).maybeSingle();
    if (scores) {
      await supabase.from("progress_scores").update({ confidence: Math.min(100, scores.confidence + Math.round((data.score / data.total) * 8)) }).eq("user_id", userId);
    }
    return { xp };
  });
