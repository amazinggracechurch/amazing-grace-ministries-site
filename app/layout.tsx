import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-nunito",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://amazinggracemn.org";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Amazing Grace Ministries MN — A Church in Saint Paul, Minnesota",
    template: "%s | Amazing Grace Ministries MN",
  },
  description:
    "Amazing Grace Ministries is a Christ-centered church in Saint Paul, Minnesota. Join us Sundays at 09:00 AM — 715 Edgerton Street, Saint Paul, MN 55130.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Amazing Grace Ministries MN",
    title: "Amazing Grace Ministries MN — A Church in Saint Paul, Minnesota",
    description:
      "A Christ-centered church in Saint Paul, Minnesota. Sundays at 09:00 AM — 715 Edgerton Street, Saint Paul, MN 55130.",
    images: [{ url: "/images/hero-worship.jpg", width: 1200, height: 630, alt: "Amazing Grace Ministries MN" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amazing Grace Ministries MN",
    description:
      "A Christ-centered church in Saint Paul, Minnesota. Sundays at 09:00 AM.",
    images: ["/images/hero-worship.jpg"],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" },
  ],
};

// Anti-flash: apply the resolved theme before first paint.
// Must stay in sync with ThemeProvider (default: system).
const themeScript = `
(function () {
  try {
    var s = localStorage.getItem('agm-theme');
    var dark = s === 'dark' || (s !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${cormorant.variable} ${nunito.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
