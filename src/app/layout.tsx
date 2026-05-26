import type { Metadata } from "next";
import localFont from "next/font/local";
import DynamicHead from "@/components/DynamicHead";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "./fonts/Inter-Light.woff2", weight: "200", style: "normal" },
    { path: "./fonts/Inter-Light.woff2", weight: "300", style: "normal" },
    { path: "./fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Inter-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata: Metadata = {
  title: "BATTLE OF THE GOLDS — Thomians' Media",
  description: "Official coverage of Battle of the Golds — The Golden Rivalry. Live scores, analytics, community and more.",
  icons: {
    icon: '/logos/thomians-media-round-logo.jpg',
    apple: '/logos/thomians-media-round-logo.jpg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Maintenance mode is handled by two layers:
  // 1. Middleware (src/middleware.ts) — blocks public routes with 503, passes through /admin and /api routes
  // 2. ClientLayout (src/components/ClientLayout.tsx) — client-side fallback for real-time toggle changes,
  //    skips /admin routes so admin panel is always accessible
  //
  // NOTE: We do NOT check maintenance mode here in layout.tsx because:
  // - headers() doesn't reliably return the current pathname (next-url header is often missing)
  // - This caused a bug where admin routes were blocked during maintenance
  // - The middleware + client-side approach is sufficient and more reliable

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <DynamicHead />
        {children}
      </body>
    </html>
  );
}
