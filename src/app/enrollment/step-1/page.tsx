"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import * as React from "react";

import { EnrollmentShell } from "@/components/enrollment/EnrollmentShell";
import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  useEnrollmentStore,
  type EnrollmentGender,
} from "@/stores/enrollmentStore";

export default function EnrollmentStep1Page() {
  const router = useRouter();
  const personal = useEnrollmentStore((s) => s.draft.personal);
  const setPersonal = useEnrollmentStore((s) => s.setPersonal);

  const dob = React.useMemo(() => {
    if (!personal.dateOfBirth) return undefined;
    const dt = new Date(personal.dateOfBirth);
    return Number.isNaN(dt.getTime()) ? undefined : dt;
  }, [personal.dateOfBirth]);

  const canContinue =
    Boolean(personal.firstName.trim()) &&
    Boolean(personal.lastName.trim()) &&
    Boolean(personal.email.trim()) &&
    Boolean(personal.phone.trim());

  return (
    <EnrollmentShell
      step={1}
      title="Step 1: Biography Data"
      subtitle="Please provide your personal information as it appears on your official documents."
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <MaterialSymbol
              icon="person"
              className="text-[18px] text-primary"
            />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Personal identification
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                First Name
              </label>
              <Input
                className="mt-2"
                value={personal.firstName}
                onChange={(e) => setPersonal({ firstName: e.target.value })}
                placeholder="Enter your first name"
                autoComplete="given-name"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Last Name (Surname)
              </label>
              <Input
                className="mt-2"
                value={personal.lastName}
                onChange={(e) => setPersonal({ lastName: e.target.value })}
                placeholder="Enter your surname"
                autoComplete="family-name"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Other Names (optional)
              </label>
              <Input
                className="mt-2"
                value={personal.otherNames}
                onChange={(e) => setPersonal({ otherNames: e.target.value })}
                placeholder="Enter other names"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Date of Birth (optional)
              </label>
              <div className="mt-2">
                <DatePicker
                  value={dob}
                  onChange={(d) =>
                    setPersonal({
                      dateOfBirth: d ? d.toISOString().slice(0, 10) : "",
                    })
                  }
                  placeholder="mm/dd/yyyy"
                  buttonClassName="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Gender (optional)
              </label>
              <Select
                value={personal.gender ? personal.gender : "__none"}
                onValueChange={(value) =>
                  setPersonal({
                    gender:
                      value === "__none" ? "" : (value as EnrollmentGender),
                  })
                }
              >
                <SelectTrigger className="mt-2 w-full" aria-label="Gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Select gender</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Nationality (optional)
              </label>
              <Input
                className="mt-2"
                value={personal.nationality}
                onChange={(e) => setPersonal({ nationality: e.target.value })}
                placeholder="e.g. Ghanaian"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center gap-2">
            <MaterialSymbol icon="call" className="text-[18px] text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Contact information
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Email Address
              </label>
              <Input
                className="mt-2"
                value={personal.email}
                onChange={(e) => setPersonal({ email: e.target.value })}
                placeholder="example@domain.com"
                type="email"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Phone Number
              </label>
              <Input
                className="mt-2"
                value={personal.phone}
                onChange={(e) => setPersonal({ phone: e.target.value })}
                placeholder="+233 xx xxx xxxx"
                autoComplete="tel"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">
                Residential Address (optional)
              </label>
              <Textarea
                className="mt-2 min-h-24"
                value={personal.address}
                onChange={(e) => setPersonal({ address: e.target.value })}
                placeholder="Street name, House Number, City/Town"
              />
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-border bg-muted/40 p-5">
          <div className="flex items-center gap-2">
            <MaterialSymbol icon="help" className="text-[18px] text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-wider">
              Need help with your application?
            </p>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your progress is saved automatically. If you run into issues,
            contact support.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => router.push("/enrollment")}
          >
            <MaterialSymbol icon="close" className="text-[18px]" />
            Cancel
          </Button>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => toast.success("Draft saved")}
            >
              <MaterialSymbol icon="save" className="text-[18px]" />
              Save Draft
            </Button>
            <Button
              type="button"
              className="gap-2"
              disabled={!canContinue}
              onClick={() => router.push("/enrollment/step-2")}
            >
              Continue to Step 2
              <MaterialSymbol icon="arrow_right_alt" className="text-[18px]" />
            </Button>
          </div>
        </div>
      </div>
    </EnrollmentShell>
  );
}
