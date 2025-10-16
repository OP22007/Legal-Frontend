import { AcceptInvitationClient } from './client';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accept Team Invitation",
  description: "Join your team and start collaborating.",
};

export default function AcceptInvitationPage() {
  return <AcceptInvitationClient />;
}
