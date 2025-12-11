'use client';

import { useState } from 'react';
import { DebateResult, VerdictTier, DecisionDifficulty } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string; emoji: string }> = {
    REMOVE: { color: 'text-rose-400', bgColor: 'bg-rose-600', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Reduce Reach', emoji: '📉' },
    LABEL: { color: 'text-sky-400', bgColor: 'bg-sky-500', label: 'Label', emoji: '🏷️' },
    ALLOW: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Allow', emoji: '✅' },
};

const difficultyConfig: Record<DecisionDifficulty, { color: string; bgColor: string; label: string; emoji: string }> = {
    clear: { color: 'text-emerald-400', bgColor: 'bg-emerald-900/40', label: 'Clear Decision', emoji: '✓' },
    moderate: { color: 'text-sky-400', bgColor: 'bg-sky-900/40', label: 'Moderate Difficulty', emoji: '~' },
    difficult: { color: 'text-amber-400', bgColor: 'bg-amber-900/40', label: 'Difficult Call', emoji: '⚠' },
    highly_ambiguous: { color: 'text-rose-400', bgColor: 'bg-rose-900/40', label: 'Highly Ambiguous', emoji: '⚡' },
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
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-950/40 via-[#0f1629] to-emerald-950/40 p-4 border-b border-[#1e293d]">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">⚔️</span> Pro/Con Debate
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                    Structured argument for and against content action
                </p>
            </div>

            {/* Debate Arena - Two Columns */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1e293d]">
                {/* Advocate (Left - Red) */}
                <div className="p-5 bg-gradient-to-br from-rose-950/30 to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-rose-600/30 border border-rose-500/50 flex items-center justify-center">
                            <span className="text-lg">🔴</span>
                        </div>
                        <div>
                            <h4 className="text-rose-400 font-bold">Advocate</h4>
                            <p className="text-rose-300/60 text-xs">Argues for Takedown</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-rose-950/40 border border-rose-900/50 rounded-xl p-3 mb-4">
                        <p className="text-slate-200 text-sm leading-relaxed">
                            &ldquo;{debate.advocate.argument_summary}&rdquo;
                        </p>
                    </div>

                    {/* Key Points */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('advocate-points')}
                            className="flex items-center justify-between w-full text-left text-rose-300 text-sm font-medium mb-2 hover:text-rose-200 transition-colors"
                        >
                            <span>Key Arguments ({debate.advocate.key_points.length})</span>
                            <span className="text-lg">{expandedSections['advocate-points'] ? '−' : '+'}</span>
                        </button>
                        {expandedSections['advocate-points'] && (
                            <ul className="space-y-2">
                                {debate.advocate.key_points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="text-rose-500 mt-0.5">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Strongest Evidence */}
                    <div className="bg-rose-900/20 border-l-2 border-rose-500 pl-3 py-2 mb-4">
                        <p className="text-rose-300 text-xs uppercase tracking-wide mb-1">Strongest Evidence</p>
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
                <div className="p-5 bg-gradient-to-bl from-emerald-950/30 to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center">
                            <span className="text-lg">🟢</span>
                        </div>
                        <div>
                            <h4 className="text-emerald-400 font-bold">Defender</h4>
                            <p className="text-emerald-300/60 text-xs">Argues to Allow</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-3 mb-4">
                        <p className="text-slate-200 text-sm leading-relaxed">
                            &ldquo;{debate.defender.argument_summary}&rdquo;
                        </p>
                    </div>

                    {/* Key Points */}
                    <div className="mb-4">
                        <button
                            onClick={() => toggleSection('defender-points')}
                            className="flex items-center justify-between w-full text-left text-emerald-300 text-sm font-medium mb-2 hover:text-emerald-200 transition-colors"
                        >
                            <span>Key Arguments ({debate.defender.key_points.length})</span>
                            <span className="text-lg">{expandedSections['defender-points'] ? '−' : '+'}</span>
                        </button>
                        {expandedSections['defender-points'] && (
                            <ul className="space-y-2">
                                {debate.defender.key_points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className="text-emerald-500 mt-0.5">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Strongest Evidence */}
                    <div className="bg-emerald-900/20 border-l-2 border-emerald-500 pl-3 py-2 mb-4">
                        <p className="text-emerald-300 text-xs uppercase tracking-wide mb-1">Strongest Evidence</p>
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
            <div className="bg-gradient-to-r from-teal-950/40 via-[#0f1629] to-teal-950/40 border-t border-[#1e293d] p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-teal-600/30 border-2 border-teal-500/50 flex items-center justify-center">
                        <span className="text-2xl">⚖️</span>
                    </div>
                    <div>
                        <h4 className="text-teal-300 font-bold text-lg">Referee Decision</h4>
                        <p className="text-teal-200/60 text-sm">{winningSideLabel}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                        {/* Decision Difficulty Badge */}
                        {debate.referee.decision_difficulty && (
                            <span className={`${difficultyConfig[debate.referee.decision_difficulty].bgColor} ${difficultyConfig[debate.referee.decision_difficulty].color} px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border border-current/20`}>
                                <span>{difficultyConfig[debate.referee.decision_difficulty].emoji}</span>
                                {difficultyConfig[debate.referee.decision_difficulty].label}
                            </span>
                        )}
                        <span className={`${verdictConfig.bgColor} text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg`}>
                            {verdictConfig.emoji} {verdictConfig.label}
                        </span>
                    </div>
                </div>

                {/* Confidence Meter */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-400">Decision Confidence</span>
                        <span className="text-teal-300 font-mono">{(debate.referee.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-[#1e293d] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${
                                debate.referee.confidence_score < 0.5 
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                                    : debate.referee.confidence_score < 0.7 
                                        ? 'bg-gradient-to-r from-sky-500 to-sky-400'
                                        : 'bg-gradient-to-r from-teal-500 to-teal-400'
                            }`}
                            style={{ width: `${debate.referee.confidence_score * 100}%` }}
                        />
                    </div>
                </div>

                {/* Ambiguity Alert - Show when decision is difficult/ambiguous */}
                {debate.referee.decision_difficulty && 
                 (debate.referee.decision_difficulty === 'difficult' || debate.referee.decision_difficulty === 'highly_ambiguous') && (
                    <div className={`mb-4 p-3 rounded-xl border ${
                        debate.referee.decision_difficulty === 'highly_ambiguous' 
                            ? 'bg-rose-950/30 border-rose-800/50' 
                            : 'bg-amber-950/30 border-amber-800/50'
                    }`}>
                        <div className="flex items-start gap-2">
                            <span className="text-lg mt-0.5">
                                {debate.referee.decision_difficulty === 'highly_ambiguous' ? '⚠️' : '🤔'}
                            </span>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                    debate.referee.decision_difficulty === 'highly_ambiguous' 
                                        ? 'text-rose-300' 
                                        : 'text-amber-300'
                                }`}>
                                    {debate.referee.decision_difficulty === 'highly_ambiguous' 
                                        ? 'High Ambiguity Detected — Human Review Recommended'
                                        : 'This was a difficult call'
                                    }
                                </p>
                                {debate.referee.ambiguity_factors && debate.referee.ambiguity_factors.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {debate.referee.ambiguity_factors.map((factor, i) => (
                                            <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                                <span className="text-slate-500 mt-0.5">•</span>
                                                {factor}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reasoning */}
                <div className="bg-[#0a0f1a]/60 rounded-xl p-4 mb-3 border border-[#1e293d]">
                    <p className="text-slate-300 text-sm leading-relaxed">{debate.referee.reasoning}</p>
                </div>

                {/* Key Factor */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-teal-400">⚡ Key Factor:</span>
                    <span className="text-slate-300">{debate.referee.key_factor}</span>
                </div>
            </div>
        </div>
    );
}

