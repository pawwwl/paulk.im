import type { Metadata } from "next";
import "../globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Showcase — Pawwwl_",
  description: "Software engineer with 10 years of experience.",
};

export default function ShowcaseLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative z-10 text-on-surface font-body selection:bg-primary selection:text-on-primary overflow-x-hidden">
      {children}
    </div>
  );
}
