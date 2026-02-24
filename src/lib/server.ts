import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type BetterAuthSession = Awaited<
  ReturnType<typeof auth.api.getSession<false>>
>;

export type RequiredBetterAuthSession = NonNullable<BetterAuthSession>;

export async function requireSession(
  request: Request,
): Promise<RequiredBetterAuthSession> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return session;
}

export async function requireAdmin(
  request: Request,
): Promise<RequiredBetterAuthSession> {
  const session = await requireSession(request);
  const role = (session?.user as unknown as { role?: Role | string } | null)
    ?.role;

  if (role !== Role.ADMIN && role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}

export async function requireStudent(
  request: Request,
): Promise<RequiredBetterAuthSession> {
  const session = await requireSession(request);
  const role = (session?.user as unknown as { role?: Role | string } | null)
    ?.role;

  if (role !== Role.STUDENT && role !== "STUDENT") {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}

export async function requireLecturer(
  request: Request,
): Promise<RequiredBetterAuthSession> {
  const session = await requireSession(request);
  const role = (session?.user as unknown as { role?: Role | string } | null)
    ?.role;

  if (role !== Role.LECTURER && role !== "LECTURER") {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}

export async function requireDepartmentAdmin(
  request: Request,
): Promise<RequiredBetterAuthSession> {
  const session = await requireSession(request);
  const role = (session?.user as unknown as { role?: Role | string } | null)
    ?.role;

  if (role !== Role.DEPARTMENT_ADMIN && role !== "DEPARTMENT_ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  return session;
}

export async function resolveDepartmentForDepartmentAdmin(
  userId: string,
): Promise<{ departmentId: string; departmentName: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      departmentId: true,
      firstName: true,
      lastName: true,
      department: { select: { name: true } },
    },
  });

  if (!user) return null;

  if (user.departmentId) {
    return {
      departmentId: user.departmentId,
      departmentName: user.department?.name ?? "Department",
    };
  }

  const headName = `${user.firstName} ${user.lastName}`.trim();
  if (!headName) return null;

  const dept = await prisma.department.findFirst({
    where: { headOfDept: headName },
    select: { id: true, name: true },
  });

  if (!dept) return null;

  prisma.user
    .update({ where: { id: userId }, data: { departmentId: dept.id } })
    .catch(() => undefined);

  return { departmentId: dept.id, departmentName: dept.name };
}
