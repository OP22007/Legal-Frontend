import { DashboardClient } from './client';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View and manage your documents.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
