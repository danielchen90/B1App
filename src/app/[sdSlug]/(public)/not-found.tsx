import type { Metadata } from "next";
import { BtNotFound } from "@/components/public-bt/BtNotFound";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return <BtNotFound />;
}
