import { AcceptInvitationClient } from './client';
import { Metadata } from "next";
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: "Accept Team Invitation",
  description: "Join your team and start collaborating.",
};

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AcceptInvitationClient />
    </Suspense>
  );
}
