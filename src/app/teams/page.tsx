import { TeamsClient } from './client';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Management",
  description: "Manage your teams, members, and collaborations.",
};

export default function TeamsPage() {
  return <TeamsClient />;
}
