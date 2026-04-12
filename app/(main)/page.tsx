import {
  LocationCard,
  Calendar,
  ChatWidget,
  PixelImage,
  ProfileWave,
  GlitchText,
  TimelineSectionV2,
  MusicCard,
} from "@/components/main";

import Image from "next/image";

export default function Home() {
  return (
    <>
      {/* <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto"> */}
      {/* <!-- Hero Section: Terminal Header --> */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8">
            <h1 className="text-6xl md:text-8xl font-headline font-black leading-[0.9] tracking-tighter text-on-surface">
              {"Hii I'm "}
              <GlitchText speed={0.4}>Paul</GlitchText>
            </h1>
          </div>
        </div>
      </section>
      {/* <!-- Bio & Technical Stack: Asymmetric Layout --> */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-20">
        <div className="lg:col-span-5 relative">
          <div className="group aspect-4/5 rounded-none border border-outline overflow-hidden shadow-[0_0_50px_rgba(0,229,255,0.05)] relative z-10">
            <PixelImage
              src="https://gwymehqkxnsurinrisdl.supabase.co/storage/v1/object/public/assets/profile-2.png"
              grid="4x6"
              className="w-full h-full"
            />
            <ProfileWave />
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

          {/* <!-- Chat Interface Component --> */}
        </div>
      </section>
      <TimelineSectionV2 />
      {/* <!-- Bento Grid: Tech-centric Artifacts --> */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
            Offline{" "}
            <span className="italic font-light text-primary">Dependencies</span>
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
          {/* <!-- Location --> */}
          <LocationCard />

          <div className="md:col-span-2 overflow-hidden relative min-h-62.5 player-border-glow">
            <MusicCard />
            <div className="absolute top-4 left-4">
              <span className="bg-pink-600/90 text-on-primary px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                MUSIC
              </span>
            </div>
          </div>

          {/* <!-- DVD Logo --> */}
          {/* <DvdCornerEmoji /> */}

          {/* <!-- Wavetick --> */}
          {/* <WaveTick /> */}
        </div>
      </section>
      <section>
        <div className="mb-20">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
              Events{" "}
              <span className="italic font-light text-primary">Calendar</span>
            </h2>
            <span className="h-[1px] bg-outline flex-grow mx-8 hidden md:block"></span>
          </div>
          <div className="max-w-4xl">
            <Calendar />
          </div>
        </div>
      </section>
      {/* </main> */}
    </>
  );
}
