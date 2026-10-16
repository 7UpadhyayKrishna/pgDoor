"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null; role: string };
};

export function ChatSheet({
  leadId,
  title = "Chat with owner",
  triggerLabel = "Open chat",
  triggerVariant = "outline" as const,
  triggerClassName,
  open: controlledOpen,
  onOpenChange,
}: {
  leadId: string;
  title?: string;
  triggerLabel?: string;
  triggerVariant?: "outline" | "default";
  triggerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/leads/${leadId}/messages`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load chat");
      return;
    }
    setMessages(data.messages ?? []);
    if (data.currentUserId) setCurrentUserId(data.currentUserId);
    setError("");
  }

  useEffect(() => {
    if (!open) return;
    void load();
    const timer = setInterval(() => {
      void load();
    }, 4000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/leads/${leadId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      setError(data.error ?? "Could not send message");
      return;
    }
    setText("");
    if (data.message) {
      setCurrentUserId(data.message.senderId);
      setMessages((curr) => {
        if (curr.some((m) => m.id === data.message.id)) return curr;
        return [...curr, data.message];
      });
    } else {
      void load();
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined ? (
        <SheetTrigger asChild>
          <Button variant={triggerVariant} className={triggerClassName} size="sm">
            {triggerLabel}
          </Button>
        </SheetTrigger>
      ) : null}
      <SheetContent className="flex flex-col">
        <SheetTitle>{title}</SheetTitle>
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <div className="min-h-[240px] flex-1 space-y-2 overflow-y-auto rounded-xl bg-canvas p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet. Say hello.</p>
            ) : (
              messages.map((m) => {
                const mine = currentUserId ? m.senderId === currentUserId : false;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine ? "ml-auto bg-primary text-white" : "bg-white shadow-card"
                    }`}
                  >
                    <p className="text-[10px] opacity-70">
                      {mine
                        ? "You"
                        : (m.sender.name ?? (m.sender.role === "OWNER" ? "Owner" : "Seeker"))}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap">{m.body}</p>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
          {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
          <div className="mt-3 flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button type="button" onClick={send} disabled={loading || !text.trim()}>
              Send
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
