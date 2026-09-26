import { EnvironmentHelper } from "@/helpers/EnvironmentHelper";
import { Roboto } from "next/font/google";
import { AskMary } from "@/components/askMary/AskMary";

const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap"
});

export const metadata = {
  title: "ChurchApps",
  description: "Open Source Software for Churches"
};

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

  return (
    <html className={roboto.className}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: "window.__API_BASE__=" + JSON.stringify(apiBase) + ";" }} />
        {children}
        <AskMary />
      </body>
    </html>
  );
}
