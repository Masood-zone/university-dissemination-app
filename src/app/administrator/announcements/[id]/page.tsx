import AnnouncementDetailClient from "@/components/admin/announcements/AnnouncementDetailClient";

export default async function AnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnnouncementDetailClient id={id} />;
}
