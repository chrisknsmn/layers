import { mastra } from "@/mastra";
import { appMetadataSchema } from "@/mastra/schemas";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StartBody = { url?: string };

export async function POST(req: Request) {
  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.url || typeof body.url !== "string") {
    return NextResponse.json(
      { error: "Missing 'url' (Apple App Store URL)" },
      { status: 400 },
    );
  }

  const workflow = mastra.getWorkflow("asoAuditWorkflow");
  const run = await workflow.createRun();

  try {
    const result = await run.start({ inputData: { url: body.url } });

    if (result.status === "suspended") {
      const suspendedStep =
        Array.isArray(result.suspended) && result.suspended.length > 0
          ? (Array.isArray(result.suspended[0])
              ? result.suspended[0][0]
              : (result.suspended[0] as string))
          : "identify-app";

      const stepResult = (
        result as unknown as {
          steps: Record<string, { suspendPayload?: { candidate?: unknown } }>;
        }
      ).steps[suspendedStep];

      const candidate = appMetadataSchema.safeParse(
        stepResult?.suspendPayload?.candidate,
      );
      if (!candidate.success) {
        return NextResponse.json(
          {
            error: "Workflow suspended without a candidate app payload",
            detail: candidate.error.format(),
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        runId: run.runId,
        status: "awaiting_confirmation",
        candidate: candidate.data,
      });
    }

    if (result.status === "failed") {
      return NextResponse.json(
        { error: messageFromError(result.error) },
        { status: 500 },
      );
    }

    if (result.status === "success") {
      return NextResponse.json({
        runId: run.runId,
        status: "completed",
        result: result.result,
      });
    }

    return NextResponse.json(
      { error: `Unexpected workflow status: ${result.status}` },
      { status: 500 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: messageFromError(err) },
      { status: 400 },
    );
  }
}

function messageFromError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}
