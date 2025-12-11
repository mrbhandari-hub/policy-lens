'use client';

import Link from 'next/link';

export function LandingUseCases() {
    return (
        <section className="container mx-auto px-4 py-24 max-w-6xl">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Who is this for?
                </h2>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    PolicyLens helps teams make faster, more consistent content moderation decisions
                </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-4">🛡️</div>
                    <h3 className="text-white font-bold mb-2">Trust & Safety Teams</h3>
                    <p className="text-slate-400 text-sm">
                        Scale moderation decisions with consistent, explainable verdicts
                    </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-white font-bold mb-2">Policy Analysts</h3>
                    <p className="text-slate-400 text-sm">
                        Test policy changes before deployment with simulated scenarios
                    </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-white font-bold mb-2">Content Moderators</h3>
                    <p className="text-slate-400 text-sm">
                        Get second opinions on ambiguous cases with multi-judge analysis
                    </p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center">
                    <div className="text-4xl mb-4">🏗️</div>
                    <h3 className="text-white font-bold mb-2">Platform Builders</h3>
                    <p className="text-slate-400 text-sm">
                        Design content policies with data-driven insights
                    </p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 md:p-12">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">
                    Real-World Use Cases
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl flex-shrink-0">⚡</div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Borderline Content Review</h4>
                                <p className="text-slate-400 text-sm mb-3">
                                    A post sits in your queue. Is it political rhetoric or incitement? 
                                    PolicyLens runs it through multiple platform policies and deep dive 
                                    analyses to surface the key factors.
                                </p>
                                <p className="text-slate-500 text-xs italic">
                                    Before: 15 min manual review → After: 8 sec automated analysis
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl flex-shrink-0">🔄</div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Policy Testing</h4>
                                <p className="text-slate-400 text-sm mb-3">
                                    You're updating your hate speech policy. Test 50 edge cases 
                                    across different judge personas to see how the change affects 
                                    verdicts before going live.
                                </p>
                                <p className="text-slate-500 text-xs italic">
                                    Before: Guesswork → After: Data-driven policy design
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl flex-shrink-0">🌍</div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Cross-Regional Consistency</h4>
                                <p className="text-slate-400 text-sm mb-3">
                                    Ensure your moderation decisions are consistent across regions. 
                                    Compare how Meta, TikTok, and X would handle the same content 
                                    to identify policy gaps.
                                </p>
                                <p className="text-slate-500 text-xs italic">
                                    Before: Inconsistent enforcement → After: Unified standards
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-start gap-4">
                            <div className="text-3xl flex-shrink-0">📊</div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Appeal Preparation</h4>
                                <p className="text-slate-400 text-sm mb-3">
                                    A creator appeals a removal. Use Appeal Anticipation to predict 
                                    their arguments and prepare a response that addresses the core 
                                    concerns.
                                </p>
                                <p className="text-slate-500 text-xs italic">
                                    Before: Reactive responses → After: Proactive resolution
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center mt-12">
                <Link
                    href="/analyze"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                >
                    Try PolicyLens Now
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </section>
    );
}

