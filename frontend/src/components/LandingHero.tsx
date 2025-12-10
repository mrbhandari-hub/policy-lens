'use client';

import Link from 'next/link';

export function LandingHero() {
    return (
        <section className="relative pt-20 pb-32 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 text-center max-w-5xl">
                <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-full px-4 py-1 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-slate-300 text-sm font-medium">PolicyLens v2.0 is Live</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    Engineer the <br />
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        Feedback Loop
                    </span>
                    {' '}for Trust & Safety
                </h1>

                <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    Coding exploded because of fast, objective feedback loops.
                    PolicyLens brings that same <b>agentic velocity</b> to content moderation by turning ambiguity into measurable data.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <Link
                        href="/analyze"
                        className="px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] active:scale-95"
                    >
                        Launch Analysis Engine ↓
                    </Link>
                </div>
            </div>
        </section>
    );
}

