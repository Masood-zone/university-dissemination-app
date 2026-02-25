import { useCallback } from "react";
import { useRouter } from "next/navigation";

type Role =
  | "ADMIN"
  | "DEPARTMENT_ADMIN"
  | "LECTURER"
  | "STUDENT"
  | (string & {});

export function useRouteToDashboard() {
  const router = useRouter();

  const routeToDashboard = useCallback(
    (role: Role) => {
      switch (role) {
        case "ADMIN":
          return router.replace("/administrator");
        case "DEPARTMENT_ADMIN":
          return router.replace("/department-admin");
        case "LECTURER":
          return router.replace("/lecturer");
        case "STUDENT":
          return router.replace("/student/dashboard");
        default:
          return router.replace("/dashboard");
      }
    },
    [router],
  );

  return routeToDashboard;
}
