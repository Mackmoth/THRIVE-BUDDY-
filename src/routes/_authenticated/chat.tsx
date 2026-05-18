import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { loadChatMessages, saveChatMessage } from "@/lib/chat.functions";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit, type PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import logo from "@/assets/buddy-logo.png";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Buddy — ThriveBuddy" }] }),
  component: ChatPage,
});

function ChatPage() {
  const loadFn = useServerFn(loadChatMessages);
  const saveFn = useServerFn(saveChatMessage);
  const { data: history, isLoading } = useQuery({ queryKey: ["chat"], queryFn: () => loadFn() });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading your convo…</div>;
  return <ChatInner initial={history ?? []} saveFn={saveFn} />;
}

type SaveFn = (args: { data: { role: "user" | "assistant"; content: string } }) => Promise<unknown>;

function ChatInner({ initial, saveFn }: { initial: { id: string; role: string; content: string }[]; saveFn: SaveFn }) {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status } = useChat({
    transport: transport.current,
    messages: initial.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      parts: [{ type: "text", text: m.content }],
    })),
    onFinish: ({ message }) => {
      const text = message.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("");
      saveFn({ data: { role: "assistant", content: text } }).catch(console.error);
    },
  });

  async function handleSubmit(message: PromptInputMessage) {
    const text = message.text?.trim();
    if (!text) return;
    saveFn({ data: { role: "user", content: text } }).catch(console.error);
    await sendMessage({ text });
  }

  const loading = status === "submitted" || status === "streaming";

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <img src={logo} alt="" width={36} height={36} />
        <div>
          <h1 className="font-display text-lg font-bold">Your AI Buddy</h1>
          <p className="text-xs text-muted-foreground">Quest giver, hype squad, accountability friend</p>
        </div>
      </header>

      <Conversation>
        <ConversationContent className="max-w-3xl mx-auto w-full">
          {messages.length === 0 && (
            <ConversationEmptyState
              icon={<div className="text-5xl">⚡</div>}
              title="Ready for a quest?"
              description="Tell me a goal you're chasing — anything from 'study chemistry' to 'make new friends'. I'll turn it into XP-worthy missions."
            />
          )}
          {messages.map((m) => {
            const text = m.parts.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("");
            return (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.role === "assistant" ? <MessageResponse>{text}</MessageResponse> : <span>{text}</span>}
                </MessageContent>
              </Message>
            );
          })}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="px-2"><Shimmer>Buddy is thinking…</Shimmer></div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputTextarea placeholder="Tell your buddy what's up…" />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={loading} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
