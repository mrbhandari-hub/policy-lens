'use client';

import { useState } from 'react';
import { SynthesisResult, ConsensusBadge, VerdictTier } from '@/types';

const badgeConfig: Record<ConsensusBadge, { color: string; bgColor: string; borderColor: string; label: string; icon: string; description: string }> = {
    UNANIMOUS: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-500/30', label: 'Unanimous', icon: '✓', description: 'All judges agree on the verdict' },
    MAJORITY: { color: 'text-sky-400', bgColor: 'bg-sky-500', borderColor: 'border-sky-500/30', label: 'Majority', icon: '⚖', description: 'Most judges agree, but with some dissent' },
    SPLIT: { color: 'text-amber-400', bgColor: 'bg-amber-500', borderColor: 'border-amber-500/30', label: 'Split', icon: '↔', description: 'Significant disagreement between judges' },
    CHAOS: { color: 'text-rose-400', bgColor: 'bg-rose-500', borderColor: 'border-rose-500/30', label: 'Chaos', icon: '⚡', description: 'No clear consensus - highly contested' },
};

const tierLabels: Record<string, { label: string; emoji: string }> = {
    REMOVE: { label: 'Remove', emoji: '🚫' },
    AGE_GATE: { label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { label: 'Reduce Reach', emoji: '📉' },
    LABEL: { label: 'Label', emoji: '🏷️' },
    ALLOW: { label: 'Allow', emoji: '✅' },
};

interface SynthesisCardProps {
    synthesis: SynthesisResult;
}

export function SynthesisCard({ synthesis }: SynthesisCardProps) {
    const badge = badgeConfig[synthesis.consensus_badge];
    const [copied, setCopied] = useState(false);

    // Normalize verdict_distribution to Record format (handles both array and object)
    const distributionRecord: Record<string, number> = Array.isArray(synthesis.verdict_distribution)
        ? synthesis.verdict_distribution.reduce((acc, item) => {
            acc[item.tier] = item.count;
            return acc;
        }, {} as Record<string, number>)
        : synthesis.verdict_distribution;

    // Calculate agreement percentage
    const totalVotes = Object.values(distributionRecord).reduce((a, b) => a + b, 0);
    const maxVotes = Math.max(...Object.values(distributionRecord));
    const agreementPercent = totalVotes > 0 ? Math.round((maxVotes / totalVotes) * 100) : 0;
    const disagreementPercent = 100 - agreementPercent;

    // Find majority and minority verdicts
    const sortedVerdicts = Object.entries(distributionRecord)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);
    
    const majorityVerdict = sortedVerdicts[0];
    const minorityVerdicts = sortedVerdicts.slice(1);

    const handleCopyCrux = async () => {
        try {
            await navigator.clipboard.writeText(synthesis.crux_narrative);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                {/* The Crux - Main Feature */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                            <span className="text-3xl">💡</span> The Crux
                        </h2>
                        <button
                            onClick={handleCopyCrux}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                copied
                                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                    : 'bg-[#1e293d]/60 text-slate-300 border border-[#2d3a52] hover:bg-[#2d3a52]/60 hover:text-white'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Copy Crux
                                </>
                            )}
                        </button>
                    </div>
                    
                    {/* Large, prominent crux narrative */}
                    <div className="bg-gradient-to-br from-[#0a0f1a] to-[#0d1424] border border-teal-500/30 rounded-xl p-6">
                        <blockquote className="text-slate-100 text-lg md:text-xl leading-relaxed">
                            &ldquo;{synthesis.crux_narrative}&rdquo;
                        </blockquote>
                    </div>
                </div>

                {/* Consensus Overview Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    {/* Consensus Badge Card */}
                    <div className={`bg-[#0a0f1a]/80 border ${badge.borderColor} rounded-xl p-4`}>
                        <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Consensus Level</div>
                        <div className="flex items-center gap-3">
                            <span className={`${badge.bgColor} text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2`}>
                                <span className="text-lg">{badge.icon}</span>
                                {badge.label}
                            </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">{badge.description}</p>
                    </div>

                    {/* Agreement Stats Card */}
                    <div className="bg-[#0a0f1a]/80 border border-[#2d3a52] rounded-xl p-4">
                        <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Agreement Rate</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-white">{agreementPercent}%</span>
                            <span className="text-slate-500 text-sm">agree</span>
                        </div>
                        <div className="mt-2 h-2 bg-[#1e293d] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                                style={{ width: `${agreementPercent}%` }}
                            />
                        </div>
                        {disagreementPercent > 15 && (
                            <p className="text-amber-400/80 text-xs mt-2 flex items-center gap-1">
                                <span>⚠️</span> {disagreementPercent}% disagreement signals edge case
                            </p>
                        )}
                    </div>

                    {/* Primary Tension Card */}
                    <div className="bg-[#0a0f1a]/80 border border-[#2d3a52] rounded-xl p-4">
                        <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">Primary Tension</div>
                        <div className="text-teal-300 font-semibold">{synthesis.primary_tension}</div>
                        <p className="text-slate-500 text-xs mt-2">The core policy dimension where disagreement occurs</p>
                    </div>
                </div>

                {/* Majority vs Minority View */}
                {majorityVerdict && (
                    <div className="bg-[#0a0f1a]/60 border border-[#1e293d] rounded-xl p-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Majority View */}
                            <div className="flex-1">
                                <div className="text-slate-400 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    Majority View ({majorityVerdict[1]}/{totalVotes} judges)
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{tierLabels[majorityVerdict[0]]?.emoji}</span>
                                    <span className="text-white font-bold text-lg">{tierLabels[majorityVerdict[0]]?.label || majorityVerdict[0]}</span>
                                </div>
                            </div>

                            {/* Divider */}
                            {minorityVerdicts.length > 0 && (
                                <>
                                    <div className="hidden md:block w-px h-16 bg-[#2d3a52]" />
                                    <div className="md:hidden h-px w-full bg-[#2d3a52]" />
                                </>
                            )}

                            {/* Dissenting Views */}
                            {minorityVerdicts.length > 0 && (
                                <div className="flex-1">
                                    <div className="text-slate-400 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Dissenting Views
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {minorityVerdicts.map(([tier, count]) => (
                                            <span 
                                                key={tier}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-[#1e293d]/60 border border-[#2d3a52] rounded-lg text-sm"
                                            >
                                                <span>{tierLabels[tier]?.emoji}</span>
                                                <span className="text-slate-300">{tierLabels[tier]?.label || tier}</span>
                                                <span className="text-slate-500 text-xs">({count})</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
