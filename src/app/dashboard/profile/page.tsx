import { ProfileClient } from './client';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | LegisEye",
  description: "View and manage your profile settings.",
};

export default function ProfilePage() {
  return <ProfileClient />;
}
