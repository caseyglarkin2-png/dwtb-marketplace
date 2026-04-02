"use client";

import { useInView } from "@/lib/hooks/use-in-view";

export function OperatorClose() {
  const { ref, isInView } = useInView();

  return (
    <section id="operator" ref={ref as React.RefObject<HTMLElement>} className={`py-24 md:py-32 px-6 transition-all duration-700 ease-out ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
          Casey Glarkin. The Freight Marketer.
        </h2>

        <p className="text-text-secondary text-lg leading-relaxed max-w-2xl">
          I built this machine because freight companies deserve better than
          recycled agency playbooks. The companies that work with DWTB?! Studios
          get signal-driven GTM that actually converts. If you are reading this
          page, you were invited for a reason.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="mailto:casey@dwtb.dev"
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] border border-border rounded-lg text-text-primary hover:border-accent hover:text-accent transition-colors active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            casey@dwtb.dev
          </a>
        </div>
      </div>
    </section>
  );
}
