import { TeamDetailClient } from './client';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Details",
  description: "View and manage team members, roles, and permissions.",
};

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  return <TeamDetailClient teamId={params.teamId} />;
}
