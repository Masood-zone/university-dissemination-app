"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { getApiErrorLabel } from "@/lib/api-client-error";
import { ProfilePageShell } from "@/components/common/ProfilePageShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useChangeDepartmentAdminPassword,
  useDepartmentAdminProfile,
  useUpdateDepartmentAdminProfile,
} from "@/services/department-admin/profile/profile";

export default function DepartmentAdminProfilePage() {
  const query = useDepartmentAdminProfile();
  const updateProfile = useUpdateDepartmentAdminProfile();
  const changePassword = useChangeDepartmentAdminPassword();
  const error = query.error ? getApiErrorLabel(query.error).message : null;

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const data = query.data
    ? {
        name: query.data.name,
        subtitle: `${query.data.roleLabel}${
          query.data.departmentName ? ` · ${query.data.departmentName}` : ""
        }`,
        email: query.data.email,
        phone: query.data.phone,
        departmentName: query.data.departmentName,
        avatarUrl: query.data.avatar,
        emailVerified: query.data.emailVerified,
        lastLogin: query.data.lastLogin,
        primaryMeta: [
          { label: "Staff ID", value: query.data.staffId },
          { label: "Role", value: query.data.roleLabel },
        ],
      }
    : null;

  const actions = useMemo(() => {
    const disabled = query.isPending || !query.data;
    const openEdit = () => {
      if (!query.data) return;
      setFirstName(query.data.firstName ?? "");
      setLastName(query.data.lastName ?? "");
      setPhone(query.data.phone ?? "");
      setEditOpen(true);
    };
    const openPassword = () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOpen(true);
    };
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={openEdit} disabled={disabled}>
          <MaterialSymbol icon="edit" className="text-[18px]" />
          Edit Profile
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={openPassword}
          disabled={disabled}
        >
          <MaterialSymbol icon="lock" className="text-[18px]" />
          Change Password
        </Button>
      </div>
    );
  }, [query.data, query.isPending]);

  const saveDisabled = updateProfile.isPending || query.isPending;
  const passwordDisabled = changePassword.isPending || query.isPending;

  async function handleSaveProfile() {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() ? phone.trim() : null,
      });
      toast.success("Profile updated");
      setEditOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    }
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success("Password changed");
      setPasswordOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    }
  }

  return (
    <>
      <ProfilePageShell
        title="Profile & Settings"
        loading={query.isPending}
        error={error}
        data={data}
        actions={actions}
      />

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (open && query.data) {
            setFirstName(query.data.firstName ?? "");
            setLastName(query.data.lastName ?? "");
            setPhone(query.data.phone ?? "");
          }
          setEditOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                First name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={saveDisabled}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
                Last name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={saveDisabled}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
              Phone
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +233 000 000 000"
              disabled={saveDisabled}
            />
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={saveDisabled}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={saveDisabled}
              onClick={() => void handleSaveProfile()}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={passwordOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          }
          setPasswordOpen(open);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
              Current password
            </label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={passwordDisabled}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
              New password
            </label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={passwordDisabled}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-muted-foreground">
              Confirm new password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={passwordDisabled}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={passwordDisabled}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              disabled={passwordDisabled}
              onClick={() => void handleChangePassword()}
            >
              Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
