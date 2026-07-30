"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { ThreadRow } from "@/components/messaging/ThreadRow";
import { MessageBubble } from "@/components/messaging/MessageBubble";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import {
  BatchMessageDialog,
  type BatchRecipient,
} from "@/components/messaging/BatchMessageDialog";

import {
  useLecturerMessagingCourses,
  useLecturerMessagingStudents,
  useLecturerMessagingThreads,
  useLecturerConversation,
  useLecturerSendMessage,
} from "@/services/messaging/lecturer/messaging";

import type { LecturerMessagingCourseRow } from "@/app/api/messaging/lecturer/courses/route";
import type { LecturerMessagingStudentRow } from "@/app/api/messaging/lecturer/students/route";
import type { LecturerMessagingUserThread } from "@/app/api/messaging/lecturer/threads/route";
import type { MessagingMessageRow } from "@/app/api/messaging/lecturer/messages/route";

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

export default function LecturerMessagingPage() {
  const [offeringId, setOfferingId] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");
  const [activeStudentId, setActiveStudentId] = React.useState<string | null>(
    null,
  );
  const [message, setMessage] = React.useState("");

  const [batchSelectedIds, setBatchSelectedIds] = React.useState<string[]>([]);
  const [batchMessage, setBatchMessage] = React.useState("");

  const coursesQuery = useLecturerMessagingCourses();
  const studentsQuery = useLecturerMessagingStudents(
    offeringId === "all" ? undefined : offeringId,
  );
  const threadsQuery = useLecturerMessagingThreads({
    offeringId: offeringId === "all" ? undefined : offeringId,
    q: search,
  });

  const conversationQuery = useLecturerConversation(activeStudentId);

  const sendMessage = useLecturerSendMessage();

  const recipients: BatchRecipient[] = React.useMemo(() => {
    const students = studentsQuery.data?.rows ?? [];
    return students.map((s: LecturerMessagingStudentRow) => ({
      id: s.userId,
      name: s.name,
      regNo: s.email,
    }));
  }, [studentsQuery.data]);

  const toggleBatch = React.useCallback((id: string) => {
    setBatchSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllBatch = React.useCallback(() => {
    setBatchSelectedIds(recipients.map((r) => r.id));
  }, [recipients]);

  const clearBatch = React.useCallback(() => setBatchSelectedIds([]), []);

  const activeStudentTitle = React.useMemo(() => {
    if (!activeStudentId) return null;
    const users = threadsQuery.data?.users ?? [];
    const match = users.find(
      (u: LecturerMessagingUserThread) => u.userId === activeStudentId,
    );
    return match?.name ?? null;
  }, [activeStudentId, threadsQuery.data]);

  async function handleSendSingle() {
    if (!activeStudentId) return;
    const content = message.trim();
    if (!content) return;

    await sendMessage.mutateAsync({
      content,
      recipientIds: [activeStudentId],
      offeringId: offeringId === "all" ? undefined : offeringId,
    });

    setMessage("");
  }

  async function handleSendBatch() {
    const content = batchMessage.trim();
    if (!content || batchSelectedIds.length === 0) return;

    await sendMessage.mutateAsync({
      content,
      recipientIds: batchSelectedIds,
      offeringId: offeringId === "all" ? undefined : offeringId,
    });

    setBatchMessage("");
    setBatchSelectedIds([]);
  }

  React.useEffect(() => {
    if (!activeStudentId) return;
    const users = threadsQuery.data?.users ?? [];
    const stillExists = users.some(
      (u: LecturerMessagingUserThread) => u.userId === activeStudentId,
    );
    // Clear a selection removed by a course/filter refetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!stillExists) setActiveStudentId(null);
  }, [activeStudentId, threadsQuery.data]);

  const offerings: LecturerMessagingCourseRow[] = coursesQuery.data?.rows ?? [];
  const threadUsers: LecturerMessagingUserThread[] =
    threadsQuery.data?.users ?? [];

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-4 xl:col-span-3 border rounded-xl bg-background overflow-hidden flex flex-col">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Messages</h2>
            <BatchMessageDialog
              trigger={
                <Button type="button" variant="secondary" size="sm">
                  Batch message
                </Button>
              }
              recipients={recipients}
              selectedIds={batchSelectedIds}
              onToggle={toggleBatch}
              onSelectAll={selectAllBatch}
              onClear={clearBatch}
              message={batchMessage}
              onMessageChange={setBatchMessage}
              onSend={handleSendBatch}
              isSending={sendMessage.isPending}
              disabled={studentsQuery.isLoading || sendMessage.isPending}
            />
          </div>

          <div className="grid gap-2">
            <Select value={offeringId} onValueChange={setOfferingId}>
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assigned courses</SelectItem>
                {offerings.map((o) => (
                  <SelectItem key={o.offeringId} value={o.offeringId}>
                    {o.courseCode ? `${o.courseCode} — ` : ""}
                    {o.courseTitle ?? "Course"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
            />
          </div>
        </div>

        <div className="p-2 overflow-auto">
          {threadsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground p-2">Loading…</p>
          ) : threadUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">No threads.</p>
          ) : (
            <div className="space-y-2">
              {threadUsers.map((u) => (
                <ThreadRow
                  key={u.userId}
                  title={u.name ?? "Student"}
                  subtitle={u.lastMessage ?? null}
                  time={formatTime(u.lastMessageAt) ?? null}
                  active={activeStudentId === u.userId}
                  onClick={() => setActiveStudentId(u.userId)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-8 xl:col-span-9 border rounded-xl bg-background overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Conversation</p>
            <h3 className="text-base font-semibold truncate">
              {activeStudentTitle ?? "Select a student"}
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!activeStudentId ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a student to start chatting.
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
                      activeStudentId ? m.senderId !== activeStudentId : true
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
          onSend={handleSendSingle}
          disabled={!activeStudentId || sendMessage.isPending}
          placeholder={
            activeStudentId
              ? "Type your message..."
              : "Select a student to message"
          }
        />
      </div>
    </div>
  );
}
