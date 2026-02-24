import AnnouncementDetailClient from "@/components/department-admin/announcements/AnnouncementDetailClient";

export default async function DepartmentAdminAnnouncementDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <AnnouncementDetailClient id={id} />;
}
