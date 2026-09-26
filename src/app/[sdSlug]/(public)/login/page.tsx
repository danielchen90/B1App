import { redirect } from "next/navigation";
import { Login } from "@/components";
import { ConfigHelper, EnvironmentHelper } from "@/helpers";
import { isBtPublicSite } from "../(bt)/isBtSite";
import { MbidError } from "@/components/public-bt/MbidError";

type Params = Promise<{ sdSlug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

// Bible Teachers sites sign in with the Mary Banks ID (Google first). This page
// sends people there, and on the way back finishes the ChurchApps session with the
// short-lived token the church API issued (?jwt=...). Other churches on the
// platform keep the stock ChurchApps login.
export default async function LoginPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  await EnvironmentHelper.initServerSide();
  const { sdSlug } = await params;
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";

  if (isBtPublicSite(sdSlug) && process.env.NEXT_PUBLIC_BT_MEMBER_SIGNIN === "1") {
    if (one(q.mbid_error)) return <MbidError reason={one(q.mbid_error)} />;
    if (!one(q.jwt)) {
      const returnUrl = one(q.returnUrl) || "/my";
      redirect("/api/auth/mbid/start?sd=" + encodeURIComponent(sdSlug) + "&returnUrl=" + encodeURIComponent(returnUrl));
    }
  }

  const config = await ConfigHelper.load(sdSlug.toString());
  return (
    <Login keyName={config.keyName} />
  );
}
