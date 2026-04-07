import type { Metadata } from "next";
import "../globals.css";
import Link from "next/link";
import { CommandPalette } from "@/components/command-palette";
import { SearchTriggerButton } from "@/components/search-trigger-button";
import { DotPattern } from "@/components/dot-pattern";

export const metadata: Metadata = {
  title: "Pawwwl_",
  description: "Software engineer with 10 years of experience.",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative z-10 text-on-surface font-body selection:bg-primary selection:text-on-primary overflow-x-hidden">
      <DotPattern className="bg-background!" glowColor="#00e5ff" />
      <CommandPalette />
      <div className="scanline pointer-events-none"></div>

      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-12 bg-[#0e0e0e] border-b border-[#3b494c]/20">
        <Link href="/">
          <div className="font-mono font-bold text-[#00E5FF] tracking-widest text-xs uppercase">
            Pawwwl_
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <SearchTriggerButton />
          <Link href="/showcase">
            <button className="bg-primary text-on-primary px-6 py-2 font-mono text-xs font-bold uppercase hover:bg-[#c3f5ff] transition-all duration-150 active:scale-95">
              SHOW_CASE
            </button>
          </Link>
        </div>
      </nav>
      {children}
      <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto border-t border-[#3b494c]/10 bg-[#0e0e0e]">
        <div className="font-mono text-[10px] opacity-60 text-[#e5e2e1]">
          Built with <span className="text-accent-pink">&lt;3</span> and
          many cups of coffee // (c) 2026
        </div>
        <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest">
          <a className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors" href="#">GITHUB</a>
          <a className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors" href="#">LINKEDIN</a>
          <a className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors" href="#">TWITTER</a>
          <a className="text-[#e5e2e1] hover:text-[#00E5FF] transition-colors" href="#">RSS</a>
        </div>
      </footer>
    </div>
  );
}
