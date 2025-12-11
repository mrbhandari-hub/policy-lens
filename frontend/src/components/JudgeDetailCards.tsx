'use client';

import { useState } from 'react';
import { JudgeVerdict, VerdictTier } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string }> = {
    REMOVE: { color: 'text-rose-400', bgColor: 'bg-rose-600', label: 'Remove' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate' },
    REDUCE_REACH: { color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Reduce Reach' },
    LABEL: { color: 'text-sky-400', bgColor: 'bg-sky-500', label: 'Label' },
    ALLOW: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Allow' },
};

interface JudgeDetailCardsProps {
    verdicts: JudgeVerdict[];
}

export function JudgeDetailCards({ verdicts }: JudgeDetailCardsProps) {
    const [expandedJudge, setExpandedJudge] = useState<string | null>(null);

    const formatJudgeName = (id: string) => {
        return id
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const toggleExpand = (judgeId: string) => {
        setExpandedJudge(expandedJudge === judgeId ? null : judgeId);
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-2xl">⚖️</span> Detailed Rationale
            </h3>

            <div className="space-y-4">
                {verdicts.map((verdict) => {
                    const config = tierConfig[verdict.verdict_tier];
                    const isExpanded = expandedJudge === verdict.judge_id;

                    return (
                        <div
                            key={verdict.judge_id}
                            className="border border-[#2d3a52] rounded-xl overflow-hidden transition-all"
                        >
                            {/* Header - always visible */}
                            <button
                                onClick={() => toggleExpand(verdict.judge_id)}
                                className="w-full p-4 bg-[#151d2e]/80 hover:bg-[#1e293d]/80 transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`${config.bgColor} text-white text-xs px-3 py-1 rounded-full font-medium shadow-md`}
                                    >
                                        {config.label}
                                    </span>
                                    <span className="text-white font-semibold">
                                        {formatJudgeName(verdict.judge_id)}
                                    </span>
                                    <span className="text-slate-400 text-sm hidden md:inline">
                                        {verdict.primary_policy_axis}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-slate-400 text-sm">
                                        {(verdict.confidence_score * 100).toFixed(0)}% confident
                                    </span>
                                    <span
                                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''
                                            }`}
                                    >
                                        ▼
                                    </span>
                                </div>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div className="p-4 bg-[#0a0f1a]/60 border-t border-[#1e293d] space-y-4">
                                    {/* Reasoning */}
                                    <div>
                                        <h4 className="text-teal-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span>💭</span> Reasoning
                                        </h4>
                                        <ul className="space-y-2">
                                            {verdict.reasoning_bullets.map((bullet, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                    <span className="text-teal-400 mt-1">•</span>
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Mitigating Factors */}
                                    {verdict.mitigating_factors.length > 0 && (
                                        <div>
                                            <h4 className="text-emerald-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                                <span>🛡️</span> Mitigating Factors
                                            </h4>
                                            <ul className="space-y-2">
                                                {verdict.mitigating_factors.map((factor, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                        <span className="text-emerald-400 mt-1">+</span>
                                                        <span>{factor}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Safety confirmation */}
                                    <div className="pt-3 border-t border-[#1e293d]">
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${verdict.refusal_to_instruct
                                                    ? 'bg-emerald-900/30 text-emerald-400'
                                                    : 'bg-amber-900/30 text-amber-400'
                                                }`}
                                        >
                                            {verdict.refusal_to_instruct
                                                ? '✓ No evasion advice provided'
                                                : '⚠ Safety flag unchecked'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
