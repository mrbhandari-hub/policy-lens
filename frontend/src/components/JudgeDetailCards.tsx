'use client';

import { useState } from 'react';
import { JudgeVerdict, VerdictTier } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string }> = {
    REMOVE: { color: 'text-red-400', bgColor: 'bg-red-600', label: 'Remove' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate' },
    REDUCE_REACH: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', label: 'Reduce Reach' },
    LABEL: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Label' },
    ALLOW: { color: 'text-green-400', bgColor: 'bg-green-500', label: 'Allow' },
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
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl p-6 shadow-xl">
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
                            className="border border-slate-600/50 rounded-lg overflow-hidden transition-all"
                        >
                            {/* Header - always visible */}
                            <button
                                onClick={() => toggleExpand(verdict.judge_id)}
                                className="w-full p-4 bg-slate-700/40 hover:bg-slate-700/60 transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <span
                                        className={`${config.bgColor} text-white text-xs px-3 py-1 rounded-full font-medium`}
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
                                <div className="p-4 bg-slate-800/50 border-t border-slate-600/30 space-y-4">
                                    {/* Reasoning */}
                                    <div>
                                        <h4 className="text-purple-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                            <span>💭</span> Reasoning
                                        </h4>
                                        <ul className="space-y-2">
                                            {verdict.reasoning_bullets.map((bullet, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                    <span className="text-purple-400 mt-1">•</span>
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Mitigating Factors */}
                                    {verdict.mitigating_factors.length > 0 && (
                                        <div>
                                            <h4 className="text-green-400 text-sm font-semibold mb-2 flex items-center gap-2">
                                                <span>🛡️</span> Mitigating Factors
                                            </h4>
                                            <ul className="space-y-2">
                                                {verdict.mitigating_factors.map((factor, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                                                        <span className="text-green-400 mt-1">+</span>
                                                        <span>{factor}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Safety confirmation */}
                                    <div className="pt-3 border-t border-slate-600/30">
                                        <span
                                            className={`text-xs px-2 py-1 rounded ${verdict.refusal_to_instruct
                                                    ? 'bg-green-900/30 text-green-400'
                                                    : 'bg-yellow-900/30 text-yellow-400'
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
