import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Support Reliability Lab",
  description:
    "A multi-tenant Next.js incident lab for Vercel support scenarios.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="page">{children}</div>
        <SpeedInsights />
      </body>
    </html>
  );
}
