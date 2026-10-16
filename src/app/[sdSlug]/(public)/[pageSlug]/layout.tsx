import { StockProviders } from "@/components/public-bt/StockProviders";

// This route uses the stock ChurchApps client providers (see StockProviders).
export default function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ sdSlug: string }> }) {
  return <StockProviders params={params}>{children}</StockProviders>;
}
