import { ChatWidget } from "@/components/chat-widget";
import { SKILLS } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary">
      <div className="scanline"></div>
      {/* <!-- TopNavBar component implementation --> */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0e0e0e] border-b border-[#3b494c]/20">
        <div className="font-mono font-bold text-[#00E5FF] tracking-widest text-xl uppercase">
          Pawwwl_<span className="opacity-50 text-xs">v1.0</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-mono text-xs tracking-tighter uppercase">
          <Link
            className="text-[#e5e2e1] opacity-70 hover:text-[#c3f5ff] transition-colors duration-150"
            href="/showcase"
          >
            PROJECTS
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
          HIRE_ME
        </button>
      </nav>
      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* <!-- Hero Section: Terminal Header --> */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <span className="font-mono text-xs text-primary mb-6 block uppercase tracking-[0.3em] font-bold">
                git log --author="self"
              </span>
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
                Hiking mountains on the weekends / <br />
                Red Rocks shows in the summer / <br />
              </p>
            </div>
          </div>
        </section>
        {/* <!-- Bio & Technical Stack: Asymmetric Layout --> */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-40">
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-none border border-outline overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.05)] relative z-10 group">
              <img
                alt="Portrait of a developer"
                className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all duration-700"
                src="/profile/index.png"
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
                  <img
                    alt="A stylized, minimalist vector illustration of Sozo, a black and white tuxedo cat, with very large, cute, dilated pupils, in a playful peeking pose over a dark surface."
                    className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-500 group-hover/sozo:grayscale-0 group-hover/sozo:scale-105"
                    src="sozo/index.png"
                  />
                  <div className="absolute inset-0 bg-background/20 mix-blend-multiply"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/90 text-on-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                      ID: SOZO
                    </span>
                  </div>
                </div>
                {/* <!-- Frame 2: Silver --> */}
                <div className="relative w-full h-[250px] md:h-full md:w-1/2 overflow-hidden group/silver">
                  <img
                    alt="A stylized, minimalist vector illustration of Silver, a solid dark gray cat, with very large, cute, dilated pupils. He is in a 'skittish' pose, peeking out from hiding under a minimalist, stylized tree."
                    className="absolute inset-0 w-full h-full object-cover grayscale transition-all duration-500 group-hover/silver:grayscale-0 group-hover/silver:scale-105"
                    src="silver/index.png"
                  />
                  <div className="absolute inset-0 bg-background/20 mix-blend-multiply"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-accent-pink/90 text-on-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                      ID: SILVER
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* <!-- Small Fact --> */}
            <div className="bg-surface-container border border-outline p-8 relative rounded-none flex flex-col justify-between overflow-hidden group min-h-[250px]">
              <img
                alt="New Console Illustration"
                className="absolute inset-0 w-full h-full object-cover brightness-50 group-hover:grayscale-0 group-hover:brightness-75 transition-all duration-700"
                src="/food.png"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10">
                <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono">
                  Fuel_source
                </p>
              </div>
              <div className="relative z-10">
                <h4 className="text-on-surface text-3xl font-headline font-bold uppercase leading-tight">
                  Coffee_Nuts
                </h4>
              </div>
            </div>
            <div className="relative rounded-none p-8 flex flex-col justify-between overflow-hidden group min-h-[250px]">
              <img
                alt="New Console Illustration"
                className="absolute inset-0 w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-75 transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt0XW7Ba8ajKjoM78P7OFGmA8BIBDuGGPEazs6kNzA0HkreDOhdWXEctuG0bp2tjbhzuz88EG8P82ZgFp7B6M1BII28z5QDfYLlF3dvR79OU85blkCihTErmVncfwXH4GnsxY3EfGw5FZoR7ODgpeU438Rfljz7R_BKhcHKqPKYfBxA-t_ewmOy-sIsONT2XD8dWCij3f6bMrW8O8rVGJoB8bNWObRSTHci2k98uhp6pvj4pPuoeEzltLCcrM_xxojiXZ2FqC6Mv43"
              />
              <div className="absolute inset-0 bg-black/40"></div>
              <div className="relative z-10">
                <p className="text-primary text-[10px] uppercase tracking-widest font-bold font-mono">
                  Hardware_Stack
                </p>
              </div>
              <div className="relative z-10">
                <h4 className="text-on-surface text-3xl font-headline font-bold uppercase leading-tight">
                  SWITCH 2 + <br /> HHKB
                </h4>
              </div>
            </div>
            {/* <!-- Location --> */}
            <div className="md:col-span-2 bg-surface-container border border-outline p-8 flex flex-col md:flex-row items-center gap-8 overflow-hidden relative min-h-[250px] py-12">
              <img
                alt="Snowy Rocky Mountains"
                className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
                src="/location.png"
              />
              <div className="flex-shrink-0 w-24 h-24 bg-primary/10 border border-primary/20 flex items-center justify-center relative z-10">
                <span
                  className="material-symbols-outlined text-primary text-4xl"
                  data-icon="lan"
                >
                  lan
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-on-surface-variant font-bold uppercase font-mono tracking-tight">
                  REMOTE_ORIGIN: DENVER, COLORADO
                </p>
                <h4 className="text-3xl font-headline font-black uppercase text-on-surface">
                  DENVER_MST
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
        <section className="bg-[#1a1a1a] border border-primary/20 p-20 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-8">
            <h2 className="text-5xl font-headline font-black text-on-surface uppercase">
              Initialize Connection?
            </h2>
            <div className="pt-8">
              <a
                className="inline-block bg-primary text-on-primary px-12 py-5 font-mono font-bold text-xl hover:bg-[#c3f5ff] transition-all duration-300 shadow-[0_0_30px_rgba(0,229,255,0.2)]"
                href="mailto:pawl.y.kim@gmail.com"
              >
                Email Me
              </a>
            </div>
          </div>
        </section>
      </main>
      {/* <!-- Footer component implementation --> */}
      <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto border-t border-[#3b494c]/10 bg-[#0e0e0e]">
        <div className="font-mono text-[10px] opacity-60 text-[#e5e2e1]">
          Built with <span className="text-accent-pink">&lt;3</span> and many
          cups of coffee // (c) 2026
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
  );
}
