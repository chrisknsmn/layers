import { Chat } from "./chat";

export function LayerCard() {
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
          <Chat />
        </div>
      </div>
    </div>
  );
}
