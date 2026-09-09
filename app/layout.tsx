import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import { ThemeProvider } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PageViewTracker } from "@/components/PageViewTracker";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-verifio-display",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-verifio-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-verifio-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Verifio | OTP & Phone Verification Platform",
  description:
    "Verifio is a complete OTP verification platform supporting SMS verification, residential proxies, and rental phone numbers for all major services.",
  keywords: ["OTP", "verification", "SMS", "residential proxies", "rental numbers", "phone verification"],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Verifio | OTP & Phone Verification Platform",
    description:
      "SMS verification, residential proxies, and rental phone numbers for Google, WhatsApp, Telegram, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('verifio-theme');
                  if (theme === 'light' || theme === 'dark') {
                    document.documentElement.classList.add(theme);
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ClerkProvider>
          <NextTopLoader
          color="#6366f1"
          initialPosition={0.08}
          crawlSpeed={120}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="cubic-bezier(0.4, 0, 0.2, 1)"
          speed={400}
          shadow="0 0 10px #6366f1,0 0 5px #6366f1"
          />
          <ThemeProvider>
          <PageViewTracker />
          <div className="body-wrapper">
          <Navbar />
          <main className="main-content">{children}</main>
          <Footer />
          </div>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
