'use client';

import { useState } from 'react';
import { SynthesisResult, ConsensusBadge } from '@/types';

const badgeConfig: Record<ConsensusBadge, { color: string; bgColor: string; label: string; icon: string }> = {
    UNANIMOUS: { color: 'text-green-400', bgColor: 'bg-green-500', label: 'Unanimous', icon: '✓' },
    MAJORITY: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Majority', icon: '⚖' },
    SPLIT: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', label: 'Split', icon: '↔' },
    CHAOS: { color: 'text-red-400', bgColor: 'bg-red-500', label: 'Chaos', icon: '⚡' },
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
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                {/* Header with badge */}
                <div className="flex items-center gap-4 mb-6">
                    <span className={`${badge.bgColor} text-white px-5 py-2.5 rounded-full font-bold text-lg shadow-lg flex items-center gap-2`}>
                        <span className="text-xl">{badge.icon}</span>
                        {badge.label}
                    </span>
                    <span className="text-slate-400 text-sm bg-slate-700/70 px-4 py-2 rounded-lg border border-slate-600">
                        <span className="text-slate-500">Primary Tension:</span>{' '}
                        <span className="text-purple-300 font-medium">{synthesis.primary_tension}</span>
                    </span>
                </div>

                {/* The Crux */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-white text-2xl font-bold flex items-center gap-2">
                            <span className="text-purple-400">💡</span> The Crux
                        </h2>
                        <button
                            onClick={handleCopyCrux}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                copied
                                    ? 'bg-green-600/30 text-green-300 border border-green-500/50'
                                    : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-600/50 hover:text-white'
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
                    <blockquote className="text-slate-200 text-lg leading-relaxed italic border-l-4 border-purple-500 pl-4 py-1 bg-slate-800/50 rounded-r-lg">
                        &ldquo;{synthesis.crux_narrative}&rdquo;
                    </blockquote>
                </div>

                {/* Watermark */}
                <div className="pt-4 border-t border-slate-700/50">
                    <p className="text-yellow-500/70 text-sm flex items-center gap-2">
                        {synthesis.watermark}
                    </p>
                </div>
            </div>
        </div>
    );
}
