"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDepartmentAdminCreateStaffUser,
  useDepartmentAdminStaffUserDetail,
  useDepartmentAdminUpdateStaffUser,
} from "@/services/department-admin/staff-management/staff-management";
import type {
  DepartmentAdminCreateStaffUserInput,
  DepartmentAdminStaffUserDetail,
  DepartmentAdminUpdateStaffUserInput,
} from "@/types";

type Mode = { type: "create" } | { type: "edit"; userId: string };

const defaultCreateState: DepartmentAdminCreateStaffUserInput = {
  role: "LECTURER",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  employeeId: "",
  qualification: "",
  specialization: "",
  office: "",
  studentId: "",
  batch: "",
};

function buildUpdateState(
  data: DepartmentAdminStaffUserDetail,
): DepartmentAdminUpdateStaffUserInput {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    isActive: data.isActive,
    employeeId: data.lecturerProfile?.employeeId,
    qualification: data.lecturerProfile?.qualification,
    specialization: data.lecturerProfile?.specialization,
    office: data.lecturerProfile?.office,
    studentId: data.studentProfile?.studentId,
    batch: data.studentProfile?.batch,
    password: "",
  };
}

function EditStaffUserForm({
  userId,
  data,
  disabled,
  onClose,
  onDeactivate,
  onUpdate,
}: {
  userId: string;
  data: DepartmentAdminStaffUserDetail;
  disabled: boolean;
  onClose: () => void;
  onDeactivate: () => void;
  onUpdate: (input: DepartmentAdminUpdateStaffUserInput) => Promise<void>;
}) {
  const role = data.role === "STUDENT" ? "STUDENT" : "LECTURER";
  const [updateState, setUpdateState] =
    useState<DepartmentAdminUpdateStaffUserInput>(() => buildUpdateState(data));

  async function handleUpdate() {
    const payload: DepartmentAdminUpdateStaffUserInput = {
      ...updateState,
      firstName: updateState.firstName?.trim(),
      lastName: updateState.lastName?.trim(),
      phone:
        updateState.phone === undefined
          ? undefined
          : updateState.phone?.trim() || null,
      employeeId: updateState.employeeId?.trim(),
      qualification: updateState.qualification?.trim(),
      specialization: updateState.specialization?.trim(),
      office:
        updateState.office === undefined
          ? undefined
          : updateState.office?.trim() || null,
      studentId: updateState.studentId?.trim(),
      batch: updateState.batch?.trim(),
      password: updateState.password?.trim() || undefined,
    };

    await onUpdate(payload);
  }

  return (
    <>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Role
            </label>
            <Input
              value={role === "LECTURER" ? "Lecturer" : "Student"}
              disabled
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Email
            </label>
            <Input value={data.email ?? ""} disabled />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              First Name
            </label>
            <Input
              value={updateState.firstName ?? ""}
              onChange={(e) =>
                setUpdateState((s) => ({ ...s, firstName: e.target.value }))
              }
              disabled={disabled}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Last Name
            </label>
            <Input
              value={updateState.lastName ?? ""}
              onChange={(e) =>
                setUpdateState((s) => ({ ...s, lastName: e.target.value }))
              }
              disabled={disabled}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Phone
            </label>
            <Input
              value={updateState.phone ?? ""}
              onChange={(e) =>
                setUpdateState((s) => ({ ...s, phone: e.target.value }))
              }
              disabled={disabled}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              New Password (optional)
            </label>
            <Input
              type="password"
              value={updateState.password ?? ""}
              onChange={(e) =>
                setUpdateState((s) => ({ ...s, password: e.target.value }))
              }
              disabled={disabled}
            />
          </div>
        </div>

        {role === "LECTURER" ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lecturer Profile
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Employee ID (auto-generated if empty)
                </label>
                <Input
                  value={updateState.employeeId ?? ""}
                  placeholder="Leave blank to auto-generate"
                  onChange={(e) =>
                    setUpdateState((s) => ({
                      ...s,
                      employeeId: e.target.value,
                    }))
                  }
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Office (optional)
                </label>
                <Input
                  value={updateState.office ?? ""}
                  onChange={(e) =>
                    setUpdateState((s) => ({ ...s, office: e.target.value }))
                  }
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Qualification
                </label>
                <Input
                  value={updateState.qualification ?? ""}
                  onChange={(e) =>
                    setUpdateState((s) => ({
                      ...s,
                      qualification: e.target.value,
                    }))
                  }
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Specialization
                </label>
                <Input
                  value={updateState.specialization ?? ""}
                  onChange={(e) =>
                    setUpdateState((s) => ({
                      ...s,
                      specialization: e.target.value,
                    }))
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student Profile
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Student ID (optional)
                </label>
                <Input
                  value={updateState.studentId ?? ""}
                  onChange={(e) =>
                    setUpdateState((s) => ({ ...s, studentId: e.target.value }))
                  }
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Batch / Level (optional)
                </label>
                <Input
                  value={updateState.batch ?? ""}
                  onChange={(e) =>
                    setUpdateState((s) => ({ ...s, batch: e.target.value }))
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <DialogClose asChild>
          <Button type="button" variant="secondary" disabled={disabled}>
            Close
          </Button>
        </DialogClose>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            disabled={disabled || data.isActive === false}
            onClick={onDeactivate}
          >
            Deactivate User
          </Button>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => void handleUpdate()}
          >
            Update User
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export function StaffUserModal({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
}) {
  const isEdit = mode.type === "edit";
  const selectedId = isEdit ? mode.userId : null;

  const detailQuery = useDepartmentAdminStaffUserDetail(
    selectedId,
    open && isEdit,
  );
  const createMutation = useDepartmentAdminCreateStaffUser();
  const updateMutation = useDepartmentAdminUpdateStaffUser();

  const [createState, setCreateState] = useState(defaultCreateState);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setCreateState(defaultCreateState);
    }
    onOpenChange(nextOpen);
  }

  const disabled = createMutation.isPending || updateMutation.isPending;

  async function onCreate() {
    try {
      const payload = {
        ...createState,
        email: createState.email.trim().toLowerCase(),
        firstName: createState.firstName.trim(),
        lastName: createState.lastName.trim(),
        phone: createState.phone?.trim() || undefined,
        password: createState.password,
        employeeId: createState.employeeId?.trim() || undefined,
        qualification: createState.qualification?.trim() || undefined,
        specialization: createState.specialization?.trim() || undefined,
        office: createState.office?.trim() || undefined,
        studentId: createState.studentId?.trim() || undefined,
        batch: createState.batch?.trim() || undefined,
      } satisfies DepartmentAdminCreateStaffUserInput;

      await createMutation.mutateAsync(payload);
      toast.success("User added");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create user");
    }
  }

  async function onDeactivate() {
    if (!selectedId) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedId,
        input: { isActive: false },
      });
      toast.success("User deactivated");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to deactivate user");
    }
  }

  const title = isEdit ? "Update User" : "Add User";

  const role = isEdit
    ? detailQuery.data?.role === "STUDENT"
      ? "STUDENT"
      : "LECTURER"
    : createState.role;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isEdit && detailQuery.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isEdit && detailQuery.isError ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm">
            Failed to load user.
          </div>
        ) : isEdit && selectedId && detailQuery.data ? (
          <EditStaffUserForm
            key={selectedId}
            userId={selectedId}
            data={detailQuery.data}
            disabled={disabled}
            onClose={() => handleOpenChange(false)}
            onDeactivate={() => void onDeactivate()}
            onUpdate={async (input) => {
              try {
                await updateMutation.mutateAsync({ id: selectedId, input });
                toast.success("User updated");
                handleOpenChange(false);
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : "Failed to update user",
                );
              }
            }}
          />
        ) : (
          <>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Role
                  </label>
                  <Select
                    value={createState.role}
                    onChange={(e) =>
                      setCreateState((s) => ({
                        ...s,
                        role: e.target.value as "LECTURER" | "STUDENT",
                      }))
                    }
                    disabled={disabled}
                  >
                    <option value="LECTURER">Lecturer</option>
                    <option value="STUDENT">Student</option>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Email
                  </label>
                  <Input
                    value={createState.email}
                    onChange={(e) =>
                      setCreateState((s) => ({ ...s, email: e.target.value }))
                    }
                    placeholder="user@aamusted.edu.gh"
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    First Name
                  </label>
                  <Input
                    value={createState.firstName}
                    onChange={(e) =>
                      setCreateState((s) => ({
                        ...s,
                        firstName: e.target.value,
                      }))
                    }
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Last Name
                  </label>
                  <Input
                    value={createState.lastName}
                    onChange={(e) =>
                      setCreateState((s) => ({
                        ...s,
                        lastName: e.target.value,
                      }))
                    }
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Phone
                  </label>
                  <Input
                    value={createState.phone ?? ""}
                    onChange={(e) =>
                      setCreateState((s) => ({
                        ...s,
                        phone: e.target.value,
                      }))
                    }
                    disabled={disabled}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={createState.password}
                    onChange={(e) =>
                      setCreateState((s) => ({
                        ...s,
                        password: e.target.value,
                      }))
                    }
                    disabled={disabled}
                  />
                </div>
              </div>

              {role === "LECTURER" ? (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Lecturer Profile
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Employee ID (auto-generated if empty)
                      </label>
                      <Input
                        value={createState.employeeId ?? ""}
                        placeholder="Leave blank to auto-generate"
                        onChange={(e) =>
                          setCreateState((s) => ({
                            ...s,
                            employeeId: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Office (optional)
                      </label>
                      <Input
                        value={createState.office ?? ""}
                        onChange={(e) =>
                          setCreateState((s) => ({
                            ...s,
                            office: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Qualification
                      </label>
                      <Input
                        value={createState.qualification ?? ""}
                        onChange={(e) =>
                          setCreateState((s) => ({
                            ...s,
                            qualification: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Specialization
                      </label>
                      <Input
                        value={createState.specialization ?? ""}
                        onChange={(e) =>
                          setCreateState((s) => ({
                            ...s,
                            specialization: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Student Profile
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Student ID (optional)
                      </label>
                      <Input
                        value={createState.studentId ?? ""}
                        onChange={(e) =>
                          setCreateState((s) => ({
                            ...s,
                            studentId: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground">
                        Batch / Level (optional)
                      </label>
                      <Input
                        value={createState.batch ?? ""}
                        onChange={(e) =>
                          setCreateState((s) => ({
                            ...s,
                            batch: e.target.value,
                          }))
                        }
                        disabled={disabled}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={disabled}>
                  Close
                </Button>
              </DialogClose>

              <Button
                type="button"
                disabled={disabled}
                onClick={() => void onCreate()}
              >
                Add User
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
