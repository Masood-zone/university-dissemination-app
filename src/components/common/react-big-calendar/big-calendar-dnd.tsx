"use client";

import type { ComponentProps } from "react";

import { Calendar, type DateLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

export type BigCalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: unknown;
};

const DragAndDropCalendar = withDragAndDrop(Calendar);

export default function BigCalendarDnD({
  localizer,
  events,
  className,
  ...props
}: {
  localizer: DateLocalizer;
  events: BigCalendarEvent[];
  className?: string;
} & Omit<ComponentProps<typeof DragAndDropCalendar>, "localizer" | "events">) {
  return (
    <div className={className}>
      <DragAndDropCalendar {...props} events={events} localizer={localizer} />
    </div>
  );
}
