'use client';

import { useState } from 'react';
import {
    CounterfactualResult,
    RedTeamResult,
    TemporalResult,
    AppealResult,
    SycophancyResult,
    VerdictTier,
} from '@/types';

// Re-export SycophancyResult for convenience
export type { SycophancyResult } from '@/types';

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
// APPEAL CARD (Enhanced with Draft Appeal Letter)
// =============================================================================

interface AppealCardProps {
    data: AppealResult;
}

export function AppealCard({ data }: AppealCardProps) {
    const [showDraftLetter, setShowDraftLetter] = useState(false);
    const [copied, setCopied] = useState(false);
    const successPercent = Math.round(data.overall_appeal_success_rate * 100);

    const strengthColors = {
        weak: 'text-slate-400 bg-slate-800/30',
        moderate: 'text-amber-400 bg-amber-900/30',
        strong: 'text-orange-400 bg-orange-900/30',
        compelling: 'text-emerald-400 bg-emerald-900/30',
    };

    // Generate a draft appeal letter based on the strongest arguments
    const generateDraftAppeal = () => {
        const strongAppeals = data.predicted_appeals.filter(a => a.strength === 'strong' || a.strength === 'compelling');
        const topAppeals = strongAppeals.length > 0 ? strongAppeals : data.predicted_appeals.slice(0, 2);
        
        const letter = `Dear Trust & Safety Team,

I am writing to appeal the moderation decision on my content. I believe this decision may warrant reconsideration for the following reasons:

${topAppeals.map((a, i) => `${i + 1}. ${a.argument}`).join('\n\n')}

Additional context that may be relevant:
${data.missing_context.map(ctx => `• ${ctx}`).join('\n')}

I respectfully request that you reconsider this decision in light of the above points. I am happy to provide any additional information or clarification that would be helpful.

Thank you for your time and consideration.

Sincerely,
[Your Name]`;
        
        return letter;
    };

    const handleCopyLetter = async () => {
        try {
            await navigator.clipboard.writeText(generateDraftAppeal());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
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

                {/* Draft Appeal Letter - NEW */}
                <div className="bg-gradient-to-br from-purple-950/30 to-violet-950/20 border border-purple-800/40 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-purple-300 font-bold text-sm flex items-center gap-2">
                            <span>✉️</span> Draft Appeal Letter
                        </h4>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowDraftLetter(!showDraftLetter)}
                                className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
                            >
                                {showDraftLetter ? 'Hide' : 'Show'} Letter
                            </button>
                            {showDraftLetter && (
                                <button
                                    onClick={handleCopyLetter}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                        copied
                                            ? 'bg-emerald-600/30 text-emerald-300'
                                            : 'bg-purple-900/40 text-purple-300 hover:bg-purple-900/60'
                                    }`}
                                >
                                    {copied ? '✓ Copied!' : 'Copy'}
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="text-slate-400 text-xs mb-3">
                        Auto-generated appeal template based on the strongest arguments. Edit before sending.
                    </p>
                    {showDraftLetter && (
                        <div className="bg-[#0a0f1a]/80 rounded-lg p-4 border border-purple-900/30">
                            <pre className="text-slate-300 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                                {generateDraftAppeal()}
                            </pre>
                        </div>
                    )}
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
// SYCOPHANCY CARD (Consistency/Bias Detection)
// =============================================================================

interface SycophancyCardProps {
    data: SycophancyResult;
}

export function SycophancyCard({ data }: SycophancyCardProps) {
    const consistencyPercent = Math.round(data.consistency_score * 100);
    const baselineConfig = tierConfig[data.baseline_verdict];
    
    const consistencyLevel = consistencyPercent >= 80 ? 'high' : consistencyPercent >= 50 ? 'moderate' : 'low';
    const consistencyColors = {
        high: { color: 'text-emerald-400', bg: 'bg-emerald-900/40', label: 'Highly Consistent' },
        moderate: { color: 'text-amber-400', bg: 'bg-amber-900/40', label: 'Moderately Consistent' },
        low: { color: 'text-rose-400', bg: 'bg-rose-900/40', label: 'Low Consistency' },
    };
    const config = consistencyColors[consistencyLevel];

    return (
        <div className="bg-[#0f1629]/90 backdrop-blur-sm border border-[#1e293d] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-pink-950/40 via-[#0f1629] to-rose-950/40 p-4 border-b border-[#1e293d]">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-2xl">🎭</span> Sycophancy Detection
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Testing for consistency under manipulation
                        </p>
                    </div>
                    <span className={`${config.bg} ${config.color} px-3 py-1.5 rounded-full text-sm font-medium`}>
                        {consistencyPercent}% Consistent
                    </span>
                </div>
            </div>

            <div className="p-5">
                {/* Baseline */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-slate-400 text-sm">Baseline Verdict:</span>
                    <span className={`${baselineConfig.bgColor} text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5`}>
                        {baselineConfig.emoji} {baselineConfig.label}
                    </span>
                </div>

                {/* Manipulation Tests */}
                <div className="space-y-3 mb-6">
                    <h4 className="text-slate-400 text-sm font-medium">Manipulation Tests</h4>
                    {data.manipulated_verdicts.map((test, i) => {
                        const testConfig = tierConfig[test.verdict];
                        return (
                            <div 
                                key={i}
                                className={`bg-[#0a0f1a]/60 border ${test.changed ? 'border-rose-500/30' : 'border-emerald-500/30'} rounded-xl p-4`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={test.changed ? 'text-rose-400' : 'text-emerald-400'}>
                                            {test.changed ? '⚠️' : '✓'}
                                        </span>
                                        <span className="text-slate-200 text-sm">{test.manipulation_type}</span>
                                    </div>
                                    <span className={`${testConfig.bgColor} text-white px-2 py-1 rounded text-xs font-medium`}>
                                        {testConfig.emoji} {testConfig.label}
                                    </span>
                                </div>
                                {test.changed && (
                                    <p className="text-rose-400/80 text-xs mt-2">
                                        ⚠️ Verdict changed under this manipulation
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Bias Indicators */}
                {data.bias_indicators.length > 0 && (
                    <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-4 mb-6">
                        <h4 className="text-rose-400 font-bold mb-2 text-sm">🚨 Potential Bias Indicators</h4>
                        <ul className="space-y-1">
                            {data.bias_indicators.map((indicator, i) => (
                                <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                                    <span className="text-rose-500 mt-0.5">•</span>
                                    {indicator}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

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


