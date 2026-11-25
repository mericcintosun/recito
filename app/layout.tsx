import type { Metadata } from "next";
import { Nunito_Sans, Sora } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], display: "swap", variable: "--font-sora" });
const nunitoSans = Nunito_Sans({ subsets: ["latin"], display: "swap", variable: "--font-nunito-sans" });

export const metadata: Metadata = {
  metadataBase: new URL("https://recito.vercel.app"),
  title: {
    default: "Recito: one-minute reading fluency checks in the browser",
    template: "%s | Recito",
  },
  description:
    "A teacher pastes a passage and a child reads it aloud. Recito marks every miscue, computes words correct per minute, and lets you replay each mark. The audio never leaves the browser.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${nunitoSans.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          Skip to the main content
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1} className="focus:outline-none">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
            <p>Recito is a screening aid for teachers, not a diagnostic test.</p>
            <p>Speech recognition runs in this browser. No audio is uploaded.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
