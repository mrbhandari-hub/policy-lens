'use client';

import { useState } from 'react';
import { DebateResult, VerdictTier } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string; emoji: string }> = {
    REMOVE: { color: 'text-red-400', bgColor: 'bg-red-600', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', label: 'Reduce Reach', emoji: '📉' },
    LABEL: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Label', emoji: '🏷️' },
    ALLOW: { color: 'text-green-400', bgColor: 'bg-green-500', label: 'Allow', emoji: '✅' },
};

interface DebateCardProps {
    debate: DebateResult;
}

export function DebateCard({ debate }: DebateCardProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const verdictConfig = tierConfig[debate.referee.verdict_tier];

    const toggleSection = (key: string) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const winningSideLabel = debate.referee.winning_side === 'advocate' 
        ? 'Takedown Advocate Wins' 
        : debate.referee.winning_side === 'defender' 
            ? 'Free Speech Defender Wins' 
            : 'Evenly Matched';

    return (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-900/30 via-slate-800 to-green-900/30 p-4 border-b border-slate-700">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">⚔️</span> Pro/Con Debate
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                    Structured argument for and against content action
                </p>
            </div>

            {/* Debate Arena - Two Columns */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700">
                {/* Advocate (Left - Red) */}
                <div className="p-5 bg-gradient-to-br from-red-950/20 to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center">
                            <span className="text-lg">🔴</span>
                        </div>
                        <div>
                            <h4 className="text-red-400 font-bold">Advocate</h4>
                            <p className="text-red-300/60 text-xs">Argues for Takedown</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 mb-4">
                        <p className="text-slate-200 text-sm leading-relaxed">
                            &ldquo;{debate.advocate.argument_summary}&rdquo;
                        </p>
                    </div>

                    {/* Key Points */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('advocate-points')}
                            className="flex items-center justify-between w-full text-left text-red-300 text-sm font-medium mb-2 hover:text-red-200 transition-colors"
                        >
                            <span>Key Arguments ({debate.advocate.key_points.length})</span>
                            <span className="text-lg">{expandedSections['advocate-points'] ? '−' : '+'}</span>
                        </button>
                        {expandedSections['advocate-points'] && (
                            <ul className="space-y-2">
                                {debate.advocate.key_points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="text-red-500 mt-0.5">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Strongest Evidence */}
                    <div className="bg-red-900/20 border-l-2 border-red-500 pl-3 py-2 mb-4">
                        <p className="text-red-300 text-xs uppercase tracking-wide mb-1">Strongest Evidence</p>
                        <p className="text-slate-200 text-sm">{debate.advocate.strongest_evidence}</p>
                    </div>

                    {/* Acknowledged Weaknesses */}
                    {debate.advocate.acknowledged_weaknesses.length > 0 && (
                        <div>
                            <button
                                onClick={() => toggleSection('advocate-weak')}
                                className="flex items-center justify-between w-full text-left text-slate-500 text-xs font-medium mb-2 hover:text-slate-400 transition-colors"
                            >
                                <span>Acknowledged Weaknesses</span>
                                <span>{expandedSections['advocate-weak'] ? '−' : '+'}</span>
                            </button>
                            {expandedSections['advocate-weak'] && (
                                <ul className="space-y-1">
                                    {debate.advocate.acknowledged_weaknesses.map((w, i) => (
                                        <li key={i} className="text-xs text-slate-500 italic">• {w}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>

                {/* Defender (Right - Green) */}
                <div className="p-5 bg-gradient-to-bl from-green-950/20 to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-green-600/30 border border-green-500/50 flex items-center justify-center">
                            <span className="text-lg">🟢</span>
                        </div>
                        <div>
                            <h4 className="text-green-400 font-bold">Defender</h4>
                            <p className="text-green-300/60 text-xs">Argues to Allow</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-green-950/30 border border-green-900/50 rounded-lg p-3 mb-4">
                        <p className="text-slate-200 text-sm leading-relaxed">
                            &ldquo;{debate.defender.argument_summary}&rdquo;
                        </p>
                    </div>

                    {/* Key Points */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('defender-points')}
                            className="flex items-center justify-between w-full text-left text-green-300 text-sm font-medium mb-2 hover:text-green-200 transition-colors"
                        >
                            <span>Key Arguments ({debate.defender.key_points.length})</span>
                            <span className="text-lg">{expandedSections['defender-points'] ? '−' : '+'}</span>
                        </button>
                        {expandedSections['defender-points'] && (
                            <ul className="space-y-2">
                                {debate.defender.key_points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="text-green-500 mt-0.5">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Strongest Evidence */}
                    <div className="bg-green-900/20 border-l-2 border-green-500 pl-3 py-2 mb-4">
                        <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Strongest Evidence</p>
                        <p className="text-slate-200 text-sm">{debate.defender.strongest_evidence}</p>
                    </div>

                    {/* Acknowledged Weaknesses */}
                    {debate.defender.acknowledged_weaknesses.length > 0 && (
                        <div>
                            <button
                                onClick={() => toggleSection('defender-weak')}
                                className="flex items-center justify-between w-full text-left text-slate-500 text-xs font-medium mb-2 hover:text-slate-400 transition-colors"
                            >
                                <span>Acknowledged Weaknesses</span>
                                <span>{expandedSections['defender-weak'] ? '−' : '+'}</span>
                            </button>
                            {expandedSections['defender-weak'] && (
                                <ul className="space-y-1">
                                    {debate.defender.acknowledged_weaknesses.map((w, i) => (
                                        <li key={i} className="text-xs text-slate-500 italic">• {w}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Referee Decision Banner */}
            <div className="bg-gradient-to-r from-purple-900/40 via-slate-800 to-purple-900/40 border-t border-slate-700 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-600/30 border-2 border-purple-500/50 flex items-center justify-center">
                        <span className="text-2xl">⚖️</span>
                    </div>
                    <div>
                        <h4 className="text-purple-300 font-bold text-lg">Referee Decision</h4>
                        <p className="text-purple-200/60 text-sm">{winningSideLabel}</p>
                    </div>
                    <div className="ml-auto">
                        <span className={`${verdictConfig.bgColor} text-white px-4 py-2 rounded-full font-bold flex items-center gap-2`}>
                            {verdictConfig.emoji} {verdictConfig.label}
                        </span>
                    </div>
                </div>

                {/* Confidence Meter */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-400">Decision Confidence</span>
                        <span className="text-purple-300 font-mono">{(debate.referee.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
                            style={{ width: `${debate.referee.confidence_score * 100}%` }}
                        />
                    </div>
                </div>

                {/* Reasoning */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-3">
                    <p className="text-slate-300 text-sm leading-relaxed">{debate.referee.reasoning}</p>
                </div>

                {/* Key Factor */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-purple-400">⚡ Key Factor:</span>
                    <span className="text-slate-300">{debate.referee.key_factor}</span>
                </div>
            </div>
        </div>
    );
}

