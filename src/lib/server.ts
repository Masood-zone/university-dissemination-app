import { Role } from "@prisma/client";

import { auth } from "@/lib/auth";

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
