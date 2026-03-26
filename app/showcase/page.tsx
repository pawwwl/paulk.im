import { ThreeSceneLoader } from "./three-loader";
import { CyberpunkTerminalLoader } from "./cyberpunk-terminal-loader";
import { CalvinHobbesLoader } from "./calvin-hobbes-loader";
import { LazySection } from "@/components/lazy-section";

export default () => {
  return (
    <>
      {/* <!-- TopNavBar from Components_8 --> */}
      <main className="pt-24 pb-20">
        {/* <!-- Hero Section --> */}
        <section className="max-w-7xl mx-auto px-6 mb-24 flex flex-col gap-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
              Show <span className="italic font-light text-primary">case</span>
            </h2>
            <span className="h-[1px] bg-outline flex-grow mx-8 hidden md:block"></span>
          </div>

          <LazySection>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-[#5dff3b] animate-pulse"></span>
                <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                  system.run("helix_in_space")
                </span>
              </div>

              <ThreeSceneLoader />
            </div>
          </LazySection>

          <LazySection>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-[#5dff3b] animate-pulse"></span>
                <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                  system.run("cyberpunk_terminal")
                </span>
              </div>

              <CyberpunkTerminalLoader />
            </div>
          </LazySection>

          <LazySection>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-[#5dff3b] animate-pulse"></span>
                <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-primary">
                  system.run('calvin_and_hobbes')
                </span>
              </div>

              <CalvinHobbesLoader />
            </div>
          </LazySection>
        </section>
      </main>
      {/* <!-- Footer from Components_8 --> */}
    </>
  );
};
