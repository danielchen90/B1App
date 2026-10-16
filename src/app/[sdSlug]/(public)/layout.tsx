import "react-activity/dist/Dots.css";
import "@/styles/vendor/pages.css";
import "@/styles/member.css";
import "@/styles/streaming.css";
import "@/styles/buttons.css";
import "@/styles/sidebar.css";
import "@/styles/master-detail.css";
import BtClientLayout from "@/components/public-bt/BtClientLayout";
import { PwaRegister } from "../mobile/PwaRegister";
import { loadChurchAppearance } from "../mobile/loadChurchAppearance";
import { isBtPublicSite, btDisplayName } from "./(bt)/isBtSite";

type LayoutParams = Promise<{ sdSlug: string }>;

export const viewport = { themeColor: "#ffffff" };

export default async function PublicLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: LayoutParams;
}) {
  const { sdSlug } = await params;
  const { churchName } = await loadChurchAppearance(sdSlug);

  // Bible Teachers ships its own mark; other churches get the generated app icon.
  const isBt = isBtPublicSite(sdSlug);
  const appTitle = ((isBt ? btDisplayName(churchName) : churchName) || "").trim() || sdSlug || "Church";
  const iconUrl = isBt ? "/bt/icon-192.png" : "/mobile/icon/192";
  const iconUrl512 = isBt ? "/bt/icon-512.png" : "/mobile/icon/512";

  return (
    <>
      <link rel="manifest" href={`/manifest.webmanifest?church=${encodeURIComponent(sdSlug)}`} />
      {!isBt && <link rel="apple-touch-icon" href={iconUrl} />}
      <link rel="apple-touch-icon" sizes="192x192" href={iconUrl} />
      <link rel="apple-touch-icon" sizes="512x512" href={iconUrl512} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={appTitle} />
      <link rel="preconnect" href="https://content.churchapps.org" />
      <link rel="preconnect" href="https://content.lessons.church" />
      {/* The stock screens' icon font; the Bible Teachers pages draw their own SVG icons (StockProviders adds it where needed). */}
      {!isBt && <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />}
      <PwaRegister />
      {/* No stock ChurchApps providers here (MUI theme, user/locale/error context): the routes
          that use them add <StockProviders> in their own layout, and the stock home wraps itself,
          so their bundles stay off the Bible Teachers pages. */}
      <BtClientLayout>{children}</BtClientLayout>
    </>
  );
}
