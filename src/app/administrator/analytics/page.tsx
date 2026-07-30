import { AnnouncementAnalyticsDashboard } from "@/components/analytics/AnnouncementAnalyticsDashboard";

export default function AdministratorAnalyticsPage() {
  return (
    <AnnouncementAnalyticsDashboard
      endpoint="/administrator/analytics"
      title="Institution announcement analytics"
      description="Measure publication frequency, total opens and unique recipient reach."
    />
  );
}
