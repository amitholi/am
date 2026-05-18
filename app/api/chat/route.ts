import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import { tools } from "@/lib/ai/tools";
import { chatsRepo } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  messages: UIMessage[];
  id?: string;
  model?: string;
};

function modelFor(name?: string) {
  const id =
    name === "haiku"
      ? "claude-haiku-4-5"
      : "claude-sonnet-4-5";
  const key = process.env.ANTHROPIC_API_KEY;
  return key ? createAnthropic({ apiKey: key })(id) : anthropic(id);
}

function firstUserText(messages: UIMessage[]): string {
  const m = messages.find((x) => x.role === "user");
  if (!m) return "New chat";
  for (const part of m.parts ?? []) {
    if (part.type === "text" && "text" in part) {
      return String(part.text).slice(0, 80);
    }
  }
  return "New chat";
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "Missing ANTHROPIC_API_KEY. Add it to .env.local and restart the dev server.",
      }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const { messages, id } = body;

  if (id) {
    try {
      chatsRepo.upsert(id, firstUserText(messages));
      for (const m of messages) {
        chatsRepo.saveMessage(m.id, id, m.role, m.parts);
      }
    } catch (e) {
      console.error("persist messages failed", e);
    }
  }

  const result = streamText({
    model: modelFor(body.model),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(8),
    onError: ({ error }) => {
      console.error("streamText error", error);
    },
  });

  return result.toUIMessageStreamResponse({
    onFinish: ({ messages: finalMessages }) => {
      if (!id) return;
      try {
        for (const m of finalMessages) {
          chatsRepo.saveMessage(m.id, id, m.role, m.parts);
        }
      } catch (e) {
        console.error("persist final messages failed", e);
      }
    },
  });
}
