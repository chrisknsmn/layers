import { mastra } from "@/mastra";
import type { Audit } from "@/mastra/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

type ChatBody = {
  messages?: ChatMessage[];
  audit?: Audit;
  appName?: string;
};

function isMock(req: Request): boolean {
  if (process.env.ASO_USE_MOCK_DATA === "true") return true;
  return req.headers.get("x-aso-mock") === "1";
}

function mockTextStream(): Response {
  const encoder = new TextEncoder();
  const parts = [
    "(mock mode) ",
    "Here's a sample follow-up answer. ",
    "Real responses stream from the NIM agent — ",
    "switch off mock mode in the header to use it.",
  ];
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const p of parts) {
        controller.enqueue(encoder.encode(p));
        await new Promise<void>((r) => setTimeout(r, 120));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Missing 'messages'" }, { status: 400 });
  }

  if (isMock(req)) return mockTextStream();

  const agent = mastra.getAgent("asoAgent");

  const contextMessage: ChatMessage | null = body.audit
    ? {
        role: "system",
        content:
          `The user just received this ASO audit${
            body.appName ? ` for "${body.appName}"` : ""
          }. ` +
          "Use it as the source of truth for follow-up questions. " +
          "Do not invent scores or recommendations that aren't here. " +
          "Audit JSON: " +
          JSON.stringify(body.audit),
      }
    : null;

  const messages: ChatMessage[] = contextMessage
    ? [contextMessage, ...body.messages]
    : body.messages;

  const output = await agent.stream(messages);
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const reader = (
          output.textStream as ReadableStream<string>
        ).getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(encoder.encode(value));
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
