"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export default function NewChatModal({ onClose, onChatCreated }) {
  const [mode, setMode] = useState("direct"); // "direct" | "group"
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Group-mode only
  const [selectedUsers, setSelectedUsers] = useState([]); // [{_id, name, email}]
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/users?search=${encodeURIComponent(search)}`);
        const data = await res.json();
        setUsers(data.users || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  function switchMode(next) {
    setMode(next);
    setSelectedUsers([]);
    setGroupName("");
  }

  function isSelected(user) {
    return selectedUsers.some((u) => u._id === user._id);
  }

  function toggleSelected(user) {
    setSelectedUsers((prev) =>
      isSelected(user) ? prev.filter((u) => u._id !== user._id) : [...prev, user]
    );
  }

  async function handlePickDirect(user) {
    setCreating(true);
    try {
      const res = await authFetch("/api/chats", {
        method: "POST",
        body: JSON.stringify({ participantId: user._id }),
      });

      if (!res.ok) throw new Error("Failed to create chat");

      const data = await res.json();
      onChatCreated(data.chatId);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim()) {
      alert("Give the group a name first.");
      return;
    }
    if (selectedUsers.length < 2) {
      alert("Pick at least 2 people for a group.");
      return;
    }

    setCreating(true);
    try {
      const res = await authFetch("/api/chats/group", {
        method: "POST",
        body: JSON.stringify({
          sessionName: groupName.trim(),
          participantIds: selectedUsers.map((u) => u._id),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create group");
      }

      const data = await res.json();
      onChatCreated(data.chatId);
    } catch (err) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[380px] rounded-xl bg-rail p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-medium text-white/90">
            {mode === "direct" ? "New chat" : "New group"}
          </span>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">
            ✕
          </button>
        </div>

        {/* Mode switch */}
        <div className="mb-3 flex gap-1 rounded-lg bg-white/[0.04] p-1">
          <button
            onClick={() => switchMode("direct")}
            className={`flex-1 rounded-md py-1.5 text-[12.5px] font-medium transition-colors ${
              mode === "direct"
                ? "bg-white/[0.1] text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Direct message
          </button>
          <button
            onClick={() => switchMode("group")}
            className={`flex-1 rounded-md py-1.5 text-[12.5px] font-medium transition-colors ${
              mode === "group"
                ? "bg-white/[0.1] text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Group
          </button>
        </div>

        {mode === "group" && (
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="mb-3 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-[13px] text-white/90 placeholder:text-white/35 focus:outline-none"
          />
        )}

        {mode === "group" && selectedUsers.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {selectedUsers.map((u) => (
              <span
                key={u._id}
                className="flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 text-[11.5px] text-mint"
              >
                {u.name}
                <button
                  onClick={() => toggleSelected(u)}
                  className="text-mint/70 hover:text-mint"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="mb-3 w-full rounded-lg bg-white/[0.06] px-3 py-2 text-[13px] text-white/90 placeholder:text-white/35 focus:outline-none"
        />

        <div className="max-h-[260px] overflow-y-auto">
          {loading && (
            <div className="px-2 py-3 text-[12px] text-white/40">Searching…</div>
          )}

          {!loading && users.length === 0 && (
            <div className="px-2 py-3 text-[12px] text-white/40">
              {search ? "No users found." : "Start typing to search."}
            </div>
          )}

          {mode === "direct" &&
            users.map((user) => (
              <button
                key={user._id}
                disabled={creating}
                onClick={() => handlePickDirect(user)}
                className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-white/[0.06] disabled:opacity-50"
              >
                <span className="text-[13px] text-white/90">{user.name}</span>
                <span className="text-[11.5px] text-white/40">{user.email}</span>
              </button>
            ))}

          {mode === "group" &&
            users.map((user) => {
              const selected = isSelected(user);
              return (
                <button
                  key={user._id}
                  disabled={creating}
                  onClick={() => toggleSelected(user)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/[0.06] disabled:opacity-50 ${
                    selected ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      selected ? "border-mint bg-mint" : "border-white/25"
                    }`}
                  >
                    {selected && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3 text-mintDeep" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="flex flex-col items-start">
                    <span className="text-[13px] text-white/90">{user.name}</span>
                    <span className="text-[11.5px] text-white/40">{user.email}</span>
                  </span>
                </button>
              );
            })}
        </div>

        {mode === "group" && (
          <button
            onClick={handleCreateGroup}
            disabled={creating || selectedUsers.length < 2 || !groupName.trim()}
            className="mt-3 w-full rounded-lg bg-mint py-2.5 text-[13px] font-medium text-mintDeep transition-opacity disabled:opacity-30"
          >
            {creating ? "Creating…" : `Create group${selectedUsers.length ? ` (${selectedUsers.length + 1})` : ""}`}
          </button>
        )}
      </div>
    </div>
  );
}