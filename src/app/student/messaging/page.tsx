"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

import { ThreadRow } from "@/components/messaging/ThreadRow";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageComposer } from "@/components/messaging/MessageComposer";

import {
  useStudentMessagingThreads,
  useStudentConversation,
  useStudentSendMessage,
} from "@/services/messaging/student/messaging";

import type { StudentMessagingLecturerThread } from "@/app/api/messaging/student/threads/route";
import type { MessagingMessageRow } from "@/app/api/messaging/student/messages/route";

function formatTime(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentMessagingPage() {
  const [search, setSearch] = React.useState("");
  const [activeLecturerId, setActiveLecturerId] = React.useState<string | null>(
    null,
  );
  const [message, setMessage] = React.useState("");

  const threadsQuery = useStudentMessagingThreads();
  const conversationQuery = useStudentConversation(activeLecturerId);
  const sendMessage = useStudentSendMessage();

  const lecturers = React.useMemo(() => {
    const list = (threadsQuery.data?.users ??
      []) as StudentMessagingLecturerThread[];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((l) =>
      String(l.name ?? "")
        .toLowerCase()
        .includes(q),
    );
  }, [threadsQuery.data, search]);

  const activeLecturerTitle = React.useMemo(() => {
    if (!activeLecturerId) return null;
    const list = (threadsQuery.data?.users ??
      []) as StudentMessagingLecturerThread[];
    const match = list.find((l) => l.userId === activeLecturerId);
    return match?.name ?? null;
  }, [activeLecturerId, threadsQuery.data]);

  async function handleSend() {
    if (!activeLecturerId) return;
    const content = message.trim();
    if (!content) return;

    await sendMessage.mutateAsync({
      content,
      recipientId: activeLecturerId,
    });

    setMessage("");
  }

  React.useEffect(() => {
    if (!activeLecturerId) return;
    const list = (threadsQuery.data?.users ??
      []) as StudentMessagingLecturerThread[];
    const stillExists = list.some((l) => l.userId === activeLecturerId);
    if (!stillExists) setActiveLecturerId(null);
  }, [activeLecturerId, threadsQuery.data]);

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 xl:col-span-3 border rounded-xl bg-background overflow-hidden flex flex-col">
        <div className="p-4 border-b space-y-3">
          <h2 className="text-base font-semibold">Messages</h2>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lecturers..."
          />
        </div>

        <div className="p-2 overflow-auto">
          {threadsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground p-2">Loading…</p>
          ) : lecturers.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              No lecturers available.
            </p>
          ) : (
            <div className="space-y-2">
              {lecturers.map((l) => (
                <ThreadRow
                  key={l.userId}
                  title={l.name ?? "Lecturer"}
                  subtitle={l.lastMessage ?? null}
                  time={formatTime(l.lastMessageAt) ?? null}
                  active={activeLecturerId === l.userId}
                  onClick={() => setActiveLecturerId(l.userId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 xl:col-span-9 border rounded-xl bg-background overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <p className="text-sm text-muted-foreground">Conversation</p>
          <h3 className="text-base font-semibold truncate">
            {activeLecturerTitle ?? "Select a lecturer"}
          </h3>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!activeLecturerId ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a lecturer to start chatting.
              </p>
            </div>
          ) : conversationQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (conversationQuery.data?.rows ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello.
            </p>
          ) : (
            <div className="space-y-2">
              {(conversationQuery.data?.rows ?? []).map(
                (m: MessagingMessageRow) => (
                  <MessageBubble
                    key={m.id}
                    content={m.content}
                    time={formatTime(m.createdAt) ?? ""}
                    isOwn={
                      activeLecturerId ? m.senderId !== activeLecturerId : true
                    }
                  />
                ),
              )}
            </div>
          )}
        </div>

        <MessageComposer
          value={message}
          onChange={setMessage}
          onSend={handleSend}
          disabled={!activeLecturerId || sendMessage.isPending}
          rich
          placeholder={
            activeLecturerId
              ? "Type your message..."
              : "Select a lecturer to message"
          }
        />
      </div>
    </div>
  );
}
