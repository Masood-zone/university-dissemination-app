"use client";

import * as React from "react";
import { toast } from "sonner";

import { RichMarkdownEditor } from "@/components/common/RichMarkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLecturerCourses } from "@/services/lecturer/courses/courses";
import {
  useArchiveLecturerAnnouncement,
  useCreateLecturerAnnouncement,
  useLecturerAnnouncements,
  useUpdateLecturerAnnouncement,
} from "@/services/lecturer/announcements/announcements";
import type {
  CreateLecturerAnnouncementInput,
  LecturerAnnouncementRow,
} from "@/app/api/lecturer/announcements/route";

const TABS = ["ALL", "DRAFT", "SCHEDULED", "ACTIVE", "EXPIRED", "ARCHIVED"];

function localDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const EMPTY: CreateLecturerAnnouncementInput = {
  title: "",
  content: "",
  category: "ACADEMIC",
  mode: "DRAFT",
  target: "COURSES",
  courseOfferingIds: [],
  publishedAt: null,
  expiresAt: null,
};

export default function LecturerAnnouncementsPage() {
  const [tab, setTab] = React.useState("ALL");
  const [q, setQ] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] =
    React.useState<CreateLecturerAnnouncementInput>(EMPTY);
  const list = useLecturerAnnouncements({
    q,
    status: tab === "ALL" ? undefined : tab,
  });
  const courses = useLecturerCourses();
  const create = useCreateLecturerAnnouncement();
  const update = useUpdateLecturerAnnouncement();
  const archive = useArchiveLecturerAnnouncement();

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    if (
      form.target === "COURSES" &&
      !(form.courseOfferingIds?.length ?? 0)
    ) {
      toast.error("Select at least one assigned course");
      return;
    }
    if (form.mode === "SCHEDULE" && !form.publishedAt) {
      toast.error("Choose a publication date and time");
      return;
    }
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, input: form });
        toast.success("Announcement updated");
      } else {
        await create.mutateAsync(form);
        toast.success(
          form.mode === "DRAFT"
            ? "Draft saved"
            : form.mode === "SCHEDULE"
              ? "Announcement scheduled"
              : "Announcement published",
        );
      }
      setEditingId(null);
      setForm(EMPTY);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save");
    }
  };

  const edit = (row: LecturerAnnouncementRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      content: row.content,
      category: row.category,
      target: row.courseOfferingIds.length ? "COURSES" : "DEPARTMENT",
      courseOfferingIds: row.courseOfferingIds,
      mode:
        row.status === "DRAFT"
          ? "DRAFT"
          : row.publishedAt && new Date(row.publishedAt) > new Date()
            ? "SCHEDULE"
            : "PUBLISH_NOW",
      publishedAt: localDate(row.publishedAt),
      expiresAt: localDate(row.expiresAt),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleCourse = (id: string) =>
    setForm((current) => {
      const selected = current.courseOfferingIds ?? [];
      return {
        ...current,
        courseOfferingIds: selected.includes(id)
          ? selected.filter((value) => value !== id)
          : [...selected, id],
      };
    });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Lecturer Portal
        </p>
        <h1 className="font-display text-2xl font-semibold">
          Announcement management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Draft, schedule and measure updates for your department and assigned courses.
        </p>
      </header>

      <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">
            {editingId ? "Edit announcement" : "New announcement"}
          </h2>
          {editingId ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
            >
              Cancel edit
            </Button>
          ) : null}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Announcement title"
            className="md:col-span-2"
          />
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target
                  .value as CreateLecturerAnnouncementInput["category"],
              }))
            }
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            {["ACADEMIC", "DEPARTMENTAL", "EVENT", "MAINTENANCE", "OTHER"].map(
              (category) => (
                <option key={category} value={category}>
                  {category.replaceAll("_", " ")}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="rounded-xl border p-3">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.target === "COURSES"}
                onChange={() =>
                  setForm((current) => ({ ...current, target: "COURSES" }))
                }
              />
              Assigned courses
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.target === "DEPARTMENT"}
                onChange={() =>
                  setForm((current) => ({ ...current, target: "DEPARTMENT" }))
                }
              />
              All department students
            </label>
          </div>
          {form.target === "COURSES" ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {(courses.data?.rows ?? []).map((course) => (
                <label
                  key={course.offeringId}
                  className="flex items-center gap-2 rounded-lg border p-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={(form.courseOfferingIds ?? []).includes(
                      course.offeringId,
                    )}
                    onChange={() => toggleCourse(course.offeringId)}
                  />
                  {course.courseCode} — {course.courseTitle}
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <RichMarkdownEditor
          value={form.content}
          onChange={(content) =>
            setForm((current) => ({ ...current, content }))
          }
          placeholder="Explain the update clearly…"
        />

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={form.mode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                mode: event.target.value as CreateLecturerAnnouncementInput["mode"],
              }))
            }
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="DRAFT">Save draft</option>
            <option value="PUBLISH_NOW">Publish now</option>
            <option value="SCHEDULE">Schedule</option>
          </select>
          <Input
            type="datetime-local"
            value={localDate(form.publishedAt ?? null)}
            disabled={form.mode !== "SCHEDULE"}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                publishedAt: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : null,
              }))
            }
          />
          <Input
            type="datetime-local"
            value={localDate(form.expiresAt ?? null)}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                expiresAt: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : null,
              }))
            }
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? "Saving…" : "Save announcement"}
          </Button>
        </div>
      </form>

      <section className="rounded-2xl border bg-card">
        <div className="space-y-3 border-b p-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={tab === item ? "default" : "outline"}
                onClick={() => setTab(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search announcements" />
        </div>
        <div className="divide-y">
          {list.isPending ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : list.data?.rows.length ? (
            list.data.rows.map((row) => (
              <article key={row.id} className="grid gap-3 p-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{row.title}</h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{row.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>{row.recipientCount} recipients</span>
                    <span>{row.uniqueViewers} unique viewers</span>
                    <span>{row.totalViews} total opens</span>
                    <span>{row.reachRate ?? 0}% reach</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => edit(row)}>
                    Edit
                  </Button>
                  {row.status !== "ARCHIVED" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await archive.mutateAsync(row.id);
                        toast.success("Announcement archived");
                      }}
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No announcements found.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
