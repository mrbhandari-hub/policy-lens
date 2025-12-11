'use client';

export function LandingFeatures() {
    return (
        <section className="container mx-auto px-4 pb-24 max-w-6xl">
            {/* Core Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
                {/* Feature 1: Persona Jury */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-purple-500/50 transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        ⚖️
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">42 Expert Judges</h3>
                    <p className="text-slate-400 leading-relaxed mb-4">
                        Simulate Meta, YouTube, TikTok, X, Google Search policies plus expert perspectives from civil libertarians to child safety advocates.
                    </p>
                    <div className="flex flex-wrap gap-1">
                        <span className="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded">Platform</span>
                        <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-amber-300 rounded">Oversight</span>
                        <span className="text-xs px-2 py-0.5 bg-teal-900/30 text-teal-300 rounded">Ideological</span>
                    </div>
                </div>

                {/* Feature 2: Adversarial Debate */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-red-500/50 transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        ⚔️
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Pro/Con Debate</h3>
                    <p className="text-slate-400 leading-relaxed mb-4">
                        Steel-man arguments for removal AND keeping up. A neutral AI referee judges to find the &quot;crux&quot; of the conflict.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="text-emerald-400">✓ Allow</span>
                        <span>vs</span>
                        <span className="text-rose-400">🚫 Remove</span>
                    </div>
                </div>

                {/* Feature 3: Cross-Model Consensus */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 transition-all group">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        🤖
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Cross-Model Analysis</h3>
                    <p className="text-slate-400 leading-relaxed mb-4">
                        Triangulate confidence with Gemini, GPT-4, and Claude. Separate model bias from genuine policy concerns.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-300 rounded">Gemini</span>
                        <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-300 rounded">GPT-4</span>
                        <span className="text-xs px-2 py-0.5 bg-orange-900/30 text-orange-300 rounded">Claude</span>
                    </div>
                </div>
            </div>

            {/* Methodology Section - NEW */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 border border-slate-700 rounded-2xl p-8 md:p-12 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center text-2xl">
                        🔬
                    </div>
                    <h2 className="text-2xl font-bold text-white">How It Works</h2>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">1</div>
                        <h4 className="text-white font-semibold mb-2">Input Content</h4>
                        <p className="text-slate-400 text-sm">Paste text, upload images, or add context about the source</p>
                    </div>
                    <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">2</div>
                        <h4 className="text-white font-semibold mb-2">Select Judges</h4>
                        <p className="text-slate-400 text-sm">Choose from 42 AI judges representing different policy frameworks</p>
                    </div>
                    <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">3</div>
                        <h4 className="text-white font-semibold mb-2">AI Analysis</h4>
                        <p className="text-slate-400 text-sm">Each judge evaluates independently, providing verdicts with confidence scores</p>
                    </div>
                    <div className="text-center">
                        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-purple-500/20 flex items-center justify-center text-white font-bold">4</div>
                        <h4 className="text-white font-semibold mb-2">Synthesis</h4>
                        <p className="text-slate-400 text-sm">Get a consensus view, identify outliers, and understand the core tension</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                    <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <span>🎯</span> Deep Dive Options
                    </h4>
                    <div className="grid md:grid-cols-3 lg:grid-cols-7 gap-3">
                        {[
                            { icon: '⚔️', name: 'Debate', desc: 'Pro/con arguments' },
                            { icon: '🤖', name: 'Cross-Model', desc: 'Multi-LLM consensus' },
                            { icon: '🔀', name: 'Counterfactual', desc: 'What-if scenarios' },
                            { icon: '🎯', name: 'Red Team', desc: 'Attack vectors' },
                            { icon: '🎲', name: 'Consistency', desc: 'Reliability check' },
                            { icon: '⏰', name: 'Temporal', desc: 'Time sensitivity' },
                            { icon: '📝', name: 'Appeal', desc: 'Predict objections' },
                        ].map(item => (
                            <div key={item.name} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 text-center">
                                <span className="text-xl">{item.icon}</span>
                                <div className="text-white text-sm font-medium mt-1">{item.name}</div>
                                <div className="text-slate-500 text-xs">{item.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trust Indicators - NEW */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-teal-400 mb-2">8s</div>
                    <div className="text-slate-400 text-sm">Average analysis time</div>
                    <div className="text-slate-500 text-xs mt-1">vs. 15 min manual review</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">42</div>
                    <div className="text-slate-400 text-sm">Expert judge personas</div>
                    <div className="text-slate-500 text-xs mt-1">Platforms + oversight + ideological</div>
                </div>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-amber-400 mb-2">7</div>
                    <div className="text-slate-400 text-sm">Deep dive analyses</div>
                    <div className="text-slate-500 text-xs mt-1">Debate, red team, temporal & more</div>
                </div>
            </div>
        </section>
    );
}

