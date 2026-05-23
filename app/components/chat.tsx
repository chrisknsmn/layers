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

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      kind: "text",
      text:
        "Paste an Apple App Store URL and I'll run an ASO audit. " +
        "Example: https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580",
    },
  ]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [useMock, setUseMock] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // v2 key so we ignore any stale "off" state from the prior default-off build.
    const v = localStorage.getItem("aso-use-mock-v2");
    if (v === "0") setUseMock(false);
  }, []);
  useEffect(() => {
    localStorage.setItem("aso-use-mock-v2", useMock ? "1" : "0");
  }, [useMock]);

  const fetchHeaders = useCallback(
    (extra?: Record<string, string>): HeadersInit => ({
      "content-type": "application/json",
      ...(useMock ? { "x-aso-mock": "1" } : {}),
      ...extra,
    }),
    [useMock],
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold">ASO Audit Agent</h1>
            <p className="text-xs text-zinc-500">
              Paste an App Store URL → confirm → get a scored audit.
            </p>
          </div>
          <label className="flex select-none items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              className="size-3.5 accent-amber-500"
              checked={useMock}
              onChange={(e) => setUseMock(e.target.checked)}
            />
            <span
              className={
                useMock
                  ? "rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/70 dark:text-amber-200"
                  : ""
              }
            >
              Mock data {useMock ? "ON" : "OFF"}
            </span>
          </label>
        </div>
      </header>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
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

      <form
        onSubmit={onSubmit}
        className="border-t border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-black/60"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              phase.kind === "audited"
                ? "Ask a follow-up, or paste another App Store URL…"
                : "Paste an Apple App Store URL…"
            }
            className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
            disabled={
              busy || phase.kind === "awaiting-confirmation"
            }
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={
              !input.trim() || busy || phase.kind === "awaiting-confirmation"
            }
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
          >
            Send
          </button>
        </div>
        {phase.kind === "awaiting-confirmation" && (
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-zinc-500">
            Confirm the app above to continue.
          </p>
        )}
      </form>
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
      <div className="max-w-[80%] rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm leading-6 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
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
