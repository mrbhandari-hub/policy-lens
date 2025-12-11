'use client';

import { useState } from 'react';
import {
    CounterfactualResult,
    RedTeamResult,
    SelfConsistencyResult,
    MoralFoundationsResult,
    StakeholderResult,
    TemporalResult,
    AppealResult,
    SycophancyResult,
    VerdictTier,
} from '@/types';

// Shared tier config
const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string; emoji: string }> = {
    REMOVE: { color: 'text-rose-400', bgColor: 'bg-rose-600', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Reduce Reach', emoji: '📉' },
    LABEL: { color: 'text-sky-400', bgColor: 'bg-sky-500', label: 'Label', emoji: '🏷️' },
    ALLOW: { color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Allow', emoji: '✅' },
};

// =============================================================================
// COUNTERFACTUAL CARD
// =============================================================================

interface CounterfactualCardProps {
    data: CounterfactualResult;
}

export function CounterfactualCard({ data }: CounterfactualCardProps) {
    const [showAll, setShowAll] = useState(false);
    const originalConfig = tierConfig[data.original_verdict];

    const boundaryColors = {
        clear_boundaries: { color: 'text-emerald-400', bg: 'bg-emerald-900/40', label: 'Clear Boundaries', icon: '✓' },
        fuzzy_boundaries: { color: 'text-amber-400', bg: 'bg-amber-900/40', label: 'Fuzzy Boundaries', icon: '~' },
        knife_edge: { color: 'text-rose-400', bg: 'bg-rose-900/40', label: 'Knife Edge', icon: '⚠' },
    };
    const boundary = boundaryColors[data.boundary_clarity];

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-violet-950/40 via-[#0f1629] to-fuchsia-950/40 p-4 border-b border-[#1e293d]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🔀</span> Counterfactual Analysis
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            What would change the verdict?
                        </p>
                    </div>
                    <span className={`${boundary.bg} ${boundary.color} px-3 py-1.5 rounded-full text-sm font-medium`}>
                        {boundary.icon} {boundary.label}
                    </span>
                </div>
            </div>

            <div className="p-5">
                {/* Current Verdict */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-slate-400 text-sm">Current Verdict:</span>
                    <span className={`${originalConfig.bgColor} text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5`}>
                        {originalConfig.emoji} {originalConfig.label}
                    </span>
                </div>

                {/* Most Sensitive Factor */}
                <div className="bg-violet-950/30 border border-violet-800/40 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚡</span>
                        <div>
                            <p className="text-violet-300 text-sm font-medium mb-1">Most Sensitive Factor</p>
                            <p className="text-slate-200 text-sm">{data.most_sensitive_factor}</p>
                        </div>
                    </div>
                </div>

                {/* Two columns: Flip to Allow / Flip to Remove */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Flip to Allow */}
                    <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
                        <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                            <span>→</span> Changes to Allow
                        </h4>
                        <div className="space-y-3">
                            {(showAll ? data.flip_to_allow : data.flip_to_allow.slice(0, 2)).map((scenario, i) => (
                                <div key={i} className="bg-[#0a0f1a]/60 rounded-lg p-3 border border-emerald-900/30">
                                    <p className="text-slate-200 text-sm mb-2">{scenario.change_description}</p>
                                    <p className="text-slate-400 text-xs">{scenario.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Flip to Remove */}
                    <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-4">
                        <h4 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
                            <span>→</span> Changes to Remove
                        </h4>
                        <div className="space-y-3">
                            {(showAll ? data.flip_to_remove : data.flip_to_remove.slice(0, 2)).map((scenario, i) => (
                                <div key={i} className="bg-[#0a0f1a]/60 rounded-lg p-3 border border-rose-900/30">
                                    <p className="text-slate-200 text-sm mb-2">{scenario.change_description}</p>
                                    <p className="text-slate-400 text-xs">{scenario.explanation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {(data.flip_to_allow.length > 2 || data.flip_to_remove.length > 2) && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="mt-4 text-violet-400 text-sm hover:text-violet-300 transition-colors"
                    >
                        {showAll ? '− Show less' : '+ Show all scenarios'}
                    </button>
                )}
            </div>
        </div>
    );
}

// =============================================================================
// RED TEAM CARD
// =============================================================================

interface RedTeamCardProps {
    data: RedTeamResult;
}

export function RedTeamCard({ data }: RedTeamCardProps) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const robustnessConfig = {
        robust: { color: 'text-emerald-400', bg: 'bg-emerald-900/40', label: 'Robust', icon: '🛡️' },
        moderate: { color: 'text-amber-400', bg: 'bg-amber-900/40', label: 'Moderate', icon: '⚠️' },
        fragile: { color: 'text-rose-400', bg: 'bg-rose-900/40', label: 'Fragile', icon: '🚨' },
    };
    const robustness = robustnessConfig[data.overall_robustness];

    const severityColors = {
        low: 'text-slate-400 bg-slate-800/40',
        medium: 'text-amber-400 bg-amber-900/40',
        high: 'text-orange-400 bg-orange-900/40',
        critical: 'text-rose-400 bg-rose-900/40',
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-950/40 via-[#0f1629] to-orange-950/40 p-4 border-b border-[#1e293d]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🎯</span> Red Team Analysis
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Adversarial vulnerability assessment
                        </p>
                    </div>
                    <span className={`${robustness.bg} ${robustness.color} px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5`}>
                        {robustness.icon} {robustness.label}
                    </span>
                </div>
            </div>

            <div className="p-5">
                {/* Vulnerabilities */}
                <div className="mb-6">
                    <h4 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
                        🔓 Identified Vulnerabilities
                    </h4>
                    <div className="space-y-3">
                        {data.vulnerabilities.map((vuln, i) => (
                            <div
                                key={i}
                                className="bg-[#0a0f1a]/60 border border-[#1e293d] rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpanded(expanded === `vuln-${i}` ? null : `vuln-${i}`)}
                                    className="w-full p-3 flex items-center justify-between text-left hover:bg-[#1e293d]/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`${severityColors[vuln.severity]} px-2 py-0.5 rounded text-xs font-medium uppercase`}>
                                            {vuln.severity}
                                        </span>
                                        <span className="text-slate-200 text-sm">{vuln.attack_vector}</span>
                                    </div>
                                    <span className="text-slate-500">{expanded === `vuln-${i}` ? '−' : '+'}</span>
                                </button>
                                {expanded === `vuln-${i}` && (
                                    <div className="p-3 pt-0 border-t border-[#1e293d]">
                                        <div className="mb-2">
                                            <p className="text-slate-500 text-xs uppercase mb-1">Example Exploitation</p>
                                            <p className="text-slate-300 text-sm">{vuln.example_exploitation}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 text-xs uppercase mb-1">Mitigation</p>
                                            <p className="text-emerald-400/80 text-sm">{vuln.mitigation}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Evasion Techniques */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4">
                        <h4 className="text-amber-400 font-bold mb-3 text-sm">🎭 Evasion Techniques</h4>
                        <ul className="space-y-2">
                            {data.evasion_techniques.map((tech, i) => (
                                <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">•</span>
                                    {tech}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-orange-950/20 border border-orange-800/30 rounded-xl p-4">
                        <h4 className="text-orange-400 font-bold mb-3 text-sm">🔄 Context Manipulations</h4>
                        <ul className="space-y-2">
                            {data.context_manipulations.map((manip, i) => (
                                <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                                    <span className="text-orange-500 mt-0.5">•</span>
                                    {manip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-teal-950/30 border border-teal-800/30 rounded-xl p-4">
                    <h4 className="text-teal-400 font-bold mb-3 flex items-center gap-2">
                        💡 Recommendations
                    </h4>
                    <ul className="space-y-2">
                        {data.recommendations.map((rec, i) => (
                            <li key={i} className="text-teal-200/80 text-sm flex items-start gap-2">
                                <span className="text-teal-500 mt-0.5">→</span>
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// SELF-CONSISTENCY CARD
// =============================================================================

interface SelfConsistencyCardProps {
    data: SelfConsistencyResult;
}

export function SelfConsistencyCard({ data }: SelfConsistencyCardProps) {
    const majorityConfig = tierConfig[data.majority_verdict];
    const consistencyPercent = Math.round(data.consistency_score * 100);

    const consistencyColor = data.consistency_score >= 0.85
        ? 'text-emerald-400'
        : data.consistency_score >= 0.6
            ? 'text-amber-400'
            : 'text-rose-400';

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-cyan-950/40 via-[#0f1629] to-blue-950/40 p-4 border-b border-[#1e293d]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🎲</span> Self-Consistency Sampling
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            {data.samples.length} independent reasoning paths
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`${consistencyColor} text-2xl font-mono font-bold`}>{consistencyPercent}%</p>
                        <p className="text-slate-500 text-xs">Consistency</p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Verdict Distribution Bar */}
                <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-2">Verdict Distribution</p>
                    <div className="flex rounded-full overflow-hidden h-8">
                        {Object.entries(data.verdict_distribution).map(([verdict, count]) => {
                            if (count === 0) return null;
                            const config = tierConfig[verdict as VerdictTier];
                            const percent = (count / data.samples.length) * 100;
                            return (
                                <div
                                    key={verdict}
                                    className={`${config.bgColor} flex items-center justify-center text-white text-xs font-medium transition-all`}
                                    style={{ width: `${percent}%` }}
                                    title={`${config.label}: ${count}/${data.samples.length}`}
                                >
                                    {percent > 15 && `${config.emoji} ${count}`}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Majority Verdict */}
                <div className="flex items-center gap-3 mb-6 bg-[#0a0f1a]/60 rounded-xl p-4 border border-[#1e293d]">
                    <span className="text-slate-400 text-sm">Majority Verdict:</span>
                    <span className={`${majorityConfig.bgColor} text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5`}>
                        {majorityConfig.emoji} {majorityConfig.label}
                    </span>
                    <span className="text-slate-500 text-sm ml-auto">
                        {data.verdict_distribution[data.majority_verdict]} of {data.samples.length} samples
                    </span>
                </div>

                {/* Variance Factors */}
                {data.variance_factors.length > 0 && (
                    <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-4 mb-6">
                        <h4 className="text-amber-400 font-bold mb-2 text-sm">⚡ Sources of Variance</h4>
                        <ul className="space-y-1">
                            {data.variance_factors.map((factor, i) => (
                                <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">•</span>
                                    {factor}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Recommendation */}
                <div className={`rounded-xl p-4 border ${
                    data.consistency_score >= 0.85
                        ? 'bg-emerald-950/20 border-emerald-800/30'
                        : data.consistency_score >= 0.6
                            ? 'bg-amber-950/20 border-amber-800/30'
                            : 'bg-rose-950/20 border-rose-800/30'
                }`}>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">
                            {data.consistency_score >= 0.85 ? '✅' : data.consistency_score >= 0.6 ? '⚠️' : '🚨'}
                        </span>
                        <div>
                            <p className={`${consistencyColor} text-sm font-medium mb-1`}>Recommendation</p>
                            <p className="text-slate-200 text-sm">{data.recommendation}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// MORAL FOUNDATIONS CARD
// =============================================================================

interface MoralFoundationsCardProps {
    data: MoralFoundationsResult;
}

export function MoralFoundationsCard({ data }: MoralFoundationsCardProps) {
    const [expanded, setExpanded] = useState<string | null>(null);

    const foundationEmojis: Record<string, string> = {
        'Care/Harm': '💗',
        'Fairness/Cheating': '⚖️',
        'Loyalty/Betrayal': '🤝',
        'Authority/Subversion': '👑',
        'Sanctity/Degradation': '✨',
        'Liberty/Oppression': '🗽',
    };

    const directionColors = {
        violated: 'text-rose-400 bg-rose-900/30',
        upheld: 'text-emerald-400 bg-emerald-900/30',
        neutral: 'text-slate-400 bg-slate-800/30',
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-purple-950/40 via-[#0f1629] to-pink-950/40 p-4 border-b border-[#1e293d]">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">⚖️</span> Moral Foundations Analysis
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                    Based on Jonathan Haidt&apos;s Moral Foundations Theory
                </p>
            </div>

            <div className="p-5">
                {/* Foundation Bars */}
                <div className="space-y-4 mb-6">
                    {data.foundations.map((f) => (
                        <div key={f.foundation}>
                            <button
                                onClick={() => setExpanded(expanded === f.foundation ? null : f.foundation)}
                                className="w-full"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span>{foundationEmojis[f.foundation] || '📊'}</span>
                                        <span className="text-slate-200 text-sm font-medium">{f.foundation}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`${directionColors[f.direction]} px-2 py-0.5 rounded text-xs`}>
                                            {f.direction}
                                        </span>
                                        <span className="text-slate-400 text-sm font-mono">{Math.round(f.score * 100)}%</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-[#1e293d] rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            f.direction === 'violated' ? 'bg-rose-500' :
                                            f.direction === 'upheld' ? 'bg-emerald-500' :
                                            'bg-slate-500'
                                        }`}
                                        style={{ width: `${f.score * 100}%` }}
                                    />
                                </div>
                            </button>
                            {expanded === f.foundation && (
                                <div className="mt-2 bg-[#0a0f1a]/60 rounded-lg p-3 border border-[#1e293d]">
                                    <p className="text-slate-300 text-sm">{f.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Dominant Foundation */}
                <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">🎯</span>
                        <div>
                            <p className="text-purple-300 text-sm font-medium mb-1">Dominant Foundation</p>
                            <p className="text-slate-200 text-sm">{data.dominant_foundation}</p>
                        </div>
                    </div>
                </div>

                {/* Moral Conflict */}
                {data.moral_conflict && (
                    <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">⚡</span>
                            <div>
                                <p className="text-amber-300 text-sm font-medium mb-1">Moral Conflict</p>
                                <p className="text-slate-200 text-sm">{data.moral_conflict}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Explains Disagreement */}
                <div className="bg-teal-950/30 border border-teal-800/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <p className="text-teal-300 text-sm font-medium mb-1">Why Judges Disagree</p>
                            <p className="text-slate-200 text-sm">{data.explains_disagreement}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// STAKEHOLDER CARD
// =============================================================================

interface StakeholderCardProps {
    data: StakeholderResult;
}

export function StakeholderCard({ data }: StakeholderCardProps) {
    const impactColors = {
        positive: 'text-emerald-400 bg-emerald-900/30 border-emerald-800/50',
        negative: 'text-rose-400 bg-rose-900/30 border-rose-800/50',
        mixed: 'text-amber-400 bg-amber-900/30 border-amber-800/50',
        neutral: 'text-slate-400 bg-slate-800/30 border-slate-700/50',
    };

    const severityIndicator = {
        minimal: '○',
        moderate: '◐',
        significant: '◑',
        severe: '●',
    };

    const netImpactConfig = {
        net_positive: { color: 'text-emerald-400', bg: 'bg-emerald-900/40', label: 'Net Positive', icon: '↑' },
        net_negative: { color: 'text-rose-400', bg: 'bg-rose-900/40', label: 'Net Negative', icon: '↓' },
        contested: { color: 'text-amber-400', bg: 'bg-amber-900/40', label: 'Contested', icon: '↔' },
        neutral: { color: 'text-slate-400', bg: 'bg-slate-800/40', label: 'Neutral', icon: '−' },
    };
    const netImpact = netImpactConfig[data.net_impact];

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-indigo-950/40 via-[#0f1629] to-violet-950/40 p-4 border-b border-[#1e293d]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">👥</span> Stakeholder Impact Map
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Who is affected and how?
                        </p>
                    </div>
                    <span className={`${netImpact.bg} ${netImpact.color} px-3 py-1.5 rounded-full text-sm font-medium`}>
                        {netImpact.icon} {netImpact.label}
                    </span>
                </div>
            </div>

            <div className="p-5">
                {/* Stakeholder Grid */}
                <div className="grid md:grid-cols-2 gap-3 mb-6">
                    {data.stakeholders.map((s, i) => (
                        <div
                            key={i}
                            className={`${impactColors[s.impact_type]} border rounded-xl p-4`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{s.stakeholder}</span>
                                <span className="text-xs opacity-70">{severityIndicator[s.severity]} {s.severity}</span>
                            </div>
                            <p className="text-slate-300 text-xs">{s.description}</p>
                            {s.consent_status && (
                                <p className="text-slate-500 text-xs mt-2 italic">Consent: {s.consent_status}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Primary Beneficiary / Harm Recipient */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-4">
                        <p className="text-emerald-400 text-xs uppercase tracking-wide mb-2">Primary Beneficiary</p>
                        <p className="text-slate-200 text-sm">{data.primary_beneficiary}</p>
                    </div>
                    <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-4">
                        <p className="text-rose-400 text-xs uppercase tracking-wide mb-2">Primary Harm Recipient</p>
                        <p className="text-slate-200 text-sm">{data.primary_harm_recipient}</p>
                    </div>
                </div>

                {/* Power Dynamics */}
                <div className="bg-[#0a0f1a]/60 border border-[#1e293d] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚡</span>
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Power Dynamics</p>
                            <p className="text-slate-200 text-sm">{data.power_dynamics}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// TEMPORAL CARD
// =============================================================================

interface TemporalCardProps {
    data: TemporalResult;
}

export function TemporalCard({ data }: TemporalCardProps) {
    const baselineConfig = tierConfig[data.baseline_verdict];

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-sky-950/40 via-[#0f1629] to-cyan-950/40 p-4 border-b border-[#1e293d]">
                <h3 className="text-white text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">⏰</span> Temporal Sensitivity
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                    How context timing affects the verdict
                </p>
            </div>

            <div className="p-5">
                {/* Baseline */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-slate-400 text-sm">Baseline Verdict:</span>
                    <span className={`${baselineConfig.bgColor} text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5`}>
                        {baselineConfig.emoji} {baselineConfig.label}
                    </span>
                </div>

                {/* Temporal Contexts */}
                <div className="space-y-3 mb-6">
                    {data.temporal_contexts.map((ctx, i) => {
                        const ctxConfig = tierConfig[ctx.verdict];
                        const changed = ctx.verdict !== data.baseline_verdict;
                        return (
                            <div
                                key={i}
                                className={`bg-[#0a0f1a]/60 border ${changed ? 'border-amber-700/50' : 'border-[#1e293d]'} rounded-xl p-4`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {changed && <span className="text-amber-400">⚡</span>}
                                        <span className="text-slate-200 font-medium text-sm">{ctx.context_name}</span>
                                    </div>
                                    <span className={`${ctxConfig.bgColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                                        {ctxConfig.emoji} {ctxConfig.label}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-xs">{ctx.reasoning}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Most Sensitive Context */}
                <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">🎯</span>
                        <div>
                            <p className="text-amber-300 text-sm font-medium mb-1">Most Sensitive Context</p>
                            <p className="text-slate-200 text-sm">{data.most_sensitive_context}</p>
                        </div>
                    </div>
                </div>

                {/* Time Decay */}
                <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">📉</span>
                        <div>
                            <p className="text-sky-300 text-sm font-medium mb-1">Time Decay</p>
                            <p className="text-slate-200 text-sm">{data.time_decay}</p>
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="bg-teal-950/30 border border-teal-800/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <p className="text-teal-300 text-sm font-medium mb-1">Recommendation</p>
                            <p className="text-slate-200 text-sm">{data.recommendation}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// APPEAL CARD
// =============================================================================

interface AppealCardProps {
    data: AppealResult;
}

export function AppealCard({ data }: AppealCardProps) {
    const successPercent = Math.round(data.overall_appeal_success_rate * 100);

    const strengthColors = {
        weak: 'text-slate-400 bg-slate-800/30',
        moderate: 'text-amber-400 bg-amber-900/30',
        strong: 'text-orange-400 bg-orange-900/30',
        compelling: 'text-emerald-400 bg-emerald-900/30',
    };

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-yellow-950/40 via-[#0f1629] to-amber-950/40 p-4 border-b border-[#1e293d]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">📝</span> Appeal Anticipation
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Predicted creator appeal arguments
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`${successPercent > 50 ? 'text-amber-400' : 'text-slate-400'} text-2xl font-mono font-bold`}>
                            {successPercent}%
                        </p>
                        <p className="text-slate-500 text-xs">Appeal Success Rate</p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Predicted Appeals */}
                <div className="space-y-3 mb-6">
                    {data.predicted_appeals.map((appeal, i) => (
                        <div key={i} className="bg-[#0a0f1a]/60 border border-[#1e293d] rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`${strengthColors[appeal.strength]} px-2 py-0.5 rounded text-xs font-medium`}>
                                    {appeal.strength}
                                </span>
                                <span className="text-slate-500 text-xs font-mono">
                                    {Math.round(appeal.success_probability * 100)}% success
                                </span>
                            </div>
                            <p className="text-slate-200 text-sm mb-2">&ldquo;{appeal.argument}&rdquo;</p>
                            <p className="text-slate-500 text-xs">
                                <span className="text-slate-400">Likely Response: </span>
                                {appeal.likely_response}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Strongest Appeal */}
                <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚡</span>
                        <div>
                            <p className="text-amber-300 text-sm font-medium mb-1">Strongest Appeal</p>
                            <p className="text-slate-200 text-sm">{data.strongest_appeal}</p>
                        </div>
                    </div>
                </div>

                {/* Missing Context & Clarifications */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-violet-950/20 border border-violet-800/30 rounded-xl p-4">
                        <h4 className="text-violet-400 font-bold mb-2 text-sm">❓ Missing Context</h4>
                        <ul className="space-y-1">
                            {data.missing_context.map((ctx, i) => (
                                <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                                    <span className="text-violet-500 mt-0.5">•</span>
                                    {ctx}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-teal-950/20 border border-teal-800/30 rounded-xl p-4">
                        <h4 className="text-teal-400 font-bold mb-2 text-sm">💬 Questions to Ask</h4>
                        <ul className="space-y-1">
                            {data.recommended_clarifications.map((q, i) => (
                                <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                                    <span className="text-teal-500 mt-0.5">→</span>
                                    {q}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// SYCOPHANCY CARD
// =============================================================================

interface SycophancyCardProps {
    data: SycophancyResult;
}

export function SycophancyCard({ data }: SycophancyCardProps) {
    const baselineConfig = tierConfig[data.baseline_verdict];
    const robustnessPercent = Math.round(data.robustness_score * 100);

    const robustnessColor = data.robustness_score >= 0.8
        ? 'text-emerald-400'
        : data.robustness_score >= 0.5
            ? 'text-amber-400'
            : 'text-rose-400';

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-pink-950/40 via-[#0f1629] to-rose-950/40 p-4 border-b border-[#1e293d]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🪞</span> Sycophancy Detection
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Testing for framing bias
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`${robustnessColor} text-2xl font-mono font-bold`}>{robustnessPercent}%</p>
                        <p className="text-slate-500 text-xs">Robustness</p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Bias Detection Alert */}
                {data.bias_detected && (
                    <div className="bg-rose-950/40 border border-rose-700/40 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="text-rose-300 font-medium">Bias Detected</p>
                                {data.bias_direction && (
                                    <p className="text-rose-200/70 text-sm mt-1">{data.bias_direction}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Baseline */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-slate-400 text-sm">Neutral Baseline:</span>
                    <span className={`${baselineConfig.bgColor} text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5`}>
                        {baselineConfig.emoji} {baselineConfig.label}
                    </span>
                </div>

                {/* Framing Variations */}
                <div className="space-y-2 mb-6">
                    {data.variations.map((v, i) => {
                        const vConfig = tierConfig[v.verdict];
                        const changed = v.verdict !== data.baseline_verdict;
                        return (
                            <div
                                key={i}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                    changed ? 'bg-rose-950/20 border border-rose-800/30' : 'bg-[#0a0f1a]/60 border border-[#1e293d]'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    {changed && <span className="text-rose-400">⚡</span>}
                                    <span className="text-slate-300 text-sm">{v.framing}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`${vConfig.bgColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                                        {vConfig.emoji} {vConfig.label}
                                    </span>
                                    <span className="text-slate-500 text-xs font-mono">
                                        {Math.round(v.confidence * 100)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Recommendation */}
                <div className={`rounded-xl p-4 border ${
                    data.robustness_score >= 0.8
                        ? 'bg-emerald-950/20 border-emerald-800/30'
                        : data.robustness_score >= 0.5
                            ? 'bg-amber-950/20 border-amber-800/30'
                            : 'bg-rose-950/20 border-rose-800/30'
                }`}>
                    <div className="flex items-start gap-3">
                        <span className="text-xl">
                            {data.robustness_score >= 0.8 ? '✅' : data.robustness_score >= 0.5 ? '⚠️' : '🚨'}
                        </span>
                        <div>
                            <p className={`${robustnessColor} text-sm font-medium mb-1`}>Assessment</p>
                            <p className="text-slate-200 text-sm">{data.recommendation}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

