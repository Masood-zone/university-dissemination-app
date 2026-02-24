import AnnouncementDetailClient from "@/components/admin/announcements/AnnouncementDetailClient";

export default function AnnouncementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <AnnouncementDetailClient id={params.id} />;
}
