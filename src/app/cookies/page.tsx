import type { Metadata } from "next";
import { PolicyPage } from "@/components/policies/PolicyPage";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return <PolicyPage slug="cookies" />;
}
