import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Roboto } from "next/font/google";
import { AskMary } from "@/components/askMary/AskMary";
import { memberSignInEnabled } from "@/lib/memberSignIn";
import type { Metadata } from "next";
import { isBtPublicSite } from "@/app/[sdSlug]/(public)/(bt)/isBtSite";
import { requestSiteSlug } from "@/components/public-bt/requestSite";
import { btSiteUrl, BT_ICONS } from "@/components/public-bt/btSeo";
import { BT, BT_COPY } from "@/components/public-bt/btSiteContent";
import { BtAnalytics } from "@/components/public-bt/BtAnalytics";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap"
});

export async function generateMetadata(): Promise<Metadata> {
  // The Bible Teachers public site gets its own name, icons and title template on every
  // route (policy pages, sign-in, the 404); other churches keep the stock defaults.
  if (isBtPublicSite(await requestSiteSlug())) {
    return {
      metadataBase: new URL(btSiteUrl()),
      title: { default: BT.name, template: "%s | " + BT.name },
      description: BT_COPY.heroSub,
      icons: BT_ICONS
    };
  }
  return {
    title: "ChurchApps",
    description: "Open Source Software for Churches"
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await EnvironmentHelper.initServerSide();
  // The browser bundle can't read NEXT_PUBLIC_API_BASE from inside the ChurchApps helper
  // packages (they read process.env at runtime, which the browser doesn't have), so every
  // client-side call fell back to ChurchApps' staging server. Hand the browser the API
  // base the server resolved at runtime; EnvironmentHelper.init applies it before any
  // client call is configured.
  const apiBase = EnvironmentHelper.Common.MembershipApi.replace(/\/membership\/?$/, "");
  // Mary Banks analytics on every Bible Teachers route (policy pages, sign-in and the 404 too).
  const isBt = isBtPublicSite(await requestSiteSlug());

  return (
    <html lang="en" className={roboto.className}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "window.__API_BASE__=" + JSON.stringify(apiBase) + ";window.__BT_SIGNIN__=" + JSON.stringify(memberSignInEnabled()) + ";" }} />
        {children}
        <AskMary />
        {isBt && <BtAnalytics />}
      </body>
    </html>
  );
}
