'use client';

import { CrossModelResult, VerdictTier, AgreementLevel } from '@/types';

const tierConfig: Record<VerdictTier, { color: string; bgColor: string; label: string; emoji: string }> = {
    REMOVE: { color: 'text-red-400', bgColor: 'bg-red-600', label: 'Remove', emoji: '🚫' },
    AGE_GATE: { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Age-Gate', emoji: '🔞' },
    REDUCE_REACH: { color: 'text-yellow-400', bgColor: 'bg-yellow-500', label: 'Reduce Reach', emoji: '📉' },
    LABEL: { color: 'text-blue-400', bgColor: 'bg-blue-500', label: 'Label', emoji: '🏷️' },
    ALLOW: { color: 'text-green-400', bgColor: 'bg-green-500', label: 'Allow', emoji: '✅' },
};

const agreementConfig: Record<AgreementLevel, { color: string; bgColor: string; label: string; icon: string }> = {
    full: { color: 'text-green-400', bgColor: 'bg-green-600', label: 'Full Agreement', icon: '✓' },
    partial: { color: 'text-yellow-400', bgColor: 'bg-yellow-600', label: 'Partial Agreement', icon: '~' },
    disagreement: { color: 'text-red-400', bgColor: 'bg-red-600', label: 'Disagreement', icon: '✗' },
};

const modelBranding: Record<string, { name: string; color: string; bgColor: string; icon: string }> = {
    google: { name: 'Gemini', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: '🔷' },
    openai: { name: 'GPT-4', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', icon: '🟢' },
    anthropic: { name: 'Claude', color: 'text-orange-400', bgColor: 'bg-orange-500/20', icon: '🟠' },
};

interface CrossModelCardProps {
    crossModel: CrossModelResult;
}

export function CrossModelCard({ crossModel }: CrossModelCardProps) {
    const agreementBadge = agreementConfig[crossModel.agreement_level];

    return (
        <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            {/* Header with Agreement Badge */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div>
                    <h3 className="text-white text-xl font-bold flex items-center gap-2">
                        <span className="text-2xl">🤖</span> Cross-Model Agreement
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                        Same analysis across different AI model families
                    </p>
                </div>
                <span className={`${agreementBadge.bgColor} text-white px-4 py-2 rounded-full font-bold flex items-center gap-2`}>
                    <span className="text-lg">{agreementBadge.icon}</span>
                    {agreementBadge.label}
                </span>
            </div>

            {/* Escalation Warning */}
            {crossModel.escalation_recommended && (
                <div className="bg-amber-900/30 border-b border-amber-700/50 px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="text-amber-300 font-medium">Human Review Recommended</p>
                        <p className="text-amber-200/70 text-sm">
                            Model disagreement suggests this case may benefit from human judgment
                        </p>
                    </div>
                </div>
            )}

            {/* Model Verdicts Grid */}
            <div className="p-5">
                <div className="grid md:grid-cols-3 gap-4">
                    {crossModel.verdicts.map((verdict) => {
                        const brand = modelBranding[verdict.model_family] || {
                            name: verdict.model_id,
                            color: 'text-slate-400',
                            bgColor: 'bg-slate-500/20',
                            icon: '🔘'
                        };
                        const tier = tierConfig[verdict.verdict_tier];

                        return (
                            <div
                                key={verdict.model_family}
                                className={`${brand.bgColor} border border-slate-600/50 rounded-xl p-4 transition-all hover:border-slate-500`}
                            >
                                {/* Model Header */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl">{brand.icon}</span>
                                    <div>
                                        <h4 className={`${brand.color} font-bold`}>{brand.name}</h4>
                                        <p className="text-slate-500 text-xs">{verdict.model_id}</p>
                                    </div>
                                </div>

                                {/* Verdict Badge */}
                                <div className="mb-4">
                                    <span className={`${tier.bgColor} text-white text-sm px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1`}>
                                        {tier.emoji} {tier.label}
                                    </span>
                                </div>

                                {/* Confidence */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-400">Confidence</span>
                                        <span className={`${brand.color} font-mono`}>
                                            {(verdict.confidence_score * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                verdict.model_family === 'google' ? 'bg-blue-500' :
                                                verdict.model_family === 'openai' ? 'bg-emerald-500' :
                                                'bg-orange-500'
                                            }`}
                                            style={{ width: `${verdict.confidence_score * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Policy Concern */}
                                <div className="mb-3">
                                    <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Policy Concern</p>
                                    <p className={`${brand.color} text-sm font-medium`}>{verdict.key_policy_concern}</p>
                                </div>

                                {/* Reasoning */}
                                <div className="bg-slate-900/50 rounded-lg p-3">
                                    <p className="text-slate-300 text-xs leading-relaxed">{verdict.reasoning_summary}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Disagreement Summary */}
                {crossModel.disagreement_summary && (
                    <div className="mt-5 bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">📊</span>
                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-1">Disagreement Analysis</p>
                                <p className="text-slate-300 text-sm">{crossModel.disagreement_summary}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Insight Box */}
                <div className="mt-5 bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                            <p className="text-purple-300 text-sm font-medium mb-1">Why Cross-Model Agreement Matters</p>
                            <p className="text-purple-200/70 text-xs leading-relaxed">
                                When different AI model families (trained by different companies with different approaches) 
                                reach the same conclusion, it increases confidence in the decision. Disagreement often 
                                indicates genuinely ambiguous cases that benefit from human review.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

