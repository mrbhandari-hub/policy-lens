'use client';

import { useState } from 'react';
import { SynthesisResult, ConsensusBadge } from '@/types';

const badgeConfig: Record<ConsensusBadge, { color: string; bgColor: string; label: string; icon: string }> = {
    UNANIMOUS: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Unanimous', icon: '✓' },
    MAJORITY: { color: 'text-sky-400', bgColor: 'bg-sky-500', label: 'Majority', icon: '⚖' },
    SPLIT: { color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Split', icon: '↔' },
    CHAOS: { color: 'text-rose-400', bgColor: 'bg-rose-500', label: 'Chaos', icon: '⚡' },
};

interface SynthesisCardProps {
    synthesis: SynthesisResult;
}

export function SynthesisCard({ synthesis }: SynthesisCardProps) {
    const badge = badgeConfig[synthesis.consensus_badge];
    const [copied, setCopied] = useState(false);

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
                {/* Header with badge */}
                <div className="flex items-center gap-4 mb-6">
                    <span className={`${badge.bgColor} text-white px-5 py-2.5 rounded-full font-bold text-lg shadow-lg flex items-center gap-2`}>
                        <span className="text-xl">{badge.icon}</span>
                        {badge.label}
                    </span>
                    <span className="text-slate-400 text-sm bg-[#1e293d]/80 px-4 py-2 rounded-lg border border-[#2d3a52]">
                        <span className="text-slate-500">Primary Tension:</span>{' '}
                        <span className="text-teal-300 font-medium">{synthesis.primary_tension}</span>
                    </span>
                </div>

                {/* The Crux */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                            <span className="text-teal-400">💡</span> The Crux
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
                    <blockquote className="text-slate-200 text-lg leading-relaxed italic border-l-4 border-teal-500 pl-4 py-1 bg-[#0a0f1a]/60 rounded-r-lg">
                        &ldquo;{synthesis.crux_narrative}&rdquo;
                    </blockquote>
                </div>

            </div>
        </div>
    );
}
