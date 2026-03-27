import { Calendar } from "@/components/calendar";
import { ChatWidget } from "@/components/chat-widget";
import { DrawingCanvas } from "@/components/drawing-canvas";
import { LocationCard } from "@/components/location-card";
import { SKILLS, TIME_LINE } from "@/lib/data";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* <!-- Hero Section: Terminal Header --> */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <h1 className="text-6xl md:text-8xl font-headline font-black leading-[0.9] tracking-tighter text-on-surface">
                Hii, I'm Paul
              </h1>
            </div>
            <div className="lg:col-span-4 pb-4">
              <p className="text-lg text-on-surface-variant leading-relaxed font-mono">
                <span className="text-2xl font-bold inline-flex items-center gap-2"></span>
                Coding during the week{" "}
                <span className="text-accent-pink italic">{`</>`}</span> <br />
                Hiking on the weekends ⛰️ <br />
                Red Rocks in the summer 🎸 <br />
              </p>
            </div>
          </div>
        </section>
        {/* <!-- Bio & Technical Stack: Asymmetric Layout --> */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-none border border-outline overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.05)] relative z-10 group">
              <Image
                loading="eager"
                alt="Portrait of a developer"
                fill
                className="w-full h-full object-cover transition-all duration-700"
                src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/profile.png"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
            </div>
            {/* <!-- Quirky Accent --> */}
            <div className="absolute -bottom-10 right-5 w-48 h-48 bg-surface-container border border-primary/30 flex items-center justify-center p-8 z-20 -rotate-6 shadow-2xl">
              <p className="text-primary font-mono text-[10px] text-center leading-tight tracking-widest uppercase">
                Status:
                <br />
                <span className="text-accent-green font-bold">Squirrely</span>
                <br />
                <br />
                100% RAW SYNTAX (with AI)
              </p>
            </div>
          </div>
          {/* <!-- Skills --> */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            <ChatWidget />

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <span
                    key={skill.label}
                    className={`px-3 py-1 bg-surface-container border border-outline font-mono text-xs ${skill.type === "domain" ? "text-accent-pink" : skill.type === "language" ? "text-accent-green" : skill.type === "framework" ? "text-primary" : skill.type === "database" ? "text-accent-blue" : "text-accent-purple"}`}
                  >
                    {skill.label}
                  </span>
                ))}
              </div>
            </div>
            {/* <!-- Chat Interface Component --> */}
          </div>
        </section>
        <div className="mx-auto my-24 max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-8 overflow-hidden lg:mx-0 lg:max-w-none lg:grid-cols-4">
            {TIME_LINE.map((item) => (
              <div key={item.name}>
                <time
                  dateTime={item.dateTime}
                  className="flex items-center text-sm/6 font-semibold text-primary"
                >
                  <svg
                    viewBox="0 0 4 4"
                    aria-hidden="true"
                    className="mr-4 size-1 flex-none"
                  >
                    <circle r={2} cx={2} cy={2} fill="currentColor" />
                  </svg>
                  {item.date}
                  <div
                    aria-hidden="true"
                    className="absolute -ml-2 h-px w-screen -translate-x-full bg-gray-900/10 sm:-ml-4 lg:static lg:-mr-6 lg:ml-8 lg:w-auto lg:flex-auto lg:translate-x-0 dark:bg-white/15"
                  />
                </time>
                <p className="mt-4 text-lg/8 font-semibold tracking-tight text-on-surface">
                  {item.name}
                </p>
                <p className="mt-0.5 text-sm italic font-medium text-accent-pink uppercase tracking-widest">
                  {item.role}
                </p>
                <p className="mt-2 text-base/7 text-on-surface-variant font-mono">
                  {item.description}
                </p>
                {item.tools && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-3 py-1 bg-surface-container border border-outline font-mono text-xs text-primary"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* <!-- Bento Grid: Tech-centric Artifacts --> */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
              Offline{" "}
              <span className="italic font-light text-primary">
                Dependencies
              </span>
            </h2>
            <span className="h-[1px] bg-outline flex-grow mx-8 hidden md:block"></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
            {/* <!-- Hobby Card: Two distinct frames for Sozo & Silver --> */}
            <div className="md:col-span-2 md:row-span-2 flex flex-col border border-outline overflow-hidden group min-h-[500px] md:h-full">
              <div className="relative flex-grow flex flex-col md:flex-row h-full">
                {/* <!-- Frame 1: Sozo --> */}
                <div className="relative w-full h-[250px] md:h-full md:w-1/2 overflow-hidden border-b md:border-b-0 md:border-r border-outline/50 group/sozo">
                  <Image
                    fill
                    loading="eager"
                    alt="A stylized, minimalist vector illustration of Sozo, a black and white tuxedo cat, with very large, cute, dilated pupils, in a playful peeking pose over a dark surface."
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover/sozo:scale-105"
                    src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/sozoooo.png"
                  />
                  <div className="absolute inset-0 bg-background/20 mix-blend-multiply"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/90 text-on-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                      PET: SOZO
                    </span>
                  </div>
                </div>
                {/* <!-- Frame 2: Silver --> */}
                <div className="relative w-full h-[250px] md:h-full md:w-1/2 overflow-hidden group/silver">
                  <Image
                    fill
                    loading="eager"
                    alt="A stylized, minimalist vector illustration of Silver, a solid dark gray cat, with very large, cute, dilated pupils. He is in a 'skittish' pose, peeking out from hiding under a minimalist, stylized tree."
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover/silver:scale-105"
                    src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/silverrrr.png"
                  />
                  <div className="absolute inset-0 bg-background/20 mix-blend-multiply"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent-pink/90 text-on-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                      PET: SILVER
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* <!-- Drawing Canvas --> */}
            <DrawingCanvas />
            {/* <!-- Most Used Key --> */}
            <div className="relative bg-surface-container border border-outline p-8 flex flex-col justify-between overflow-hidden group">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(0,229,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative z-10">
                <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono">
                  MOST_USED_KEY
                </p>
                <h4 className="text-on-surface text-4xl font-headline font-bold uppercase mt-4 leading-none">
                  ⌘Z
                </h4>
                <p className="text-on-surface-variant font-mono text-xs mt-2 leading-relaxed">
                  always undoing something
                </p>
              </div>
              <div className="relative z-10 mt-4 flex gap-2 flex-wrap">
                <span className="px-2 py-1 bg-accent-pink/20 text-accent-pink font-mono text-[10px] border border-accent-pink/30 uppercase">
                  hourly
                </span>
                <span className="px-2 py-1 bg-primary/20 text-primary font-mono text-[10px] border border-primary/30 uppercase">
                  no regrets
                </span>
              </div>
            </div>
            {/* <!-- Location --> */}
            <LocationCard />
          </div>
        </section>
        <section>
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
                My{" "}
                <span className="italic font-light text-primary">Calendar</span>
              </h2>
              <span className="h-[1px] bg-outline flex-grow mx-8 hidden md:block"></span>
            </div>
            <div className="max-w-4xl">
              <Calendar />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
