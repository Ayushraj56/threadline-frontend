
"use client";

function PreviewBubble({ mine, children, tick }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-bubble px-3.5 py-2 text-[12.5px] leading-relaxed ${
          mine
            ? "rounded-br-md bg-mint text-mintDeep"
            : "rounded-bl-md bg-white/10 text-white/85"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <main className="flex min-h-screen w-full">
      <section className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-void px-10 py-10 lg:flex">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-mint" />
          <span className="font-display text-[15px] font-semibold tracking-tight text-white">
            Threadline
          </span>
        </div>

        <div className="max-w-sm space-y-5">
          <PreviewBubble>Hi, is the Everyday Tote back in stock?</PreviewBubble>
          <PreviewBubble mine>Yes — restocked this morning, ships in 2 days.</PreviewBubble>
          <PreviewBubble>Perfect, sending payment now.</PreviewBubble>
        </div>

        <div>
          <p className="font-display text-[22px] font-medium leading-snug text-white">
            Every conversation,
            <br />
            one thread away.
          </p>
          <p className="mt-2 text-[13px] text-white/45">
            Support, sales, and order chats — all in a single inbox.
          </p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="h-6 w-6 rounded-md bg-mint" />
            <span className="font-display text-[14px] font-semibold tracking-tight text-ink">
              Threadline
            </span>
          </div>

          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-[26px] font-semibold text-ink">
            {title}
          </h1>
          <p className="mt-1.5 text-[13.5px] text-muted">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}