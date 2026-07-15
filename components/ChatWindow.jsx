"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import {
  IconPaperclip,
  IconPhone,
  IconSend,
  IconSmile,
  IconVideo,
  IconMore,
} from "./icons";

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-bubble rounded-bl-md border border-line bg-white px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce_dot rounded-full bg-muted [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce_dot rounded-full bg-muted [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce_dot rounded-full bg-muted" />
      </div>
    </div>
  );
}

function IconX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" {...props}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconFile(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M6 3h8l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinejoin="round" />
    </svg>
  );
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function ChatWindow({
  conversation,
  onSendMessage,
  onLoadOlder,
  hasMoreOlder,
  loadingOlder,
}) {
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [attachment, setAttachment] = useState(null); // { file, previewUrl, isImage }
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const prevConversationIdRef = useRef(null);
  const pendingOldScrollHeightRef = useRef(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !conversation) return;

    const chatChanged = prevConversationIdRef.current !== conversation.id;

    if (chatChanged) {
      el.scrollTop = el.scrollHeight;
      pendingOldScrollHeightRef.current = null;
    } else if (pendingOldScrollHeightRef.current !== null) {
      const heightDiff = el.scrollHeight - pendingOldScrollHeightRef.current;
      el.scrollTop = el.scrollTop + heightDiff;
      pendingOldScrollHeightRef.current = null;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }

    prevConversationIdRef.current = conversation.id;
  }, [conversation?.id, conversation?.messages, typing]);

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    };
  }, [attachment]);

  useEffect(() => {
    setAttachment((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, [conversation?.id]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !conversation || !onLoadOlder) return;

    if (el.scrollTop < 60 && hasMoreOlder && !loadingOlder) {
      pendingOldScrollHeightRef.current = el.scrollHeight;
      onLoadOlder();
    }
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-canvas">
        <p className="text-sm text-muted">Select a conversation to start chatting.</p>
      </div>
    );
  }

  function handleSend() {
    const text = draft.trim();
    if (!text && !attachment) return;

    onSendMessage(conversation.id, text, attachment);

    setDraft("");
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setTyping(true);
    setTimeout(() => setTyping(false), 1600);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);

    const isImage = file.type.startsWith("image/");
    setAttachment({
      file,
      previewUrl: isImage ? URL.createObjectURL(file) : null,
      isImage,
    });

    e.target.value = "";
  }

  function handleRemoveAttachment() {
    if (attachment?.previewUrl) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
  }

  return (
    <section className="flex h-full flex-1 flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.06] font-display text-[13px] font-medium text-ink">
            {conversation.initials}
          </div>
          <div>
            <p className="font-display text-[14px] font-semibold text-ink">
              {conversation.name}
            </p>
            <p className="flex items-center gap-1.5 text-[12px] text-muted">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  conversation.online ? "bg-mint" : "bg-muted/50"
                }`}
              />
              {conversation.online ? "Online" : "Offline"} · {conversation.role}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-muted">
          <button className="rounded-lg p-2 hover:bg-ink/[0.05] hover:text-ink">
            <IconPhone className="h-[18px] w-[18px]" />
          </button>
          <button className="rounded-lg p-2 hover:bg-ink/[0.05] hover:text-ink">
            <IconVideo className="h-[18px] w-[18px]" />
          </button>
          <button className="rounded-lg p-2 hover:bg-ink/[0.05] hover:text-ink">
            <IconMore className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="thin-scroll-light flex-1 space-y-3 overflow-y-auto px-6 py-6"
      >
        {loadingOlder && (
          <p className="pb-2 text-center text-[11.5px] text-muted">
            Loading earlier messages…
          </p>
        )}
        {!hasMoreOlder && conversation.messages.length > 0 && (
          <p className="pb-2 text-center text-[11.5px] text-muted/70">
            Beginning of conversation
          </p>
        )}
        {conversation.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {typing && <TypingBubble />}
      </div>

      <div className="border-t border-line px-6 py-4">
        {attachment && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2">
            {attachment.isImage ? (
              <img
                src={attachment.previewUrl}
                alt={attachment.file.name}
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ink/[0.06] text-muted">
                <IconFile className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">
                {attachment.file.name}
              </p>
              <p className="text-[11.5px] text-muted">
                {formatBytes(attachment.file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveAttachment}
              className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-ink/[0.05] hover:text-ink"
              aria-label="Remove attachment"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border border-line bg-white px-3 py-2">
          <button
            type="button"
            onClick={handleAttachmentClick}
            className="shrink-0 rounded-lg p-2 text-muted hover:bg-ink/[0.05] hover:text-ink"
          >
            <IconPaperclip className="h-[18px] w-[18px]" />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message"
            rows={1}
            className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-[13.5px] leading-relaxed text-ink placeholder:text-muted focus:outline-none"
          />
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
          />
          <button className="shrink-0 rounded-lg p-2 text-muted hover:bg-ink/[0.05] hover:text-ink">
            <IconSmile className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={handleSend}
            disabled={!draft.trim() && !attachment}
            className="shrink-0 rounded-xl bg-ink p-2.5 text-white transition-opacity disabled:opacity-30"
          >
            <IconSend className="h-[16px] w-[16px]" />
          </button>
        </div>
      </div>
    </section>
  );
}