"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Message,
  AssistantConfirm,
  AssistantAudit,
} from "./types";
import { AppConfirmCard } from "./app-confirm-card";
import { AuditResult } from "./audit-result";

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "awaiting-confirmation"; runId: string }
  | { kind: "auditing"; runId: string }
  | { kind: "audited"; audit: AssistantAudit }
  | { kind: "chatting" }
  | { kind: "error" };

const APP_STORE_URL_RE =
  /https?:\/\/apps\.apple\.com\/[a-z]{2}\/app\/(?:[^/\s]+\/)?id\d+/i;

const EXAMPLE_URLS = [
  "https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580",
  "https://apps.apple.com/us/app/instagram/id389801252",
  "https://apps.apple.com/us/app/tiktok/id835599320",
  "https://apps.apple.com/us/app/netflix/id363590051",
  "https://apps.apple.com/us/app/duolingo-language-lessons/id570060128",
];
// Duplicate the first URL at the end so the carousel can transition off the
// last real item into the duplicate and then snap (without animation) back
// to index 0 — producing a seamless infinite roll.
const LOOP_URLS = [...EXAMPLE_URLS, EXAMPLE_URLS[0]];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [exampleIdx, setExampleIdx] = useState(0);
  const [exampleAnimating, setExampleAnimating] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const hasStarted = messages.some((m) => m.role === "user");

  useEffect(() => {
    if (hasStarted) return;
    const id = setInterval(() => {
      setExampleIdx((i) => i + 1);
    }, 2500);
    return () => clearInterval(id);
  }, [hasStarted]);

  const onCarouselTransitionEnd = useCallback(() => {
    if (exampleIdx >= EXAMPLE_URLS.length) {
      // Just animated onto the duplicate-of-first slot. Snap back to 0
      // without a transition so the next tick rolls forward seamlessly.
      setExampleAnimating(false);
      setExampleIdx(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setExampleAnimating(true));
      });
    }
  }, [exampleIdx]);

  const fetchHeaders = useCallback(
    (extra?: Record<string, string>): HeadersInit => ({
      "content-type": "application/json",
      "x-aso-mock": "1",
      ...extra,
    }),
    [],
  );

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, phase]);

  const auditedTurn = useMemo<AssistantAudit | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.kind === "audit") return m;
    }
    return null;
  }, [messages]);

  const append = useCallback(
    (m: Message) => setMessages((prev) => [...prev, m]),
    [],
  );
  const update = useCallback(
    (id: string, patch: Partial<Message>) =>
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id ? ({ ...m, ...patch } as Message) : m,
        ),
      ),
    [],
  );
  const removeId = useCallback(
    (id: string) => setMessages((prev) => prev.filter((m) => m.id !== id)),
    [],
  );

  const startAudit = useCallback(
    async (url: string) => {
      const userMsg: Message = {
        id: makeId(),
        role: "user",
        text: url,
      };
      const statusId = makeId();
      append(userMsg);
      append({
        id: statusId,
        role: "assistant",
        kind: "status",
        text: "Identifying app…",
      });
      setPhase({ kind: "starting" });

      try {
        const res = await fetch("/api/audit/start", {
          method: "POST",
          headers: fetchHeaders(),
          body: JSON.stringify({ url }),
        });
        const data = (await res.json()) as
          | {
              status: "awaiting_confirmation";
              runId: string;
              candidate: AssistantConfirm["candidate"];
            }
          | { error: string };

        removeId(statusId);

        if (!res.ok || "error" in data) {
          const message =
            "error" in data ? data.error : "Failed to identify app.";
          append({ id: makeId(), role: "assistant", kind: "error", text: message });
          setPhase({ kind: "error" });
          return;
        }

        append({
          id: makeId(),
          role: "assistant",
          kind: "confirm",
          candidate: data.candidate,
          runId: data.runId,
        });
        setPhase({
          kind: "awaiting-confirmation",
          runId: data.runId,
        });
      } catch (err) {
        removeId(statusId);
        append({
          id: makeId(),
          role: "assistant",
          kind: "error",
          text: err instanceof Error ? err.message : "Network error",
        });
        setPhase({ kind: "error" });
      }
    },
    [append, removeId],
  );

  const resumeAudit = useCallback(
    async (confirmMsg: AssistantConfirm, confirmed: boolean) => {
      update(confirmMsg.id, { resolved: confirmed ? "yes" : "no" });

      if (!confirmed) {
        append({
          id: makeId(),
          role: "assistant",
          kind: "text",
          text:
            "No problem — paste a different App Store URL and we'll try again.",
        });
        setPhase({ kind: "idle" });
        return;
      }

      const statusId = makeId();
      append({
        id: statusId,
        role: "assistant",
        kind: "status",
        text: "Starting audit…",
      });
      setPhase({ kind: "auditing", runId: confirmMsg.runId });

      try {
        const res = await fetch("/api/audit/resume", {
          method: "POST",
          headers: fetchHeaders(),
          body: JSON.stringify({ runId: confirmMsg.runId, confirmed: true }),
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(data?.error ?? `Server error (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let auditFinal: AssistantAudit | null = null;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Parse SSE frames
          let i: number;
          while ((i = buffer.indexOf("\n\n")) !== -1) {
            const frame = buffer.slice(0, i);
            buffer = buffer.slice(i + 2);
            const { event, data } = parseSseFrame(frame);
            if (!event) continue;
            if (event === "status") {
              const msg = (data as { message?: string })?.message;
              if (msg)
                update(statusId, {
                  kind: "status",
                  text: msg,
                });
            } else if (event === "audit") {
              const payload = data as {
                audit: AssistantAudit["audit"];
                app: AssistantAudit["app"];
                listing: AssistantAudit["listing"];
                competitors: AssistantAudit["competitors"];
              };
              auditFinal = {
                id: makeId(),
                role: "assistant",
                kind: "audit",
                audit: payload.audit,
                app: payload.app,
                listing: payload.listing,
                competitors: payload.competitors,
              };
            } else if (event === "error") {
              const msg =
                (data as { message?: string })?.message ?? "Audit error";
              throw new Error(msg);
            }
          }
        }

        removeId(statusId);
        if (auditFinal) {
          append(auditFinal);
          append({
            id: makeId(),
            role: "assistant",
            kind: "text",
            text:
              "Audit complete. Ask me anything about these recommendations or " +
              "request alternatives — e.g. \"give me 5 subtitle options under 30 chars\".",
          });
          setPhase({ kind: "audited", audit: auditFinal });
        } else {
          throw new Error("Audit finished without returning a result");
        }
      } catch (err) {
        removeId(statusId);
        append({
          id: makeId(),
          role: "assistant",
          kind: "error",
          text: err instanceof Error ? err.message : "Audit failed",
        });
        setPhase({ kind: "error" });
      }
    },
    [append, update, removeId],
  );

  const sendChat = useCallback(
    async (text: string) => {
      const userMsg: Message = { id: makeId(), role: "user", text };
      const assistantId = makeId();
      append(userMsg);
      append({
        id: assistantId,
        role: "assistant",
        kind: "text",
        text: "",
      });
      const wasPhase = phase;
      setPhase({ kind: "chatting" });

      const history = [...messages, userMsg]
        .filter(
          (m): m is Message & { kind?: "text" } =>
            m.role === "user" ||
            (m.role === "assistant" && (m as { kind: string }).kind === "text"),
        )
        .map((m) => ({
          role: m.role,
          content:
            m.role === "user"
              ? (m as Message & { text: string }).text
              : (m as { text: string }).text,
        }))
        .filter((m) => m.content.trim().length > 0);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: fetchHeaders(),
          body: JSON.stringify({
            messages: history,
            audit: auditedTurn?.audit,
            appName: auditedTurn?.app?.trackName,
          }),
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(data?.error ?? `Chat error (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          update(assistantId, { kind: "text", text: acc });
        }
        setPhase(wasPhase);
      } catch (err) {
        update(assistantId, {
          kind: "error",
          text: err instanceof Error ? err.message : "Chat failed",
        });
        setPhase({ kind: "error" });
      }
    },
    [append, update, messages, phase, auditedTurn],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;
      setInput("");

      const urlMatch = trimmed.match(APP_STORE_URL_RE);
      if (urlMatch && (phase.kind === "idle" || phase.kind === "audited" || phase.kind === "error")) {
        await startAudit(urlMatch[0]);
        return;
      }

      if (phase.kind === "audited" || phase.kind === "chatting") {
        await sendChat(trimmed);
        return;
      }

      // No URL detected and no audit context: prompt for URL
      append({ id: makeId(), role: "user", text: trimmed });
      append({
        id: makeId(),
        role: "assistant",
        kind: "text",
        text: "I need an App Store URL to start. It looks like https://apps.apple.com/<country>/app/<slug>/id<numericId>.",
      });
    },
    [input, phase, startAudit, sendChat, append],
  );

  const busy =
    phase.kind === "starting" ||
    phase.kind === "auditing" ||
    phase.kind === "chatting";

  const titleCard = (
    <header className="shrink-0 rounded-xl border border-white bg-background px-6 py-5 text-center">
      <h1 className="font-mono text-xl font-bold uppercase tracking-wider text-white">
        ASO Audit Agent
      </h1>
      <p className="mt-2 font-mono text-xs leading-relaxed text-zinc-400">
        Paste any Apple App Store URL to get a scored ASO audit with
        prioritized recommendations to improve your listing.
      </p>
    </header>
  );

  const renderInputForm = (formClassName: string) => (
    <form onSubmit={onSubmit} className={formClassName}>
      <div className="flex items-center gap-3">
        <div className="relative h-5 min-w-0 flex-1">
          {!hasStarted && !input && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden"
            >
              <div
                className={
                  exampleAnimating
                    ? "transition-transform duration-500 ease-in-out"
                    : ""
                }
                style={{
                  transform: `translateY(-${
                    (exampleIdx * 100) / LOOP_URLS.length
                  }%)`,
                }}
                onTransitionEnd={onCarouselTransitionEnd}
              >
                {LOOP_URLS.map((url, i) => (
                  <div
                    key={i}
                    className="h-5 truncate text-sm leading-5 text-zinc-500"
                  >
                    {url}
                  </div>
                ))}
              </div>
            </div>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              hasStarted
                ? phase.kind === "audited"
                  ? "Ask a follow-up, or paste another App Store URL…"
                  : "Paste an Apple App Store URL…"
                : ""
            }
            className="block h-5 w-full appearance-none border-0 bg-transparent p-0 align-middle text-sm leading-5 outline-none placeholder:text-zinc-500 disabled:opacity-50"
            disabled={busy || phase.kind === "awaiting-confirmation"}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={
            !input.trim() || busy || phase.kind === "awaiting-confirmation"
          }
          className="shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 align-middle font-mono text-sm font-bold uppercase leading-5 tracking-wider text-primary outline-none hover:bg-transparent focus:bg-transparent active:bg-transparent disabled:cursor-not-allowed disabled:opacity-30"
        >
          Send →
        </button>
      </div>
      {phase.kind === "awaiting-confirmation" && (
        <p className="mt-2 text-center text-xs text-zinc-500">
          Confirm the app above to continue.
        </p>
      )}
    </form>
  );

  if (!hasStarted) {
    return (
      <div className="flex w-full max-w-3xl flex-col items-center gap-10 px-4">
        <div className="text-center">
          <h1 className="font-mono text-4xl font-bold uppercase tracking-wider text-white sm:text-5xl">
            ASO Audit Agent
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-mono text-sm leading-relaxed text-zinc-400 sm:text-base">
            Paste any Apple App Store URL to get a scored ASO audit with
            prioritized recommendations to improve your listing.
          </p>
        </div>
        {renderInputForm(
          "w-full max-w-xl rounded-full border border-white bg-background px-6 py-4",
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <div
        className="border border-white"
        style={{
          backgroundColor: "var(--background)",
          backgroundImage: "url(/dot-bg-hero.svg)",
        }}
      >
        <div className="h-[min(78vh,680px)] overflow-hidden">
          <div className="flex h-full min-h-0 flex-col gap-5 p-5">
            {titleCard}
            <div
              ref={scrollerRef}
              className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-white bg-background px-4 py-6"
            >
              <div className="mx-auto flex max-w-3xl flex-col gap-4">
                {messages.map((m) => (
                  <MessageView
                    key={m.id}
                    message={m}
                    onConfirm={resumeAudit}
                    disabled={busy}
                  />
                ))}
              </div>
            </div>
            {renderInputForm(
              "shrink-0 rounded-xl border border-white bg-background px-5 py-4",
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageView({
  message,
  onConfirm,
  disabled,
}: {
  message: Message;
  onConfirm: (msg: AssistantConfirm, confirmed: boolean) => void;
  disabled?: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-zinc-900">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.kind === "status") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Spinner />
        <span>{message.text}</span>
      </div>
    );
  }

  if (message.kind === "text") {
    return (
      <div className="max-w-[80%] rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm leading-6 text-zinc-900 dark:border-zinc-800 dark:bg-background dark:text-zinc-100">
        <span className="whitespace-pre-wrap">{message.text}</span>
        {message.text === "" && <Spinner inline />}
      </div>
    );
  }

  if (message.kind === "error") {
    return (
      <div className="max-w-[80%] rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
        {message.text}
      </div>
    );
  }

  if (message.kind === "confirm") {
    return (
      <AppConfirmCard
        candidate={message.candidate}
        onConfirm={() => onConfirm(message, true)}
        onReject={() => onConfirm(message, false)}
        disabled={disabled || !!message.resolved}
        resolved={message.resolved}
      />
    );
  }

  // audit
  return (
    <AuditResult
      app={message.app}
      audit={message.audit}
      listing={message.listing}
      competitors={message.competitors}
    />
  );
}

function Spinner({ inline }: { inline?: boolean }) {
  return (
    <span
      className={`inline-block ${inline ? "ml-0" : ""} size-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700 dark:border-zinc-700 dark:border-t-zinc-300`}
      aria-hidden
    />
  );
}

function parseSseFrame(frame: string): {
  event: string | null;
  data: unknown;
} {
  let event: string | null = null;
  let dataLine = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
  }
  if (!event) return { event: null, data: null };
  try {
    return { event, data: dataLine ? JSON.parse(dataLine) : null };
  } catch {
    return { event, data: dataLine };
  }
}
