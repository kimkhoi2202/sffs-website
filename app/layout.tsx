import type { Metadata } from "next";
import { DM_Sans, Anton, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/quiz/smooth-scroll";
import { MusicToggle } from "@/components/quiz/music-toggle";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sffs-website.vercel.app"),
  title: {
    default: "Smart Fella or Fart Smella?",
    template: "%s · Smart Fella or Fart Smella",
  },
  description:
    "A brutally honest 60-second diagnostic that scores your fella-ness and reveals whether you're a Smart Fella or a Fart Smella. Backed by vibes and questionable science.",
  openGraph: {
    type: "website",
    siteName: "Smart Fella or Fart Smella",
    title: "Smart Fella or Fart Smella?",
    description:
      "Take the 60-second Fella Test and find out whether you're a Smart Fella or a Fart Smella.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Fella or Fart Smella?",
    description:
      "Take the 60-second Fella Test and find out whether you're a Smart Fella or a Fart Smella.",
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
      className={`${dmSans.variable} ${anton.variable} ${geistMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:border-[2.5px] focus:border-ink focus:bg-yellow focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
        >
          Skip to content
        </a>
        <SmoothScroll>
          {children}
          <MusicToggle />
        </SmoothScroll>
      </body>
    </html>
  );
}
