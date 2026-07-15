"use client";

import { IconSearch } from "./icons";

function Avatar({ initials, online, size = 44 }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10 font-display text-sm font-medium text-white/90">
        {initials}
      </div>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-rail bg-mint animate-pulse_ring" />
      )}
    </div>
  );
}

export default function ConversationRail({
  conversations,
  activeId,
  onSelect,
  query,
  onQueryChange,
  currentUser,
  onNewChat,
  onLogout,
}) {
  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col bg-rail">
      <div className="flex items-center gap-2 px-5 pb-4 pt-6">
        <div className="h-7 w-7 rounded-md bg-mint" />
        <span className="font-display text-[15px] font-semibold tracking-tight text-white">
          Threadline
        </span>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2">
          <IconSearch className="h-4 w-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-[13px] text-white/90 placeholder:text-white/35 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-white/35">
          Inbox
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-white/35">
            {conversations.length}
          </span>
          <button
            onClick={onNewChat}
            title="New chat"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[13px] leading-none text-white/70 hover:bg-white/20"
          >
            +
          </button>
        </div>
      </div>

      <nav className="thin-scroll flex-1 overflow-y-auto px-2 pb-4">
        {conversations.map((c) => {
          const active = c.id === activeId;
          const last = c.messages[c.messages.length - 1];
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
              }`}
            >
              <Avatar initials={c.initials} online={c.online} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-medium text-white/90">
                    {c.name}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-white/30">
                    {c.lastAt}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] text-white/45">
                    {last?.from === "me" ? "You: " : ""}
                    {last?.text}
                  </span>
                  {c.unread > 0 && (
                    <span className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-mint px-1 font-mono text-[10px] font-medium text-mintDeep">
                      {c.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Logged-in user footer */}
      {currentUser && (
        <div className="flex items-center gap-3 border-t border-white/[0.06] px-4 py-3">
          <Avatar initials={currentUser.initials} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-white/90">
              {currentUser.name}
            </div>
            <div className="truncate text-[11.5px] text-white/40">
              {currentUser.email}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log out"
            className="shrink-0 rounded-lg px-2 py-1 text-[11.5px] text-white/40 hover:bg-white/[0.08] hover:text-white/80"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}