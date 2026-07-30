import { AnnouncementAnalyticsDashboard } from "@/components/analytics/AnnouncementAnalyticsDashboard";

export default function DepartmentAdminAnalyticsPage() {
  return (
    <AnnouncementAnalyticsDashboard
      endpoint="/department-admin/analytics"
      title="Department announcement analytics"
      description="Understand how frequently your department communicates and how students respond."
    />
  );
}
