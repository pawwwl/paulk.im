export function HireSection() {
  return (
    <section className="mb-20">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-5xl font-headline font-black tracking-tight uppercase text-on-surface">
          My <span className="italic font-light text-primary">Resume</span>
        </h2>
        <span className="h-[1px] bg-outline flex-grow mx-8 hidden md:block" />
      </div>

      <div className="border border-outline bg-surface overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-outline">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-led" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              Resume — Paul Kim
            </span>
          </div>
        </div>
        <iframe
          src="/api/admin/resume?preview=1"
          className="w-full"
          style={{ height: "100vh", border: "none" }}
          title="Paul Kim — Resume"
        />
      </div>
    </section>
  );
}
