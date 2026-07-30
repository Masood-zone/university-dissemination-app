"use client";

import * as React from "react";
import type { Role } from "@prisma/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type AdminUserInput,
  type AdminUserRow,
  useAdminUsers,
  useCreateAdminUser,
  useDeactivateAdminUser,
  useUpdateAdminUser,
} from "@/services/admin/users/users";

const ROLES: Role[] = ["ADMIN", "DEPARTMENT_ADMIN", "LECTURER", "STUDENT"];
const roleLabel = (role: Role) =>
  role === "ADMIN"
    ? "Super Admin"
    : role === "DEPARTMENT_ADMIN"
      ? "Department Admin"
      : role.charAt(0) + role.slice(1).toLowerCase();

const emptyForm: AdminUserInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  role: "STUDENT",
  departmentId: "",
  studentId: "",
  batch: "",
  staffId: "",
  employeeId: "",
  qualification: "",
  specialization: "",
  office: "",
};

export default function AdministratorUsersPage() {
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState("ALL");
  const [status, setStatus] = React.useState("ALL");
  const [departmentId, setDepartmentId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminUserRow | null>(null);
  const [form, setForm] = React.useState<AdminUserInput>(emptyForm);

  const query = useAdminUsers({
    q,
    role,
    status,
    departmentId,
    page,
    pageSize: 20,
  });
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deactivateUser = useDeactivateAdminUser();
  const data = query.data;

  const showCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const showEdit = (user: AdminUserRow) => {
    setEditing(user);
    setForm({
      ...emptyForm,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      departmentId: user.department?.id ?? "",
      isActive: user.isActive,
      employeeId: user.role === "LECTURER" ? user.systemId : "",
      studentId: user.role === "STUDENT" ? user.systemId : "",
      staffId: user.role === "DEPARTMENT_ADMIN" ? user.systemId : "",
    });
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (editing) {
        await updateUser.mutateAsync({ id: editing.id, input: form });
        toast.success("User updated");
      } else {
        const created = await createUser.mutateAsync(form);
        toast.success(
          `User created. Temporary password: ${created.temporaryPassword}`,
          { duration: 12000 },
        );
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  };

  const toggleActive = async (user: AdminUserRow) => {
    try {
      if (user.isActive) {
        if (!window.confirm(`Deactivate ${user.firstName} ${user.lastName}?`)) {
          return;
        }
        await deactivateUser.mutateAsync(user.id);
        toast.success("User deactivated and sessions revoked");
      } else {
        await updateUser.mutateAsync({
          id: user.id,
          input: { isActive: true },
        });
        toast.success("User reactivated");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Request failed");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Super Admin
          </p>
          <h1 className="font-display text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage every staff and student account across the university.
          </p>
        </div>
        <Button onClick={showCreate}>Create user</Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((item) => (
          <div key={item} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{roleLabel(item)}s</p>
            <p className="mt-1 text-2xl font-semibold">
              {data?.stats[item] ?? 0}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="grid gap-3 border-b p-4 md:grid-cols-4">
          <Input
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, email or phone"
          />
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All roles</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {roleLabel(item)}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={departmentId}
            onChange={(event) => {
              setDepartmentId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {data?.departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Deactivated</option>
            <option value="UNVERIFIED">Pending verification</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Recovery</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.isPending ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Loading users…
                  </td>
                </tr>
              ) : data?.rows.length ? (
                data.rows.map((user) => (
                  <tr key={user.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">{roleLabel(user.role)}</td>
                    <td className="px-4 py-3">
                      {user.department?.name ?? "Institution-wide"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      Email {user.emailVerified ? "✓" : "pending"} · Phone{" "}
                      {user.phoneRecoveryReady ? "✓" : "unavailable"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          user.isActive
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => showEdit(user)}>
                        Edit
                      </Button>
                      <Button
                        variant={user.isActive ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => toggleActive(user)}
                      >
                        {user.isActive ? "Deactivate" : "Reactivate"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between p-4 text-sm">
          <span>{data?.total ?? 0} users</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data || page * data.pageSize >= data.total}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      <UserDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        form={form}
        setForm={setForm}
        departments={data?.departments ?? []}
        onSubmit={save}
        pending={createUser.isPending || updateUser.isPending}
      />
    </div>
  );
}

function UserDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  departments,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: AdminUserRow | null;
  form: AdminUserInput;
  setForm: React.Dispatch<React.SetStateAction<AdminUserInput>>;
  departments: Array<{ id: string; name: string }>;
  onSubmit: (event: React.FormEvent) => void;
  pending: boolean;
}) {
  const field = (
    key: keyof AdminUserInput,
    placeholder: string,
    type = "text",
  ) => (
    <Input
      type={type}
      value={String(form[key] ?? "")}
      onChange={(event) =>
        setForm((current) => ({ ...current, [key]: event.target.value }))
      }
      placeholder={placeholder}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            Role-specific fields are validated before the account is saved.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {field("firstName", "First name")}
            {field("lastName", "Last name")}
            {field("email", "Institutional email", "email")}
            {field("phone", "Phone number")}
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as Role,
                }))
              }
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {roleLabel(item)}
                </option>
              ))}
            </select>
            {form.role !== "ADMIN" ? (
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                value={form.departmentId ?? ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    departmentId: event.target.value,
                  }))
                }
              >
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            ) : null}
            {!editing
              ? field("password", "Temporary password (optional)", "password")
              : field("password", "New password (leave blank to keep)", "password")}
            {form.role === "DEPARTMENT_ADMIN" ? field("staffId", "Staff ID") : null}
            {form.role === "LECTURER" ? (
              <>
                {field("employeeId", "Employee ID")}
                {field("qualification", "Qualification")}
                {field("specialization", "Specialization")}
                {field("office", "Office")}
              </>
            ) : null}
            {form.role === "STUDENT" ? (
              <>
                {field("studentId", "Student ID")}
                {field("batch", "Batch")}
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
