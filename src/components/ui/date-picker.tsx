"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  buttonClassName,
  disabled,
}: {
  value?: Date;
  onChange?: (date?: Date) => void;
  placeholder?: string;
  buttonClassName?: string;
  disabled?: boolean;
}) {
  const [uncontrolledDate, setUncontrolledDate] = React.useState<Date>();
  const date = value ?? uncontrolledDate;

  const setDate = (next?: Date) => {
    if (onChange) {
      onChange(next);
      return;
    }

    setUncontrolledDate(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className={cn(
            "data-[empty=true]:text-muted-foreground w-70 justify-start text-left font-normal",
            buttonClassName,
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverContent>
    </Popover>
  );
}
