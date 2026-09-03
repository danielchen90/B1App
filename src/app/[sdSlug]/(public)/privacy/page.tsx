import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/PolicyPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <PolicyPage slug="privacy" />;
}
