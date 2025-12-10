'use client';

export function LandingFeatures() {
    return (
        <section className="container mx-auto px-4 pb-24 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-6">
                {/* Feature 1: Persona Jury */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        ⚖️
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Persona Jury</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Simulate diverse platform policies (Meta, TikTok, X) to detect whether content is universally violating or genuinely ambiguous.
                    </p>
                </div>

                {/* Feature 2: Adversarial Debate */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-red-500/50 transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        ⚔️
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Pro/Con Debate</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Steel-man the argument for removal AND keeping up. A neutral AI referee judges the debate to find the "crux" of the conflict.
                    </p>
                </div>

                {/* Feature 3: Cross-Model Consensus */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        🤖
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Cross-Model Consensus</h3>
                    <p className="text-slate-400 leading-relaxed">
                        Triangulate confidence by running Gemini, GPT-4, and Claude in parallel. Separate model bias from actual policy violations.
                    </p>
                </div>
            </div>
        </section>
    );
}

