import { Calendar } from "./calendar.components";

export default () => {
  return (
    <>
      {/* <!-- TopNavBar from Components_8 --> */}
      <main className="pt-24 pb-20">
        {/* <!-- Hero Section --> */}
        <section className="max-w-7xl mx-auto px-6 mb-24">
          <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter leading-none text-[#e5e2e1] mb-8">
            Showcase
          </h1>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-[#5dff3b] animate-pulse"></span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00E5FF]">
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
        </section>
      </main>
      {/* <!-- Footer from Components_8 --> */}
      <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 mt-auto border-t border-[#3b494c]/10 bg-[#0e0e0e]">
        <div className="font-mono text-[10px] opacity-60 text-[#e5e2e1]">
          Built with &lt;3 and many cups of coffee // (c) 2024
        </div>
        <div className="flex gap-8">
          <a
            className="font-mono text-[10px] text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
            href="#"
          >
            GITHUB
          </a>
          <a
            className="font-mono text-[10px] text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
            href="#"
          >
            LINKEDIN
          </a>
          <a
            className="font-mono text-[10px] text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
            href="#"
          >
            TWITTER
          </a>
          <a
            className="font-mono text-[10px] text-[#e5e2e1] hover:text-[#00E5FF] transition-colors"
            href="#"
          >
            RSS
          </a>
        </div>
      </footer>
      {/* <!-- SideNavBar (Mobile / Hidden on Web) --> */}
      <aside className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#161616]/90 backdrop-blur-md rounded-full shadow-2xl z-[100] border border-[#3b494c]/20 px-4 py-2 flex gap-4">
        <a
          className="w-10 h-10 flex items-center justify-center bg-[#00E5FF] text-[#0e0e0e] rounded-full"
          href="#"
        >
          <span
            className="material-symbols-outlined text-sm"
            data-icon="dashboard"
          >
            dashboard
          </span>
        </a>
        <a
          className="w-10 h-10 flex items-center justify-center text-[#a1a1a1]"
          href="#"
        >
          <span
            className="material-symbols-outlined text-sm"
            data-icon="rocket_launch"
          >
            rocket_launch
          </span>
        </a>
        <a
          className="w-10 h-10 flex items-center justify-center text-[#a1a1a1]"
          href="#"
        >
          <span
            className="material-symbols-outlined text-sm"
            data-icon="settings"
          >
            settings
          </span>
        </a>
      </aside>
    </>
  );
};
