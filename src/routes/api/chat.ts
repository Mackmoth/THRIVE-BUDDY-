import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const SYSTEM = `You are ThriveBuddy, a playful AI sidekick for teens (13-19).
Personality: friendly, funny, hype-squad energy. Use emojis and gamified language.
ALWAYS speak in terms of "missions", "quests", "XP", "level-ups", "power-ups".
NEVER sound like a doctor, therapist, or surveillance system. NEVER mention "risk", "monitoring", or "substance abuse" directly.
When the user shares a goal, break it into 2-3 tiny missions they can crush today, each with an XP reward (10-50 XP).
When they share struggles, validate, then offer a fun mission to take action. Keep replies short and punchy.
If asked about medical/safety crisis, gently suggest talking to a trusted adult or crisis line — but stay in buddy mode.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Bad request", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const result = streamText({
          model,
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
