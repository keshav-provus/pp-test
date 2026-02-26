"use client";

const CORE_VALUES = [
  { title: "Customer Obsession", description: "Delighted customers and satisfied users drive everything we build." },
  { title: "Diversity & Inclusion", description: "The strongest team is one that is unafraid to be themselves." },
  { title: "Accountability", description: "The foundation of our relationships is built on trust and delivery." },
  { title: "Execution", description: "Flawless execution is the standard — anything less is unacceptable." },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-16 relative overflow-hidden bg-background transition-colors duration-300">
      
      {/* Background ambient glow */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[800px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text */}
          <div>
            <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-4">
              About Provus
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-6 transition-colors">
              The leading innovator
              <br />
              in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 italic">services quoting.</span>
            </h2>
            <p className="text-muted-foreground text-base font-light leading-relaxed mb-5 transition-colors">
              Provus was founded by the individuals who envisioned, built, and
              sold the first CPQ products on the market. Our founders led sales
              and professional services teams at large technology companies —
              and felt the pain of inefficient quoting processes first-hand.
            </p>
            <p className="text-muted-foreground text-base font-light leading-relaxed mb-8 transition-colors">
              Today, Provus delivers the industry&apos;s only AI-powered
              services quoting cloud — purpose-built for services businesses
              using data-driven approaches and deep domain expertise. This
              Planning Poker tool is part of our internal innovation culture:
              empowering teams to work smarter at every layer.
            </p>

            <a
              href="https://provus.ai/company/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:opacity-80 transition-opacity group"
            >
              Learn more about Provus
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </a>
          </div>

          {/* Right: Values Grid */}
          <div className="grid grid-cols-2 gap-5">
            {CORE_VALUES.map((value) => (
              <div
                key={value.title}
                className="group relative rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-xl p-6 hover:border-primary/30 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-md dark:shadow-none"
              >
                {/* Subtle hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="w-2 h-2 rounded-full bg-primary mb-4 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                <h4 className="text-foreground text-base font-semibold mb-2 relative z-10">
                  {value.title}
                </h4>
                <p className="text-muted-foreground text-sm font-light leading-relaxed relative z-10">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}