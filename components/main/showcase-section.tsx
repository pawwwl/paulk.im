"use client";

import ShowcasePage from "@/app/showcase/page";

// import { VIEWS } from "../views";

export function ShowcaseSection() {
  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
          Interactive{" "}
          <span className="italic font-light text-primary">Showcase</span>
        </h2>
        <span className="h-[1px] bg-outline flex-grow mx-8 hidden md:block" />
      </div>
      <ShowcasePage />
    </section>
  );
}
