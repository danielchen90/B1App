import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/PolicyPage";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return <PolicyPage slug="terms" />;
}
