import { TeamDetailClient } from './client';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Details",
  description: "View and manage team members, roles, and permissions.",
};

export default async function TeamDetailPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamDetailClient teamId={teamId} />;
}
