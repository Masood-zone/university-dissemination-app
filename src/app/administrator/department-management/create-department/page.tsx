"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  useCreateDepartment,
  useGetDepartmentHeads,
} from "@/services/admin/department-management/department";
import { cn } from "@/lib/utils";

type DepartmentFormState = {
  name: string;
  code: string;
  description: string;
  headOfDept: string;
  contact: string;
  headUserId: string | null;
};

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [form, setForm] = React.useState<DepartmentFormState>({
    name: "",
    code: "",
    description: "",
    headOfDept: "",
    contact: "",
    headUserId: null,
  });

  const { data: heads, isLoading: headsLoading } = useGetDepartmentHeads();
  const createDepartment = useCreateDepartment();

  const selectHead = (headId: string) => {
    const head = heads?.find((h) => h.id === headId);
    if (!head) return;

    const fullName = `${head.firstName} ${head.lastName}`.trim();
    const contact = (head.phone && head.phone.trim()) || head.email;

    setForm((p) => ({
      ...p,
      headOfDept: fullName,
      contact,
      headUserId: head.id,
    }));
  };

  const onSubmit = async () => {
    try {
      await createDepartment.mutateAsync({
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        headOfDept: form.headOfDept.trim() || undefined,
        contact: form.contact.trim() || undefined,
        headUserId: form.headUserId,
      });
      router.push("/administrator/department-management");
    } catch {
      // handled via createDepartment.error
    }
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-lexend text-xl font-semibold">
            Create New Department
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a department and its key details.
          </p>
        </div>

        <Button asChild variant="outline" className="gap-2">
          <Link href="/administrator/department-management">
            <MaterialSymbol icon="arrow_back" className="text-[18px]" />
            Back to Departments
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Department name</label>
              <Input
                className="mt-2"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Information Technology Education"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Department code</label>
              <Input
                className="mt-2"
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="e.g. ITE"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Contact</label>
              <Input
                className="mt-2"
                value={form.contact}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contact: e.target.value }))
                }
                placeholder="Email or phone"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-medium">
                  Head of department
                </label>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={headsLoading || !heads?.length}
                    >
                      <MaterialSymbol
                        icon="person_search"
                        className="text-[18px]"
                      />
                      Select
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    {(heads ?? []).map((h) => {
                      const fullName = `${h.firstName} ${h.lastName}`.trim();
                      return (
                        <DropdownMenuItem
                          key={h.id}
                          onSelect={() => selectHead(h.id)}
                          className="flex flex-col items-start gap-0"
                        >
                          <span className="text-sm font-medium">
                            {fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(h.phone && h.phone.trim()) || h.email}
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Input
                className="mt-2"
                value={form.headOfDept}
                onChange={(e) =>
                  setForm((p) => ({ ...p, headOfDept: e.target.value }))
                }
                placeholder={
                  headsLoading
                    ? "Loading department admins…"
                    : "Optional (name)"
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Optional department description"
                className="mt-2 w-full min-h-28 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-lexend text-base font-semibold">Actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a department and assign its head.
          </p>

          <div className="mt-5 space-y-3">
            <Button
              className="w-full gap-2"
              type="button"
              onClick={onSubmit}
              disabled={createDepartment.isPending}
            >
              <MaterialSymbol icon="save" className="text-[18px]" />
              {createDepartment.isPending ? "Creating…" : "Create Department"}
            </Button>
            <Button className="w-full" type="button" variant="outline" asChild>
              <Link href="/administrator/department-management">Cancel</Link>
            </Button>

            {createDepartment.error ? (
              <p className={cn("text-sm", "text-destructive")}>
                {(createDepartment.error as Error).message}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
