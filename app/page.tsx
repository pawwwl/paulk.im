import { ChatWidget } from "@/components/chat-widget";
import { Icon_Location } from "@/components/icons";
import { SKILLS } from "@/lib/data";
import Image from "next/image";
import { Calendar } from "./showcase/calendar.components";

export default function Home() {
  return (
    <>
      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* <!-- Hero Section: Terminal Header --> */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <h1 className="text-6xl md:text-8xl font-headline font-black leading-[0.9] tracking-tighter text-on-surface uppercase">
                Software <br />
                <span className="text-accent-pink italic">{`</>`}</span>
                <br />
                Engineer
              </h1>
            </div>
            <div className="lg:col-span-4 pb-4">
              <p className="text-lg text-on-surface-variant leading-relaxed font-mono">
                <span className="text-2xl font-bold">Hey there! I'm Paul </span>{" "}
                <br />
                Keyboarding during the week / <br />
                Hiking on the weekends / <br />
                Red Rocks in the summer / <br />
              </p>
            </div>
          </div>
        </section>
        {/* <!-- Bio & Technical Stack: Asymmetric Layout --> */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-40">
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
            <ChatWidget />
          </div>
        </section>
        {/* <!-- Bento Grid: Tech-centric Artifacts --> */}
        <section className="mb-40">
          <div className="flex items-center justify-between mb-16">
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
            {/* <!-- Small Fact --> */}
            <div className="bg-surface-container border border-outline p-8 relative rounded-none flex flex-col justify-between overflow-hidden group min-h-[250px]">
              <Image
                fill
                loading="eager"
                alt="New Console Illustration"
                className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:brightness-75 transition-all duration-700"
                src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/seafood.png"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10">
                <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono">
                  Fuel_source
                </p>
              </div>
              <div className="relative z-10">
                <h4 className="text-on-surface text-3xl font-headline font-bold uppercase leading-tight">
                  Seafood
                </h4>
              </div>
            </div>
            {/* <!-- Favorite Pokemon --> */}
            <div className="relative bg-surface-container border border-outline p-8 flex flex-col justify-between overflow-hidden group">
              <img
                alt="A minimalist, stylized vector illustration of Shuckle #213, a yellow turtle-like Pokemon with a red shell and multiple holes, in a clean Terminal Noir style."
                className="absolute inset-0 w-full h-full object-cover opacity-20 transition-all duration-500"
                src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/shuckle.png"
              />
              <div className="relative z-10">
                <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono">
                  FAVORITE_POKEMON
                </p>
                <h4 className="text-on-surface text-3xl font-headline font-bold uppercase mt-4">
                  SHUCKLE <br />
                  <small className="text-lg">#213</small>
                </h4>
              </div>
              <div className="relative z-10 mt-4">
                <span className="px-2 py-1 bg-accent-green/20 text-accent-green font-mono text-[10px] border border-accent-green/30 uppercase">
                  Berry Juice
                </span>
              </div>
            </div>
            {/* <!-- Location --> */}
            <div className="md:col-span-2 bg-surface-container border border-outline p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative min-h-[250px] py-12">
              <Image
                fill
                alt="Snowy Rocky Mountains"
                loading="eager"
                className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
                src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/location.png"
              />
              <div className="flex-shrink-0 w-24 h-24 bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10 text-primary">
                <Icon_Location />
              </div>
              <div className="relative z-10">
                <p className="text-[12px] text-primary font-bold uppercase font-mono tracking-tight">
                  TIME_ZONE: MST
                </p>
                <h4 className="text-3xl font-headline font-black uppercase text-on-surface">
                  DENVER_CO
                </h4>
              </div>
              <div className="absolute -right-10 opacity-5">
                <span
                  className="material-symbols-outlined text-[200px]"
                  data-icon="public"
                >
                  mile
                </span>
              </div>
            </div>
          </div>
        </section>
        {/* <!-- Minimalist Contact CTA --> */}
        <div className="flex items-center justify-between mb-16">
          <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
            Show <span className="italic font-light text-primary">case</span>
          </h2>
          <span className="h-[1px] bg-outline flex-grow mx-8 hidden md:block"></span>
        </div>
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="w-2 h-2 bg-[#5dff3b] animate-pulse"></span>
            <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-[#00E5FF]">
              System.initialize("Calendar")
            </span>
          </div>
          {/* <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter leading-none text-[#e5e2e1] mb-8">
                      Building{" "}
                      <span className="italic text-[#00E5FF]">Hyper-Scale</span> Digital
                      Architectures.
                    </h1>
                    <p className="text-sm font-mono text-[#a1a1a1] max-w-xl leading-relaxed">
                      A collection of high-performance interfaces, low-latency
                      experiments, and curated software artifacts for the next-gen web.
                    </p> */}
          <Calendar />
        </div>
      </main>
    </>
  );
}
