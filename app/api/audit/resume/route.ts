import { mastra } from "@/mastra";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ResumeBody = {
  runId?: string;
  confirmed?: boolean;
};

export async function POST(req: Request) {
  let body: ResumeBody;
  try {
    body = (await req.json()) as ResumeBody;
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  if (!body?.runId) return jsonError("Missing runId", 400);
  if (typeof body.confirmed !== "boolean") {
    return jsonError("Missing 'confirmed' boolean", 400);
  }

  if (!body.confirmed) {
    return Response.json({
      status: "cancelled",
      message: "User did not confirm. Start a new audit with a different URL.",
    });
  }

  const workflow = mastra.getWorkflow("asoAuditWorkflow");
  const run =
    workflow.runs.get(body.runId) ??
    (await workflow.createRun({ runId: body.runId }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        send("status", { phase: "resuming", message: "Resuming audit…" });

        const resumeStream = run.resumeStream({
          step: "identify-app",
          resumeData: { confirmed: true },
        });

        let auditEmitted = false;
        const reader = resumeStream.fullStream.getReader();
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (handleChunk(value, send)) auditEmitted = true;
        }

        // Fallback: if we didn't catch the audit in a step-result event,
        // pull it from the final workflow result.
        const finalResult = (await resumeStream.result.catch(
          () => null,
        )) as
          | {
              status?: string;
              result?: {
                audit?: unknown;
                app?: unknown;
                listing?: unknown;
                competitors?: unknown;
              };
              error?: unknown;
            }
          | null;

        if (!auditEmitted) {
          const r = finalResult?.result;
          if (r && r.audit && r.app) {
            send("audit", r);
          } else if (finalResult?.status === "failed") {
            send("error", {
              message:
                (finalResult.error instanceof Error
                  ? finalResult.error.message
                  : String(finalResult.error)) ||
                "Workflow failed during the audit step.",
            });
          } else {
            send("error", {
              message:
                "Workflow finished but did not return an audit. " +
                "Check the dev server logs for the scoring agent's response.",
            });
          }
        }

        send("done", { result: finalResult ?? null });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Returns true if we emitted an audit event to the client.
function handleChunk(
  chunk: { type: string; payload?: Record<string, unknown> },
  send: (event: string, data: unknown) => void,
): boolean {
  switch (chunk.type) {
    case "workflow-start":
      send("status", { phase: "started", message: "Audit started" });
      return false;
    case "workflow-step-start": {
      const id = (chunk.payload?.id ?? "step") as string;
      send("status", { phase: "step-start", step: id, message: stepLabel(id) });
      return false;
    }
    case "workflow-step-result": {
      const id = (chunk.payload?.id ?? "step") as string;
      const status = chunk.payload?.status as string | undefined;
      if (status === "success" && id === "run-audit") {
        const output = chunk.payload?.output as
          | { audit?: unknown; app?: unknown; listing?: unknown; competitors?: unknown }
          | undefined;
        if (output && output.audit && output.app) {
          send("audit", output);
          return true;
        }
      } else if (status === "failed") {
        send("error", { message: `Step ${id} failed` });
      }
      return false;
    }
    case "workflow-finish":
      send("status", { phase: "finished", message: "Done" });
      return false;
    case "workflow-canceled":
      send("error", { message: "Workflow was cancelled" });
      return false;
    default:
      return false;
  }
}

function stepLabel(stepId: string): string {
  switch (stepId) {
    case "identify-app":
      return "Identifying app…";
    case "run-audit":
      return "Scraping listing and running audit…";
    default:
      return stepId;
  }
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
