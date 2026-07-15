"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ConversationRail from "@/components/ConversationRail";
import ChatWindow from "@/components/ChatWindow";
import NewChatModal from "@/components/NewChatModal";
import { getSocket } from "@/lib/socket";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Map backend chat shape -> the shape ConversationRail/ChatWindow expect
function toConversation(chat) {
  return {
    id: chat.id,
    name: chat.sessionName || "Unnamed chat",
    avatar: chat.sessionImage || "",
    isGroup: !!chat.isGroup,
    unread: chat.unreadCount || 0,
    lastAt: chat.lastMessage?.at
      ? new Date(chat.lastMessage.at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      : "",
    lastMessageText: chat.lastMessage?.text || "",
    participantIds: (chat.participantIds || []).map(String),
    messages: [], // full history isn't fetched yet — see note below
    hasMoreOlder: true, // unknown until the first page loads; assume yes
    loadingOlder: false,
  };
}

// Turn "Ayush Raj Singh" into "AR" for the avatar circle
function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(() => new Set());

  const loadProfile = useCallback(async (selectId) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(
          res.status === 401 ? "Not logged in" : `Request failed (${res.status})`
        );
      }

      const data = await res.json();
      const mapped = (data.chats || []).map(toConversation);

      setConversations((prev) => {
        const prevById = Object.fromEntries(prev.map((c) => [c.id, c]));
        return mapped.map((c) => ({
          ...c,
          messages: prevById[c.id]?.messages ?? c.messages,
          // Never let a background refresh re-flag the chat that's
          // currently open as unread — the backend may not have
          // finished recording the "read" yet.
          unread: c.id === activeIdRef.current ? 0 : c.unread,
        }));
      });
      setCurrentUser({
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        initials: getInitials(data.user.name),
      });

      if (selectId) {
        setActiveId(selectId);
      } else if (mapped.length > 0) {
        setActiveId((prev) => prev ?? mapped[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // loadProfile's setState calls happen after an `await` (async fetch
    // pattern), not synchronously — this rule can't see across the
    // function boundary, so it's a false positive here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  function handleChatCreated(chatId) {
    setShowNewChat(false);
    loadProfile(chatId); // refresh the list and jump straight into the new chat
  }

  async function handleLogout() {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if the request fails, still clear local state and redirect —
      // there's nothing useful to do differently on the client either way.
    }

    getSocket().disconnect();
    router.push("/login");
  }

  // Map a raw backend message doc -> the shape ChatWindow expects
  const toDisplayMessage = useCallback(
    (m) => ({
      id: m._id,
      from: String(m.senderId) === String(currentUser?.id) ? "me" : "them",
      text: m.message,
      attachmentUrl: m.mediaUrl ? `${API_URL}${m.mediaUrl}` : null,
      attachmentName: m.fileName || null,
      isImage: m.messageType === "image",
      createdAt: m.createdAt, // kept for pagination cursors, not for display
      at: new Date(m.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "delivered",
    }),
    [currentUser]
  );

  const loadMessages = useCallback(
    async (chatId) => {
      try {
        const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
          credentials: "include",
        });
        if (!res.ok) return;

        const data = await res.json();
        const displayMessages = (data.messages || []).map(toDisplayMessage);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? { ...c, messages: displayMessages, hasMoreOlder: !!data.hasMore }
              : c
          )
        );
      } catch {
        // Silently ignore — the chat window will just stay empty on failure.
      }
    },
    [toDisplayMessage]
  );

  // Mirrors conversations so loadOlderMessages can read the current
  // oldest-message cursor and hasMoreOlder flag without needing
  // conversations as a dependency (which would recreate this callback,
  // and any effect depending on it, on every message received).
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadOlderMessages = useCallback(
    async (chatId) => {
      const current = conversationsRef.current.find((c) => c.id === chatId);
      if (!current || !current.hasMoreOlder || current.loadingOlder) return;

      const oldest = current.messages[0];
      if (!oldest?.createdAt) return;

      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, loadingOlder: true } : c))
      );

      try {
        const url = `${API_URL}/api/chats/${chatId}/messages?before=${encodeURIComponent(
          oldest.createdAt
        )}`;
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load older messages");

        const data = await res.json();
        const olderMessages = (data.messages || []).map(toDisplayMessage);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? {
                ...c,
                messages: [...olderMessages, ...c.messages],
                hasMoreOlder: !!data.hasMore,
                loadingOlder: false,
              }
              : c
          )
        );
      } catch {
        setConversations((prev) =>
          prev.map((c) => (c.id === chatId ? { ...c, loadingOlder: false } : c))
        );
      }
    },
    [toDisplayMessage]
  );

  // Mirrors conversations' ids so the socket handler can check "do we
  // already know this chat?" without side-effecting inside setState.
  const knownChatIdsRef = useRef(new Set());
  useEffect(() => {
    knownChatIdsRef.current = new Set(conversations.map((c) => c.id));
  }, [conversations]);

  // Lets the socket handler (registered once) know which chat is
  // currently open, without needing activeId as a dependency.
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Load the initial history once when a chat is opened. After that,
  // the socket's "newMessage" event keeps it live.
  useEffect(() => {
    if (!activeId || !currentUser) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages(activeId);
  }, [activeId, currentUser, loadMessages]);

  // Join/leave the active chat's socket room as it changes.
  useEffect(() => {
    if (!activeId || !currentUser) return;
    const socket = getSocket();
    socket.emit("joinChat", activeId);
    return () => socket.emit("leaveChat", activeId);
  }, [activeId, currentUser]);

  // Connect once the user is known, and wire up the two events the
  // backend emits: a new message, and "your chat list changed."
  useEffect(() => {
    if (!currentUser) return;

    const socket = getSocket();
    socket.connect();

    function handleNewMessage(rawMessage) {
      const chatId = String(rawMessage.chatId);
      const display = toDisplayMessage(rawMessage);

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          // Dedupe defensively: drop any existing copy of this id first,
          // then add it back exactly once. Covers both "we already have
          // it" and any accidental double-fire of this handler.
          const withoutDupe = c.messages.filter((m) => m.id !== display.id);
          return {
            ...c,
            messages: [...withoutDupe, display],
            lastAt: display.at,
            lastMessageText: display.text,
          };
        })
      );

      // If the message is for a chat we don't have loaded at all yet
      // (a brand new chat we just got added to), refresh the list.
      if (!knownChatIdsRef.current.has(chatId)) {
        loadProfile(chatId);
        return;
      }

      // If we're actively looking at this chat right now, immediately
      // tell the backend we've read it — otherwise the unread badge
      // would flash on before the next profile refresh clears it.
      if (chatId === activeIdRef.current) {
        fetch(`${API_URL}/api/chats/${chatId}/messages`, {
          credentials: "include",
        }).catch(() => { });
      }
    }

    function handleChatUpdated() {
      // A new chat was created with us, or another chat's preview
      // changed — just refresh the list; keep whatever chat is open.
      loadProfile();
    }

    function handleOnlineUsers(ids) {
      setOnlineUserIds(new Set(ids.map(String)));
    }

    function handlePresenceChanged({ userId, online }) {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(String(userId));
        else next.delete(String(userId));
        return next;
      });
    }

    socket.on("newMessage", handleNewMessage);
    socket.on("chatUpdated", handleChatUpdated);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("presenceChanged", handlePresenceChanged);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("chatUpdated", handleChatUpdated);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("presenceChanged", handlePresenceChanged);
      socket.disconnect();
    };
  }, [currentUser, toDisplayMessage, loadProfile]);

  const conversationsWithPresence = useMemo(
    () =>
      conversations.map((c) => ({
        ...c,
        online: c.participantIds.some((id) => onlineUserIds.has(id)),
      })),
    [conversations, onlineUserIds]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversationsWithPresence;
    return conversationsWithPresence.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }, [conversationsWithPresence, query]);

  const active = conversationsWithPresence.find((c) => c.id === activeId) || null;

  function handleSelect(id) {
    setActiveId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  }

  async function handleSendMessage(id, text, attachment) {
    // Optimistic bubble so the UI feels instant.
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      from: "me",
      text,
      attachmentUrl: attachment?.previewUrl || null,
      attachmentName: attachment?.file?.name || null,
      isImage: attachment?.isImage || false,
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sending",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages: [...c.messages, optimisticMessage], lastAt: "now" }
          : c
      )
    );

    try {
      let res;

      if (attachment?.file) {
        const formData = new FormData();
        formData.append("message", text);
        formData.append("media", attachment.file);

        res = await fetch(`${API_URL}/api/chats/${id}/messages`, {
          method: "POST",
          credentials: "include",
          body: formData, // no Content-Type header — the browser sets the multipart boundary itself
        });
      } else {
        res = await fetch(`${API_URL}/api/chats/${id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message: text }),
        });
      }

      if (!res.ok) throw new Error("Send failed");

      const data = await res.json();
      const saved = toDisplayMessage(data.message);

      // Swap the optimistic bubble out for the real, persisted message.
      // Remove BOTH the temp placeholder and any existing copy of the
      // real id first — the socket's "newMessage" event may have already
      // added this same message if it arrived before this response did.
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const withoutDupes = c.messages.filter(
            (m) => m.id !== tempId && m.id !== saved.id
          );
          return { ...c, messages: [...withoutDupes, saved] };
        })
      );
    } catch {
      // Mark the optimistic bubble as failed rather than silently losing it.
      setConversations((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === tempId ? { ...m, status: "failed" } : m
              ),
            }
            : c
        )
      );
    }
  }

  if (loading) {
    return <main className="flex h-screen w-full items-center justify-center">Loading…</main>;
  }

  if (error) {
    return (
      <main className="flex h-screen w-full items-center justify-center text-red-500">
        {error === "Not logged in" ? "Please log in to view your chats." : error}
      </main>
    );
  }

  return (
    <main className="flex h-screen w-full overflow-hidden">
      <ConversationRail
        conversations={filtered}
        activeId={activeId}
        onSelect={handleSelect}
        query={query}
        onQueryChange={setQuery}
        currentUser={currentUser}
        onNewChat={() => setShowNewChat(true)}
        onLogout={handleLogout}
      />
      <ChatWindow
        conversation={active}
        onSendMessage={handleSendMessage}
        onLoadOlder={() => active && loadOlderMessages(active.id)}
        hasMoreOlder={active?.hasMoreOlder ?? false}
        loadingOlder={active?.loadingOlder ?? false}
      />
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={handleChatCreated}
        />
      )}
    </main>
  );
}