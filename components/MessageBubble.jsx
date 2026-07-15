"use client";

import { IconCheck, IconCheckDouble } from "./icons";

function IconFileGeneric(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" {...props}>
      <path d="M6 3h8l5 5v13a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M14 3v5h5" strokeLinejoin="round" />
    </svg>
  );
}

export default function MessageBubble({ message }) {
  const mine = message.from === "me";
  const failed = message.status === "failed";

  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[62%] rounded-bubble px-4 py-2.5 text-[13.5px] leading-relaxed ${
          mine
            ? "rounded-br-md bg-ink text-white"
            : "rounded-bl-md border border-line bg-white text-ink"
        } ${failed ? "opacity-60" : ""}`}
      >
        {message.attachmentUrl &&
          (message.isImage ? (
            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={message.attachmentUrl}
                alt={message.attachmentName || "Attachment"}
                className={`mb-2 max-h-64 w-full rounded-lg object-cover ${
                  message.text ? "" : "mb-0"
                }`}
              />
            </a>
          ) : (
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`mb-2 flex items-center gap-2 rounded-lg px-2.5 py-2 ${
                mine ? "bg-white/10" : "bg-ink/[0.04]"
              } ${message.text ? "" : "mb-0"}`}
            >
              <IconFileGeneric className="h-5 w-5 shrink-0" />
              <span className="truncate text-[12.5px] underline underline-offset-2">
                {message.attachmentName || "Attachment"}
              </span>
            </a>
          ))}

        {message.text && <p>{message.text}</p>}

        <div
          className={`mt-1 flex items-center justify-end gap-1 font-mono text-[10px] ${
            mine ? "text-white/40" : "text-muted"
          }`}
        >
          {failed ? (
            <span className="text-red-400">Failed to send</span>
          ) : (
            <>
              <span>{message.at}</span>
              {mine &&
                (message.status === "read" ? (
                  <IconCheckDouble className="h-3 w-3 text-mint" />
                ) : (
                  <IconCheck className="h-3 w-3" />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}