import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pawwwl_",
  description: "Software engineer with 10 years of experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <div className="bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary">
          <div className="scanline pointer-events-none"></div>

          <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0e0e0e] border-b border-[#3b494c]/20">
            <Link href="/">
              <div className="font-mono font-bold text-[#00E5FF] tracking-widest text-xl uppercase">
                Pawwwl_<span className="opacity-50 text-xs">v1.0</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-8 font-mono text-xs tracking-tighter uppercase">
              <Link
                className="text-[#e5e2e1] opacity-70 hover:text-[#c3f5ff] transition-colors duration-150"
                href="/showcase"
              >
                Showcase
              </Link>

              <Link
                className="text-[#e5e2e1] opacity-70 hover:text-[#c3f5ff] transition-colors duration-150"
                href="#"
              >
                STACK
              </Link>
              <a
                className="text-[#e5e2e1] opacity-70 hover:text-[#c3f5ff] transition-colors duration-150"
                href="#"
              >
                EXPERIENCE
              </a>
              <a
                className="text-[#00E5FF] border-b-2 border-[#00E5FF] pb-1 cursor-blink"
                href="#"
              >
                LOGS
              </a>
            </div>
            <button className="bg-primary text-on-primary px-6 py-2 font-mono text-xs font-bold uppercase hover:bg-[#c3f5ff] transition-all duration-150 active:scale-95">
              <Link href="/showcase">SHOW_CASE</Link>
            </button>
          </nav>
          {children}
          <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto border-t border-[#3b494c]/10 bg-[#0e0e0e]">
            <div className="font-mono text-[10px] opacity-60 text-[#e5e2e1]">
              Built with <span className="text-accent-pink">&lt;3</span> and
              many cups of coffee // (c) 2026
            </div>
            <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest">
              <a
                className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
                href="#"
              >
                GITHUB
              </a>
              <a
                className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
                href="#"
              >
                LINKEDIN
              </a>
              <a
                className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
                href="#"
              >
                TWITTER
              </a>
              <a
                className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
                href="#"
              >
                RSS
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
