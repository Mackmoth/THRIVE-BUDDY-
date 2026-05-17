import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { UIMessage } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const loadChatMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200);
    const messages: UIMessage[] = (data ?? []).map((row) => ({
      id: row.id,
      role: row.role as UIMessage["role"],
      parts: (row.parts as UIMessage["parts"]) ?? [{ type: "text", text: row.content }],
    }));
    return messages;
  });

export const saveChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { role: "user" | "assistant"; content: string; parts?: unknown }) =>
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(20000),
      parts: z.unknown().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("chat_messages").insert({
      user_id: userId,
      role: data.role,
      content: data.content,
      parts: (data.parts ?? null) as never,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
