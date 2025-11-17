"use client";

import { useEffect, useMemo, useRef } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Send, X } from "lucide-react";

export type ChatWindowMessage = {
  id?: string | number;
  senderEmail?: string;
  senderName?: string;
  content: string;
  timestamp: string | Date;
};

type ChatWindowProps = {
  title: string;
  meEmail: string;
  messages: ChatWindowMessage[];
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  height?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  warning?: string;
};

function formatNameFirstInitial(raw: string | undefined): string {
  const s = (raw || "").trim();
  if (!s) return "Unknown";
  const emailIdx = s.indexOf("@");
  const base = emailIdx > 0 ? s.slice(0, emailIdx) : s;
  const parts = base
    .replace(/[_.-]+/g, " ")
    .split(" ")
    .filter(Boolean);
  if (parts.length === 0) return "Unknown";
  if (parts.length === 1) return capitalize(parts[0]);
  const first = capitalize(parts[0]);
  const last = capitalize(parts[parts.length - 1]);
  return `${first} ${last.charAt(0)}`;
}

function capitalize(v: string): string {
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1);
}

function formatClock(value: string | Date): string {
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

export default function ChatWindow({
  title,
  meEmail,
  messages,
  value,
  onChange,
  onSend,
  onClose,
  height = "26vh",
  placeholder = "Type a message...",
  readOnly,
  className,
  warning,
}: ChatWindowProps) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const meLower = useMemo(() => (meEmail || "").toLowerCase(), [meEmail]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div
      className={`rounded bg-white flex flex-col overflow-hidden ${
        className || ""
      }`}
      style={{ height }}
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b bg-gray-50">
        <div className="text-sm font-medium truncate">{title}</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-2 min-h-0">
        <div className="space-y-2 text-sm">
          {messages.length === 0 ? (
            <div className="text-gray-500">No messages yet.</div>
          ) : (
            messages.map((m, idx) => {
              const senderLower = (m.senderEmail || "").toLowerCase();
              const isFromMe = senderLower === meLower;
              // Use senderName directly if provided (already formatted), otherwise format from email
              const displayName = m.senderName
                ? m.senderName
                : formatNameFirstInitial(m.senderEmail);
              const when = formatClock(m.timestamp);
              return (
                <div key={m.id ?? idx} className="w-full">
                  <div
                    className={`flex ${
                      isFromMe ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div className="w-full">
                      <div className="text-[12px] text-gray-600 flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {displayName}
                        </span>
                        {when ? (
                          <span className="text-[11px] text-gray-500">
                            {when}
                          </span>
                        ) : null}
                      </div>
                      <div className="whitespace-pre-wrap mt-0.5">
                        {m.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="flex-shrink-0 p-2 border-t bg-white flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              className="flex-1 min-w-0"
            />
            <Button onClick={onSend} size="sm" className="h-8 w-8 p-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {warning ? (
            <p className="text-[11px] text-red-500">{warning}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
