import AnnouncementDetailClient from "@/components/admin/announcements/AnnouncementDetailClient";

export default async function AnnouncementDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <AnnouncementDetailClient id={id} />;
}
