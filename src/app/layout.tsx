import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Portfolio Tracker",
  description: "Suivez vos actifs financiers",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" style={{ overscrollBehavior: "none" }}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var lastY = 0;
            document.addEventListener('touchstart', function(e) {
              lastY = e.touches[0].clientY;
            }, { passive: true });
            document.addEventListener('touchmove', function(e) {
              var y = e.touches[0].clientY;
              var el = e.target;
              var scrollable = false;
              while (el && el !== document.body) {
                if (el.scrollTop > 0 || (el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY !== 'hidden')) {
                  scrollable = true;
                  break;
                }
                el = el.parentElement;
              }
              if (!scrollable && y > lastY) {
                e.preventDefault();
              }
              lastY = y;
            }, { passive: false });
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ overscrollBehavior: "none" }}
      >
        {children}
      </body>
    </html>
  );
}
